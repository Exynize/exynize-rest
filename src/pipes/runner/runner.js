import r from 'rethinkdb';
import uuid from 'node-uuid';
import logger from '../../logger';
import setupDb, {testExchange, PipelineLog, Pipeline} from '../../db';
import {runPipeline} from './runPipeline';

// get args
const [,, id, pipelineJSON] = process.argv;
const pipeline = JSON.parse(pipelineJSON);
logger.debug('running child with id', id);

// generate sessionId
const sessionId = uuid.v1();

// promises to do before exit
const promises = [];

// setup db, then do work
setupDb().then(() => {
    // get reply topic
    const replyTopic = testExchange.topic(id + '.out');

    // delayed exit command
    const delayedExit = () => {
        // do delayed notification that we're done
        setTimeout(() => {
            promises.push(replyTopic.publish({
                data: [],
                done: true
            }));
            // if executed in production - update status to done
            promises.push(Pipeline.update(id, {
                status: 'done',
                message: 'success'
            }));
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
    const {stream, clean} = runPipeline(pipeline);

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
            // if executed in production - update status to error
            promises.push(Pipeline.update(id, {
                status: 'error',
                message: e.message
            }));
        }, () => {
            logger.debug('[OUT] pipeline done, scheduling exit');
            clean().forEach(p => promises.push(p));
            delayedExit();
        }
    );
});
