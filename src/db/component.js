import logger from '../logger';
import {rdb} from './connection';

const table = async function() {
    const {db, connection} = await rdb();
    const t = db.table('components');
    return {t, connection};
};

const find = async function(pattern) {
    const {t, connection} = await table();
    const cursor = await t.filter(pattern).run(connection);
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
    create,
    update,
};
