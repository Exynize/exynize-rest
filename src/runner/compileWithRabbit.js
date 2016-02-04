import logger from '../logger';
import service from './service';

export const compileWithRabbit = (id, source) => new Promise((resolve, reject) => {
    logger.debug('compiling');
    const run = async () => {
        let cleanup = () => {};
        logger.debug('[cwr]: run');
        const topic = 'runner.compileResult.' + id;
        const tag = await service.subscribe(topic, (msg) => {
            logger.debug('[cwr]: got message.');
            // reject if error
            if (msg.error) {
                logger.error('[cwr]: error, ', msg.error);
                cleanup();
                return reject(msg.error);
            }
            // return data
            logger.debug('[cwr]: done...');
            cleanup();
            return resolve(msg.data);
        }, {exclusive: true});
        // send
        logger.debug('[cwr]: sending:', id, source);
        service.send('runner.compile', {id, source});
        // define cleanup
        cleanup = async () => {
            logger.debug('[cwr]: cleanup...');
            await service.unsubscribe(topic, tag);
        };
    };
    // trigger
    run();
});
