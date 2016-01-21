import uuid from 'node-uuid';
import {Observable} from 'rx';
import logger from '../logger';
import {rabbit} from '../../config';
import {getChannel} from './connection';

export const serviceWithRabbit = (cfg) => {
    let channel;
    let cachedQueue;

    // run processor
    const run = async () => {
        channel = await getChannel();
        // assig queue
        const {queue} = await channel.assertQueue(`exynize-runner-exec-${cfg.id}-queue`, {exclusive: true});
        cachedQueue = queue;
        logger.debug('[svc]: got queue');
        // send
        // logger.debug('[svc]: sending:', cfg);
        await channel.publish(rabbit.exchange, 'runner.execute', new Buffer(JSON.stringify(cfg)));
        logger.debug('[svc]: sent execute to runner');
    };

    // run and catch error
    run().catch(e => logger.error('[svc]: ', e));

    // return new handler
    return (data) => Observable.create(obs => {
        let cachedConsumerTag;
        // generate unique ID for current transaction
        const id = uuid.v4();
        // return by type mapping
        const returnByType = {
            result: obs.onNext.bind(obs),
            error: obs.onError.bind(obs),
            done: obs.onCompleted.bind(obs),
        };
        const runCommand = async () => {
            // bind to key
            await channel.bindQueue(cachedQueue, rabbit.exchange, 'runner.result.' + id);
            logger.debug('[svc]: bound queue');
            // listen for messages
            const {consumerTag} = await channel.consume(cachedQueue, (incData) => {
                const msg = JSON.parse(incData.content.toString());
                // acknowledge
                channel.ack(incData);
                // log
                logger.debug('[svc]: got message:', msg.type);//, 'for:', id);
                // return depending on type
                returnByType[msg.type](msg.data);
            });
            cachedConsumerTag = consumerTag;
            // logger.debug('[svc]: got consumer tag:', consumerTag);
            // send
            const request = {id: cfg.id, responseId: id, data};
            await channel.publish(rabbit.exchange, 'runner.command', new Buffer(JSON.stringify(request)));
            // logger.debug('[svc]: sent', data, 'to', id);
        };
        // run command
        runCommand().catch(e => {
            logger.error('[svc]: ERROR ', e);
            obs.onError(e);
        });
        // return cleanup
        return async () => {
            logger.debug('[svc]: cleanup');
            await channel.cancel(cachedConsumerTag);
            await channel.unbindQueue(cachedQueue, rabbit.exchange, 'runner.result.' + id);
        };
    });
};
