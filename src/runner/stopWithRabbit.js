import logger from '../logger';
import service from './service';

export const stopWithRabbit = (id) => {
    logger.debug('stopping', id);
    return service.send('runner.kill', {id});
};
