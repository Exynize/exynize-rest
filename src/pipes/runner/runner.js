import r from 'rethinkdb';
import uuid from 'node-uuid';
import logger from '../../logger';
import setupDb, {PipelineLog, Pipeline} from '../../db';
import {listen, publish} from '../../messagebus';
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
setupDb().then(async () => {
    // ref to rabbit cleanup
    let cleanupBus = Promise.resolve();

    // get reply topic
    const replyTopic = id + '.out';

    // delayed exit command
    const delayedExit = () => {
        // do delayed notification that we're done
        setTimeout(() => {
            promises.push(publish(replyTopic, {
                data: [],
                done: true
            }));
            // if executed in production - update status to done
            promises.push(Pipeline.update(id, {
                status: 'done',
                message: 'success'
            }));
            // close rabbit stuff
            promises.push(cleanupBus());
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
    const {stream, clean} = await runPipeline(pipeline);

    // listen for commands
    cleanupBus = await listen(id + '.in', (payload) => {
        logger.debug('[IN] got payload:', payload);
        if (payload.command === 'kill') {
            clean().forEach(p => promises.push(p));
            delayedExit();
        }
    });

    // subscribe to results
    stream.subscribe(
        data => {
            logger.debug('[OUT] seding pipeline response:', data, 'to topic:', id);
            promises.push(publish(replyTopic, {
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
