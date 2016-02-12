import r from 'rethinkdb';
import logger from '../logger';
import {rdb} from './connection';

const table = async function() {
    const {db, connection} = await rdb();
    const t = db.table('pipelineLog');
    return {db, t, connection};
};

const find = async function(pattern) {
    const {t, connection} = await table();
    const cursor = await t.filter(pattern).group('sessionId').run(connection);
    let result = [];
    try {
        result = await cursor.toArray();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no pipeline log found');
        } else {
            throw err;
        }
    }
    connection.close();
    return result;
};

const latest = async function(pattern) {
    const {t, connection} = await table();
    const cursor = await t.filter(pattern)
        .group('sessionId').ungroup().map(it => it('reduction'))
        .orderBy(r.desc(it => it('added_on')))
        .nth(0).orderBy(r.desc('added_on'))
        .default([])
        .run(connection);
    let result = null;
    try {
        result = await cursor.toArray();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no pipeline log found');
        } else {
            throw err;
        }
    }
    connection.close();
    return result;
};

const create = async function(data: Object) {
    const {t, connection} = await table();
    logger.debug('inserting pipeline log:', data);
    const res = await t.insert(data).run(connection);
    connection.close();
    return res;
};


export const PipelineLog = {
    find,
    latest,
    create,
};
