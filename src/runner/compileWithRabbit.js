import logger from '../logger';
import {rabbit} from '../../config';
import {getChannel} from './connection';

export const compileWithRabbit = (id, source) => new Promise((resolve, reject) => {
    logger.debug('compiling');
    const run = async () => {
        logger.debug('[cwr]: run');
        const channel = await getChannel();
        logger.debug('[cwr]: got channel');
        // assig queue
        const {queue} = await channel.assertQueue(`exynize-runner-compile-${id}-queue`, {exclusive: true});
        logger.debug('[cwr]: got queue');
        // bind to key
        await channel.bindQueue(queue, rabbit.exchange, 'runner.compileResult.' + id);
        // listen for messages
        channel.consume(queue, async (incData) => {
            const msg = JSON.parse(incData.content.toString());
            logger.debug('[cwr]: got message.');
            // acknowledge
            channel.ack(incData);
            // reject if error
            if (msg.error) {
                logger.error('[cwr]: error, ', msg.error);
                return reject(msg.error);
            }
            // return data
            logger.debug('[cwr]: done...');
            return resolve(msg.data);
        });
        // send
        logger.debug('[cwr]: sending:', id, source);
        channel.publish(rabbit.exchange, 'runner.compile', new Buffer(JSON.stringify({id, source})));
    };
    // trigger
    run();
});
