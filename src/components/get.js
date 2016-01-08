import r from 'rethinkdb';
import logger from '../logger';
import {Component} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('searching for components');
    // find components
    const result = await Component.find(
        r.row('isPublic').eq(true).or(r.row('user').eq(req.userInfo.id))
    );
    // remove source where needed
    const components = result.map(component => {
        // always show full info to creator
        if (component.user.id === req.userInfo.id) {
            return component;
        }
        // show source if flag is set
        if (component.isSourcePublic) {
            return component;
        }
        // otherwise - delete source and return
        delete component.source;
        return component;
    });
    // return
    res.status(200).json(components);
};

export default asyncRequest.bind(null, handler);
