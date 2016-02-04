import uuid from 'node-uuid';
import {Observable} from 'rx';
import logger from '../logger';
import service from './service';

export const serviceWithRabbit = (cfg) => {
    // run processor
    const run = async () => {
        // send
        await service.send('runner.execute', cfg);
        logger.debug('[svc]: sent execute to runner');
    };

    // run and catch error
    run().catch(e => logger.error('[svc]: ', e));

    // return new handler
    return (data) => Observable.create(obs => {
        let cachedConsumerTag;
        // generate unique ID for current transaction
        const id = uuid.v4();
        const topic = 'runner.result.' + id;
        // return by type mapping
        const returnByType = {
            result: obs.onNext.bind(obs),
            error: obs.onError.bind(obs),
            done: obs.onCompleted.bind(obs),
        };
        const runCommand = async () => {
            cachedConsumerTag = await service.subscribe(topic, (msg) => {
                // log
                logger.debug('[svc]: got message:', msg.type, 'for:', id);
                // return depending on type
                returnByType[msg.type](msg.data);
            });
            // send
            const request = {id: cfg.id, responseId: id, data};
            await service.send('runner.command', request);
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
            await service.unsubscribe(topic, cachedConsumerTag);
        };
    });
};
