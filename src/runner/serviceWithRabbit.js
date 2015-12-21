import Rx from 'rx';
import logger from '../logger';
import {rabbit} from '../../config';
import {getChannel} from './connection';

export const serviceWithRabbit = (cfg) => {
    let resultObservable;
    let returnByType;
    let channel;

    // init subject function
    const initSubject = () => {
        resultObservable = new Rx.Subject();
        returnByType = {
            result: resultObservable.onNext.bind(resultObservable),
            error: resultObservable.onError.bind(resultObservable),
            done: resultObservable.onCompleted.bind(resultObservable),
        };
    };

    // run
    const run = async () => {
        channel = await getChannel();
        // assig queue
        const {queue} = await channel.assertQueue(`exynize-runner-exec-${cfg.id}-queue`, {exclusive: true});
        logger.debug('[svc]: got queue');
        // bind to key
        await channel.bindQueue(queue, rabbit.exchange, 'runner.result.' + cfg.id);
        // listen for messages
        channel.consume(queue, (incData) => {
            const msg = JSON.parse(incData.content.toString());
            // acknowledge
            channel.ack(incData);
            // log
            logger.debug('[svc]: got message:', msg, 'for:', cfg.id);
            // return depending on type
            returnByType[msg.type](msg.data);
        });
        // send
        logger.debug('[svc]: sending:', cfg);
        channel.publish(rabbit.exchange, 'runner.execute', new Buffer(JSON.stringify(cfg)));
    };

    // run and catch error
    run().catch(e => resultObservable.onError(e));

    // return new handler
    return function(data) {
        // init subject
        initSubject();
        // send
        logger.debug('[svc]: sending', data, 'to', cfg.id);
        channel.publish(rabbit.exchange, 'runner.command', new Buffer(JSON.stringify({id: cfg.id, data})));
        return resultObservable;
    };
};
