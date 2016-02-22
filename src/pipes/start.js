import {join} from 'path';
import {fork} from 'child_process';
import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id} = req.params;
    const pipelines = await Pipeline.find({id});
    logger.debug('found pipelines for start: ', JSON.stringify(pipelines));
    if (pipelines.length !== 1) {
        logger.debug('Found more than one pipeline, wtf?!');
        return res.status(500).json({message: 'Found more than one pipeline, wtf?!'});
    }

    const pipeline = pipelines[0];
    logger.debug('starting pipleine', JSON.stringify(pipeline));
    // only allow starting if owner
    if (pipeline.user.username !== req.userInfo.username) {
        return res.status(403).json(`You don't have permission to do this!`);
    }

    // die if it's already running
    if (pipeline.status === 'running') {
        logger.debug('pipleine already running, dying', pipeline.id);
        // say we're good
        return res.status(500).json({error: 'Pipeline already running!'});
    }
    // fork child
    fork(join(__dirname, 'runner', 'index.js'), [id, JSON.stringify(pipeline)]);
    // say we're good
    res.sendStatus(204);
};

export default asyncRequest.bind(null, handler);
