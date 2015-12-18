import amqp from 'amqplib';
import logger from '../logger';
import {rabbit} from '../../config';

// persist connection and channel
let connection;
let channel;

// connect
const init = async () => {
    connection = await amqp.connect(`amqp://${rabbit.host}`);
    logger.debug('init: connected to rabbit');
    // get two channels - receive and send
    channel = await connection.createChannel();
    logger.debug('init: got channel');
    // assing topic
    await channel.assertExchange(rabbit.exchange, 'topic');
    logger.debug('init: got exchange');
    return channel;
};

export const getChannel = async () => {
    if (channel) {
        return channel;
    }

    return await init();
};
