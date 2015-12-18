import Rx from 'rx';
import amqp from 'amqplib';
import logger from '../logger';
import {rabbit} from '../../config';

export const runWithRabbit = (data) => Rx.Observable.create(obs => {
    let connection;
    let channel;

    const returnByType = {
        result: obs.onNext.bind(obs),
        error: obs.onError.bind(obs),
        done: obs.onCompleted.bind(obs),
    };

    const run = async () => {
        // connect
        connection = await amqp.connect(`amqp://${rabbit.host}`);
        logger.debug('connected to rabbit');
        // get two channels - receive and send
        channel = await connection.createChannel();
        logger.debug('got channel');
        // assing topic
        await channel.assertExchange(rabbit.exchange, 'topic');
        logger.debug('got exchange');
        // assig queue
        const {queue} = await channel.assertQueue('exynize-runner-exec-queue', {exclusive: true});
        logger.debug('got queue');
        // bind to key
        await channel.bindQueue(queue, rabbit.exchange, 'runner.result.' + data.id);
        // listen for messages
        channel.consume(queue, (incData) => {
            const msg = JSON.parse(incData.content.toString());
            logger.debug('got message:', msg);
            // acknowledge
            channel.ack(incData);
            // return depending on type
            returnByType[msg.type](msg.data);
        });
        // send
        logger.debug('sending:', data);
        channel.publish(rabbit.exchange, 'runner.execute', new Buffer(JSON.stringify(data)));
    };

    // run and catch error
    run().catch(e => obs.onError(e));
    // cleanup
    return () => {
        logger.debug('cleanup');
        channel.publish(rabbit.exchange, 'runner.kill', new Buffer(JSON.stringify({id: data.id})));
        setTimeout(() => {
            channel.close();
            connection.close();
        }, 10);
    };
});
