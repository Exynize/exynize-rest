import _ from 'lodash';
import fs from 'fs';
import {join} from 'path';
import {asyncRequest} from '../util';
import logger from '../logger';
import {Component} from '../db';
import {compileWithRabbit} from '../runner';

const handler = async (req, res, next) => {
    const {id, name, description, version, source, params, type, isPublic, isSourcePublic} = req.body;
    const refName = _.kebabCase(name);
    logger.debug('creating component',
        name, refName, description, version, source, params,
        type, isPublic, isSourcePublic);
    // create data
    const componentData = {
        name,
        refName,
        version,
        description,
        source,
        type,
        params,
        isPublic: Boolean(isPublic),
        isSourcePublic: Boolean(isSourcePublic),
    };
    let result;
    if (id) {
        result = await Component.update(id, componentData);
        logger.debug('updated component: ', result);
    } else {
        // create new component
        result = await Component.create({
            ...componentData,
            user: req.userInfo.id,
        });
        logger.debug('created component: ', result);
    }

    if (result.inserted === 1 || result.replaced === 1) {
        // if render, compile source
        if (type === 'render') {
            const newId = result.inserted === 1 ? result.generated_keys[0] : id;
            const filepath = join(__dirname, '..', 'static', newId + '.min.js');
            const compiled = await compileWithRabbit(newId, source);
            logger.debug('compiled webpack');
            fs.writeFileSync(filepath, compiled, 'utf8');
            res.sendStatus(201);
            return;
        }

        res.sendStatus(201);
        return;
    }

    res.status(500).json({message: 'error inserting component!'});
};

export default asyncRequest.bind(null, handler);
