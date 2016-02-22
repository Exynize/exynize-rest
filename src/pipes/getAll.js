import r from 'rethinkdb';
import _ from 'lodash';
import logger from '../logger';
import {Pipeline} from '../db';
import {asyncRequest} from '../util';

const toPrivate = (c) => _.omit(
    c.isPublic ? c : {
        name: 'Private component',
        description: 'This component is private.',
        user: {username: 'private'},
    },
    ['args', 'params']
);

const handler = async (req, res) => {
    logger.debug('searching for pipelines');
    // find pipelines
    const pipelines = await Pipeline.find(
        r.row('isPublic').eq(true).or(r.row('user').eq(req.userInfo.id))
    );
    // filter out private components
    const filteredPipelines = pipelines.map(p => {
        const {components, render, source} = p;
        return {
            ...p,
            components: components.map(toPrivate),
            render: toPrivate(render),
            source: toPrivate(source),
        };
    });
    // return
    res.status(200).json(filteredPipelines);
};

export default asyncRequest.bind(null, handler);
