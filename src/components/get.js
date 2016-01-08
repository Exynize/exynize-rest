import logger from '../logger';
import {Component} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('searching for component', req.params.user, req.params.component);
    // find component
    const component = await Component.getByUserAndRef(req.params.user, req.params.component);
    // return
    res.status(200).json(component);
};

export default asyncRequest.bind(null, handler);
