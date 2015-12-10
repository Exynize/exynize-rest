import Rx from 'rx';
import r from 'rethinkdb';
import uuid from 'node-uuid';
import logger from '../../logger';
import {compileInVm} from '../../vm';
import setupDb, {testExchange, PipelineLog, Pipeline} from '../../db';

// get args
const [,, id, pipelineJSON, execMode = 'production'] = process.argv;
const pipeline = JSON.parse(pipelineJSON);
logger.debug('running child with id', id, 'with mode:', execMode);
// generate session id
const sessionId = uuid.v1();
logger.debug('starting with sessionId:', sessionId);

// compile functions
const sourceComponent = compileInVm(pipeline.source.source).bind(undefined, ...pipeline.source.args);
const functions = pipeline.components.map(component => {
    const fn = compileInVm(component.source);
    return fn.bind(undefined, ...component.args);
});

// promises array, so that we can wait for all messages
// to be sent before closing down
const promises = [];

// setup db, then do work
setupDb().then(() => {
    // get reply topic
    const replyTopic = testExchange.topic(id + '.out');

    // delayed exit command
    const delayedExit = () => {
        // do delayed notification that we're done
        setTimeout(() => {
            promises.push(replyTopic.publish({data: [], done: true}));
            // if executed in production - update status to done
            if (execMode === 'production') {
                promises.push(Pipeline.update(id, {status: 'done', message: 'success'}));
            }
            // do delayed close to say we're done
            Promise.all(promises).then(() => process.exit());
        }, 500);
    };

    // listen for commands
    testExchange
    .queue(topic => topic.eq(id + '.in'))
    .subscribe((topic, payload) => {
        logger.debug('[IN] for topic:', topic, 'got payload:', payload);
        if (payload.command === 'kill') {
            delayedExit();
        }
    });

    // if executed in production - set pipeline status to 'running'
    if (execMode === 'production') {
        promises.push(Pipeline.update(id, {status: 'running', message: ''}));
    }

    // assembe pipeline
    logger.debug('assembling source..');
    const source = Rx.Observable.create(sourceComponent);
    logger.debug('assembling pipeline..');
    const finalStream = functions.reduce((stream, fn) => stream.flatMap(fn), source);
    logger.debug('executing pipeline..');
    finalStream.subscribe(
        data => {
            logger.debug('[OUT] seding pipeline response:', data, 'to topic:', id);
            promises.push(replyTopic.publish({data, done: false}));
            // if executed in production - push to persistent db log
            if (execMode === 'production') {
                promises.push(PipelineLog.create({
                    pipeline: id,
                    sessionId,
                    data,
                    added_on: r.now(), // eslint-disable-line
                }));
            }
        },
        e => {
            logger.error('[OUT] error in pipline:', e);
            // if executed in production - update status to error
            if (execMode === 'production') {
                promises.push(Pipeline.update(id, {status: 'error', message: e.message}));
            }
        },
        () => {
            logger.debug('[OUT] pipeline done, scheduling exit');
            delayedExit();
        }
    );
});
