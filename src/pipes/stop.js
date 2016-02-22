import logger from '../logger';
import {Pipeline, testExchange} from '../db';
import {asyncRequest} from '../util';

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
    // only allow starting if owner
    if (pipeline.user.username !== req.userInfo.username) {
        return res.status(403).json(`You don't have permission to do this!`);
    }
    // get topic
    const childTopic = testExchange.topic(pipeline.id + '.in');
    await childTopic.publish({command: 'kill'});
    // say we're good
    res.sendStatus(204);
};

export default asyncRequest.bind(null, handler);
