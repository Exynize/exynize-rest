import Rx from 'rx';
import logger from '../logger';
import service from './service';
import {rabbit} from '../../config';

export const runWithRabbit = (data) => Rx.Observable.create(obs => {
    let cachedConsumerTag;

    const topic = 'runner.result.' + data.id;

    const returnByType = {
        result: obs.onNext.bind(obs),
        error: obs.onError.bind(obs),
        done: obs.onCompleted.bind(obs),
    };

    const run = async () => {
        logger.debug('[rwr]: run');
        cachedConsumerTag = await service.subscribe(topic, (msg) => {
            // return depending on type
            returnByType[msg.type](msg.data);
        }, {exclusive: true});
        service.send('runner.execute', data, {expiration: rabbit.messageExpiration});
    };

    // run and catch error
    run().catch(e => {
        logger.error('[rwr]: ERROR ', e);
        obs.onError(e);
    });
    // cleanup
    return async () => {
        logger.debug('[rwr]: cleanup');
        await service.send('runner.kill', {id: data.id}, {expiration: rabbit.messageExpiration});
        await service.unsubscribe(topic, cachedConsumerTag);
    };
});
