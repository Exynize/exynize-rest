import Rx from 'rx';
import logger from '../logger';
import {rabbit} from '../../config';
import {getChannel} from './connection';

export const runWithRabbit = (data) => Rx.Observable.create(obs => {
    let channel;

    const returnByType = {
        result: obs.onNext.bind(obs),
        error: obs.onError.bind(obs),
        done: obs.onCompleted.bind(obs),
    };

    const run = async () => {
        logger.debug('[rwr]: run');
        channel = await getChannel();
        logger.debug('[rwr]: got channel');
        // assig queue
        const {queue} = await channel.assertQueue(`exynize-runner-exec-${data.id}-queue`, {exclusive: true});
        logger.debug('[rwr]: got queue');
        // bind to key
        await channel.bindQueue(queue, rabbit.exchange, 'runner.result.' + data.id);
        // listen for messages
        channel.consume(queue, (incData) => {
            const msg = JSON.parse(incData.content.toString());
            logger.debug('[rwr]: got message:', msg);
            // acknowledge
            channel.ack(incData);
            // return depending on type
            returnByType[msg.type](msg.data);
        });
        // send
        logger.debug('[rwr]: sending:', data);
        channel.publish(rabbit.exchange, 'runner.execute', new Buffer(JSON.stringify(data)));
    };

    // run and catch error
    run().catch(e => obs.onError(e));
    // cleanup
    return () => {
        logger.debug('[rwr]: cleanup');
        channel.publish(rabbit.exchange, 'runner.kill', new Buffer(JSON.stringify({id: data.id})));
    };
});
