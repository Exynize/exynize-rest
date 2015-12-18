import logger from '../logger';
import {rabbit} from '../../config';
import {getChannel} from './connection';

export const stopWithRabbit = (id) => {
    logger.debug('stopping', id);
    getChannel().then(ch => ch.publish(rabbit.exchange, 'runner.kill', new Buffer(JSON.stringify({id}))));
};
