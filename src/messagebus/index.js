import logger from '../logger';
import {getChannel} from '../runner';
import {rabbit} from '../../config';

export const listen = async (topic: string, callback:Function) => {
    const channel = await getChannel();
    // assign queue
    const {queue} = await channel.assertQueue(`exynize-result-${topic}-queue`, {exclusive: true});
    logger.debug('[messagebus]: got queue', queue);
    // bind to keys
    await channel.bindQueue(queue, rabbit.exchange, topic);
    logger.debug(`[messagebus]: bound queue to "${topic}", consuming...`);
    // listen for messages
    const {consumerTag} = await channel.consume(queue, (data) => {
        // get message
        const msg = JSON.parse(data.content.toString());
        logger.debug(`[messagebus]: got new message:`, data.content.toString());
        // pass to callback
        callback(msg);
        // acknowledge
        channel.ack(data);
    });
    logger.debug(`[messagebus]: got tag for "${topic}": ${consumerTag}`);

    return async () => {
        await channel.cancel(consumerTag);
        await channel.unbindQueue(queue, rabbit.exchange, topic);
        logger.debug(`[messagebus]: cleaned up for "${topic}", "${consumerTag}"`);
    };
};

export const publish = async (topic: string, message: Object|String) => {
    const channel = await getChannel();
    logger.debug(`[messagebus]: sending to ${topic}:`, message);
    // send
    return channel.publish(rabbit.exchange, topic, new Buffer(JSON.stringify(message)));
};
