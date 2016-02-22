import _ from 'lodash';
import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';
import service from '../runner/service';
import {rabbit} from '../../config';

const handler = async (req, res) => {
    logger.debug('searching for pipeline', req.params.user, req.params.pipeline);
    // find pipeline
    const pipeline = await Pipeline.getByUserAndRef(req.params.user, req.params.pipeline);
    if (!pipeline) {
        return res.sendStatus(404);
    }
    // send
    const data = {
        type: 'incoming-http-request',
        ..._.pick(req, ['body', 'cookies', 'method', 'query'])
    };
    const request = {id: pipeline.instance.sourceId, data};
    await service.send('runner.command', request, {expiration: rabbit.messageExpiration});
    // return
    res.sendStatus(202);
};

export default asyncRequest.bind(null, handler);
