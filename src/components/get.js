import logger from '../logger';
import {Component} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('searching for components');
    // find components
    const components = await Component.find({isPublic: true});
    res.status(200).json(components);
};

export default asyncRequest.bind(null, handler);
