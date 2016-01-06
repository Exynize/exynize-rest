import _ from 'lodash';
import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id, name, source, components, render, isPublic} = req.body;
    const refName = _.kebabCase(name);
    logger.debug('creating pipleine', name, refName, source, components, render, isPublic, 'with id:', id);
    // create new component
    let result;
    if (id) {
        result = await Pipeline.update(id, {
            name,
            refName,
            source,
            components,
            render,
            isPublic: Boolean(isPublic),
        });
        logger.debug('updated pipeline: ', result);
    } else {
        result = await Pipeline.create({
            name,
            refName,
            source,
            components,
            render,
            status: 'off',
            message: '',
            isPublic: Boolean(isPublic),
            user: req.userInfo.id,
        });
        logger.debug('created pipeline: ', result);
    }

    if (result.inserted === 1 || result.replaced === 1) {
        res.sendStatus(201);
        return;
    }

    res.status(500).json({error: 'error inserting pipeline!'});
};

export default asyncRequest.bind(null, handler);
