import {testExchange, Pipeline, PipelineLog} from '../db';
import {authedSocket} from '../sockutil';
import logger from '../logger';

export default (ws, req) => {
    const {id} = req.params;
    logger.debug('getting socket for', id);

    const start = async () => {
        logger.debug('starting socket with id:', id);
        // get pipeline
        const pipeline = await Pipeline.get(id);
        logger.debug('found pipeline', pipeline.id);
        // if pipeline is not running, just send latest results from DB
        const pipelineLog = await PipelineLog.latest({pipeline: id});
        const res = pipelineLog.map(it => it.data);
        ws.send(JSON.stringify(res));
        // if pipeline is not running, just die
        if (pipeline.status !== 'running') {
            ws.close();
            return;
        }

        // otherwise subscribe to current socket result
        testExchange
        .queue(topic => topic.eq(id + '.out'))
        .subscribe((topic, payload) => {
            logger.debug('[SOCKET-RESPONSE] for topic:', topic, 'got payload:', payload);
            // if socket is not open
            if (ws.readyState !== 1) {
                logger.debug('socket is already closed!');
                return;
            }

            // if done - close socket
            if (payload.done) {
                ws.close();
                return;
            }

            ws.send(JSON.stringify(payload.data));
        });
    };

    authedSocket(ws, {start});
};
