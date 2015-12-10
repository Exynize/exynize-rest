import logger from '../logger';
import {PipelineLog} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id} = req.params;
    logger.debug('getting log for', id);
    const pipelineLog = await PipelineLog.find({pipeline: id});
    // say we're good
    res.status(200).json(pipelineLog);
};

export default asyncRequest.bind(null, handler);
