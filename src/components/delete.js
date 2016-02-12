import logger from '../logger';
import {Component} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('deleting component', req.params.user, req.params.component);
    // find component
    const component = await Component.getByUserAndRef(req.params.user, req.params.component);
    const result = await Component.del(component.id);
    if (result.deleted === 1) {
        // return
        res.sendStatus(204);
    } else {
        res.status(500).json(`Oops, couldn't delete component! Something went wrong!`);
    }
};

export default asyncRequest.bind(null, handler);
