import logger from '../logger';
import {Component} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('searching for component', req.params.user, req.params.component);
    // find component
    const component = await Component.getByUserAndRef(req.params.user, req.params.component);
    // delete source if flag is set and user is not owner
    if (!component.isSourcePublic && component.user.id !== req.userInfo.id) {
        // otherwise - delete source and return
        delete component.source;
    }
    // return
    res.status(200).json(component);
};

export default asyncRequest.bind(null, handler);
