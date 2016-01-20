import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';
import {publish} from '../messagebus';

const handler = async (req, res) => {
    const {id} = req.params;
    const pipelines = await Pipeline.find({id});
    logger.debug('found pipelines for stop: ', JSON.stringify(pipelines));
    if (pipelines.length !== 1) {
        logger.debug('Found more than one pipeline, wtf?!');
        res.status(500).json({message: 'Found more than one pipeline, wtf?!'});
        return;
    }

    const pipeline = pipelines[0];
    logger.debug('stopping pipleine', JSON.stringify(pipeline));
    // get topic
    await publish(pipeline.id + '.in', {command: 'kill'});
    // say we're good
    res.sendStatus(204);
};

export default asyncRequest.bind(null, handler);
