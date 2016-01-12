import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('searching for pipeline', req.params.user, req.params.pipeline);
    // find pipeline
    const pipeline = await Pipeline.getByUserAndRef(req.params.user, req.params.pipeline);
    // return
    res.status(200).json(pipeline);
};

export default asyncRequest.bind(null, handler);
