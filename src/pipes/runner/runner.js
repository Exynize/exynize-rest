import r from 'rethinkdb';
import uuid from 'node-uuid';
import logger from '../../logger';
import setupDb, {testExchange, PipelineLog, Pipeline} from '../../db';
import {runPipeline} from './runPipeline';
import service from '../../runner/service';

// get args
const [,, id, pipelineJSON] = process.argv;
const pipeline = JSON.parse(pipelineJSON);
logger.debug('running child with id', id);

// generate sessionId
const sessionId = uuid.v4();

// promises to do before exit
const promises = [];

// setup db, then do work
setupDb().then(async () => {
    // get reply topic
    const replyTopic = testExchange.topic(id + '.out');

    // delayed exit command
    const delayedExit = ({
        status = 'done',
        message = 'success',
    } = {}) => {
        // do delayed notification that we're done
        setTimeout(() => {
            promises.push(replyTopic.publish({
                data: [],
                done: true
            }));
            // if executed in production - update status to done
            promises.push(Pipeline.update(id, {status, message}));
            // shut down microwork service
            promises.push(service.stop());
            // do delayed close to say we're done
            Promise.all(promises).then(() => process.exit());
        }, 500);
    };

    // if executed in production - set pipeline status to 'running'
    promises.push(Pipeline.update(id, {
        status: 'running',
        message: ''
    }));

    // start pipeline
    logger.debug('executing pipeline..');
    const {stream, clean} = await runPipeline(pipeline, true);

    // listen for commands
    testExchange
        .queue(topic => topic.eq(id + '.in'))
        .subscribe((topic, payload) => {
            logger.debug('[IN] for topic:', topic, 'got payload:', payload);
            if (payload.command === 'kill') {
                clean().forEach(p => promises.push(p));
                delayedExit();
            }
        });

    // subscribe to results
    stream.subscribe(
        data => {
            logger.debug('[OUT] seding pipeline response:', data, 'to topic:', id);
            promises.push(replyTopic.publish({
                data, done: false
            }));
            // if executed in production - push to persistent db log
            promises.push(PipelineLog.create({
                pipeline: id,
                sessionId,
                data,
                added_on: r.now(), // eslint-disable-line
            }));
        },
        e => {
            logger.error('[OUT] error in pipline:', e);
            // if executed in production - push error to persistent db log
            promises.push(PipelineLog.create({
                pipeline: id,
                sessionId,
                data: {
                    type: 'error',
                    error: e,
                },
                added_on: r.now(), // eslint-disable-line
            }));
            // schedule exit
            logger.debug('[OUT] scheduling exit...');
            clean().forEach(p => promises.push(p));
            delayedExit({
                status: 'error',
                message: e.message || JSON.stringify(e)
            });
        }, () => {
            logger.debug('[OUT] pipeline done, scheduling exit');
            clean().forEach(p => promises.push(p));
            delayedExit();
        }
    );
});
