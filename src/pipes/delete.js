import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('deleting pipeline', req.params.user, req.params.pipeline);
    // find pipeline
    const pipeline = await Pipeline.getByUserAndRef(req.params.user, req.params.pipeline);
    const result = await Pipeline.del(pipeline.id);
    if (result.deleted === 1) {
        // return
        res.sendStatus(204);
    } else {
        res.status(500).json(`Oops, couldn't delete pipeline! Something went wrong!`);
    }
};

export default asyncRequest.bind(null, handler);
