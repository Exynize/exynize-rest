import _ from 'lodash';
import fs from 'fs';
import {join} from 'path';
import webpack from 'webpack';
import {asyncRequest} from '../util';
import configBase from '../webpack/webpack.config.base.js';
import logger from '../logger';
import {Component} from '../db';

const handler = async (req, res, next) => {
    const {id, name, description, source, params, type, isPublic, isSourcePublic} = req.body;
    logger.debug('creating component', name, description, source, params, type, isPublic, isSourcePublic);
    let result;
    if (id) {
        result = await Component.update(id, {
            name,
            description,
            source,
            type,
            params,
            isPublic: Boolean(isPublic),
            isSourcePublic: Boolean(isSourcePublic),
        });
        logger.debug('updated component: ', result);
    } else {
        // create new component
        result = await Component.create({
            name,
            description,
            source,
            type,
            params,
            isPublic: Boolean(isPublic),
            isSourcePublic: Boolean(isSourcePublic),
            user: req.userInfo.id,
        });
        logger.debug('created component: ', result);
    }

    if (result.inserted === 1 || result.replaced === 1) {
        // if render, compile source
        if (type === 'render') {
            const newId = result.inserted === 1 ? result.generated_keys[0] : id;
            const filepath = join(__dirname, '..', 'static', newId + '.js');
            fs.writeFileSync(filepath, source, 'utf8');
            const config = _.merge({}, configBase, {
                entry: filepath,
                output: {
                    filename: newId + '.min.js',
                    libraryTarget: 'umd',
                },
                resolve: {
                    modulesDirectories: [join(__dirname, '..', 'client', 'node_modules')],
                },
            }, (a, b) => {
                if (_.isArray(a)) {
                    return a.concat(b);
                }
            });
            const compiler = webpack(config);
            compiler.run(function(err) {
                if (err) {
                    logger.error('error compiling webpack:', err);
                    next(err);
                    return;
                }

                logger.debug('compiled webpack');
                res.sendStatus(201);
            });
            return;
        }

        res.sendStatus(201);
        return;
    }

    res.status(500).json({message: 'error inserting component!'});
};

export default asyncRequest.bind(null, handler);
