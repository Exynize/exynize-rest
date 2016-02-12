import {Exchange} from 'rethinkdb-pubsub';
import {db as dbConfig} from '../../config';

export const testExchange = new Exchange('exynize_rest_exchange', {
    db: dbConfig.database,
    host: dbConfig.host,
    port: dbConfig.port,
});
