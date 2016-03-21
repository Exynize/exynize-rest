import {Pipeline} from '../db';
import {authedSocket} from '../sockutil';
import logger from '../logger';

export default (ws, req) => {
    const {id} = req.params;
    let cursor;
    logger.debug('getting status socket for', id);

    const start = async () => {
        logger.debug('starting status socket with id:', id);
        // subscribe to pipeline updates
        try {
            cursor = await Pipeline.changes(id);
        } catch (e) {
            // if socket is not open, log and return
            if (ws.readyState !== 1) {
                logger.debug('socket is already closed!');
                return;
            }

            ws.close();
            return;
        }
        logger.debug('found pipeline status feed!');

        cursor.each((err, message) => {
            if (err) {
                ws.close();
                return;
            }

            // if socket is not open, log and return
            if (ws.readyState !== 1) {
                logger.debug('socket is already closed!');
                return;
            }

            const res = message.new_val;
            logger.debug('pipeline update: ', res);
            ws.send(JSON.stringify(res));
        });
    };

    // close cursor once user disconnects
    const end = () => {
        if (cursor) {
            cursor.close();
        }
    };

    authedSocket(ws, {start, end});
};
