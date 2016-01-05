import r from 'rethinkdb';
import logger from '../logger';
import {db as dbConfig} from '../../config';

const setup = async function() {
    // connect
    const connection = await r.connect({host: dbConfig.host, port: dbConfig.port});
    // create db
    try {
        await r.dbCreate(dbConfig.database).run(connection);
    } catch (e) {
        logger.debug('db already exists! done.');
        return;
    }

    // create tables and indices
    await Promise.all([
        // users
        r.db(dbConfig.database).tableCreate('users').run(connection),
        // components
        r.db(dbConfig.database).tableCreate('components').run(connection),
        // pipelines
        r.db(dbConfig.database).tableCreate('pipelines').run(connection),
        // pipelines execution log
        r.db(dbConfig.database).tableCreate('pipelineLog').run(connection),
        // pipeline communication bus
        r.db(dbConfig.database).tableCreate('exynize_rest_exchange').run(connection),
    ]);
};

const rdb = async function() {
    const connection = await r.connect({host: dbConfig.host, port: dbConfig.port});
    const db = r.db(dbConfig.database);
    return {db, connection};
};

export {setup, rdb};
