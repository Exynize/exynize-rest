import r from 'rethinkdb';
import logger from '../logger';
import {Component} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('searching for components');
    // find components
    const components = await Component.find(
        r.row('isPublic').eq(true).or(r.row('user').eq(req.userInfo.id))
    );
    res.status(200).json(components);
};

export default asyncRequest.bind(null, handler);
