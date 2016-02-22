import logger from '../logger';
import service from './service';
import {rabbit} from '../../config';

export const stopWithRabbit = (id) => {
    logger.debug('stopping', id);
    return service.send('runner.kill', {id}, {expiration: rabbit.messageExpiration});
};
