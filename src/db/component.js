import logger from '../logger';
import {rdb} from './connection';

const userFields = ['id', 'email', 'username'];

const table = async function() {
    const {db, connection} = await rdb();
    const t = db.table('components');
    return {db, t, connection};
};

const find = async function(pattern) {
    const {db, t, connection} = await table();
    const cursor = await t.filter(pattern)
        .merge(c => ({user: db.table('users').get(c('user')).pluck(userFields)}))
        .run(connection);
    let result = [];
    try {
        result = await cursor.toArray();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no users found');
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
            .merge(c => ({user: db.table('users').get(c('user')).pluck(userFields)}))
            .run(connection);
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

const create = async function(data: Object) {
    const {t, connection} = await table();
    const res = t.insert(data).run(connection);
    return res;
};

const update = async function(pattern: string|Object, data: Object) {
    const {t, connection} = await table();
    logger.debug('updating component:', pattern, 'with:', data);
    return t.get(pattern).update(data).run(connection);
};

export const Component = {
    find,
    get,
    getByUserAndRef,
    create,
    update,
};
