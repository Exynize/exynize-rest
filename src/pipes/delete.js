import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('deleting pipeline', req.params.user, req.params.pipeline);
    // only allow deleting if owner
    if (req.params.user !== req.userInfo.username) {
        return res.status(403).json(`You don't have permission to do this!`);
    }
    // find pipeline
    const pipeline = await Pipeline.getByUserAndRef(req.params.user, req.params.pipeline);
    const result = await Pipeline.del(pipeline.id);
    if (result.deleted === 1) {
        res.sendStatus(204);
    } else {
        res.status(500).json(`Oops, couldn't delete pipeline! Something went wrong!`);
    }
};

export default asyncRequest.bind(null, handler);
