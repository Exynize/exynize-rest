import logger from '../logger';
import {rdb} from './connection';

const table = async function() {
    const {db, connection} = await rdb();
    const t = db.table('pipelines');
    return {db, t, connection};
};

const find = async function(pattern) {
    const {db, t, connection} = await table();
    const cursor = await t.filter(pattern)
        .merge(pipe => ({user: db.table('users').get(pipe('user')).without('password')}))
        .merge(pipe => ({
            source: pipe('source').merge(comp => db.table('components').get(comp('id'))),
            components: pipe('components').merge(comp => db.table('components').get(comp('id'))),
            render: pipe('render').merge(comp => db.table('components').get(comp('id'))),
        }))
        .run(connection);
    let result = [];
    try {
        result = await cursor.toArray();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no pipelines found');
        } else {
            throw err;
        }
    }
    connection.close();
    return result;
};

const get = async function(id: string|Object) {
    const {db, t, connection} = await table();
    let result = null;
    try {
        result = await t.get(id)
            .merge(pipe => ({user: db.table('users').get(pipe('user')).without('password')}))
            .merge(pipe => ({
                source: pipe('source').merge(comp => db.table('components').get(comp('id'))),
                components: pipe('components').merge(comp => db.table('components').get(comp('id'))),
                render: pipe('render').merge(comp => db.table('components').get(comp('id'))),
            }))
            .run(connection);
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no pipelines found');
        } else {
            throw err;
        }
    }
    connection.close();
    return result;
};

const create = async function(data: Object) {
    const {t, connection} = await table();
    return t.insert(data).run(connection);
};

const update = async function(pattern: string|Object, data: Object) {
    const {t, connection} = await table();
    logger.debug('updating pipeline:', pattern, 'with:', data);
    return t.get(pattern).update(data).run(connection);
};


export const Pipeline = {
    find,
    get,
    create,
    update,
};
