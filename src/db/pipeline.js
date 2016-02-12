import logger from '../logger';
import {rdb} from './connection';

const userFields = ['id', 'email', 'username'];
const deletedUser = {username: 'deleted'};
const deletedComponent = {user: -1, name: 'component', description: 'This component was deleted'};

const table = async function() {
    const {db, connection} = await rdb();
    const t = db.table('pipelines');
    return {db, t, connection};
};

const mergeWithComponents = (db, pipe) => ({
    source: pipe('source').merge(
        comp => db.table('components')
            .get(comp('id'))
            .default(deletedComponent)
            .merge(c => ({user: db.table('users').get(c('user')).default(deletedUser).pluck(userFields)}))
    ),
    components: pipe('components').merge(
        comp => db.table('components')
            .get(comp('id'))
            .default(deletedComponent)
            .merge(c => ({user: db.table('users').get(c('user')).default(deletedUser).pluck(userFields)}))
    ),
    render: pipe('render').merge(
        comp => db.table('components')
            .get(comp('id'))
            .default(deletedComponent)
            .merge(c => ({user: db.table('users').get(c('user')).default(deletedUser).pluck(userFields)}))
    ),
});

const find = async function(pattern) {
    const {db, t, connection} = await table();
    const cursor = await t.filter(pattern)
        .merge(pipe => ({user: db.table('users').get(pipe('user')).pluck(userFields)}))
        .merge(pipe => mergeWithComponents(db, pipe))
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

const getByUserAndRef = async function(username, refName) {
    const {db, t, connection} = await table();
    const cursor = await t.eqJoin('user', db.table('users'))
        .filter({left: {refName}, right: {username}})
        .map(row => row('left').merge({user: row('right').pluck(userFields)}))
        .merge(pipe => mergeWithComponents(db, pipe))
        .limit(1)
        .run(connection);
    let result = {};
    try {
        result = await cursor.next();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no components found');
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
            .merge(pipe => ({user: db.table('users').get(pipe('user')).pluck(userFields)}))
            .merge(pipe => mergeWithComponents(db, pipe))
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
    const result = await t.insert(data).run(connection);
    connection.close();
    return result;
};

const update = async function(pattern: string|Object, data: Object) {
    const {t, connection} = await table();
    logger.debug('updating pipeline:', pattern, 'with:', data);
    const result = await t.get(pattern).update(data).run(connection);
    connection.close();
    return result;
};

const changes = async function(id: string) {
    const {t, connection} = await table();
    logger.debug('subscribing to pipeline status:', id);
    return t.get(id).changes().run(connection);
};

const del = async function(id) {
    const {t, connection} = await table();
    const result = await t.get(id).delete().run(connection);
    connection.close();
    return result;
};

export const Pipeline = {
    find,
    get,
    getByUserAndRef,
    create,
    update,
    changes,
    del,
};
