import {testExchange, Pipeline, PipelineLog} from '../db';
import {checkStringToken} from '../users/checkToken';
import logger from '../logger';

export default (ws, req) => {
    const {user, pipeline: pipelineName} = req.params;
    logger.debug('getting socket for', user, pipelineName);

    // listen for message
    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);

        logger.debug('starting socket with id:', user, pipelineName);
        // get pipeline
        const pipeline = await Pipeline.getByUserAndRef(user, pipelineName);
        logger.debug('found pipeline', pipeline.id);
        // check for auth if needed
        if (!pipeline.isPublic) {
            // check auth
            try {
                const authUser = await checkStringToken(data.token);
                if (!authUser || authUser.username !== user) {
                    throw new Error('Not authorized');
                }
            } catch (e) {
                ws.send(JSON.stringify({error: e.message}));
                ws.close();
                return;
            }
        }
        // if pipeline is not running, just send latest results from DB
        const pipelineLog = await PipelineLog.latest({pipeline: pipeline.id});
        const res = pipelineLog.map(it => it.data);
        ws.send(JSON.stringify(res));
        // if pipeline is not running, just die
        if (pipeline.status !== 'running') {
            ws.close();
            return;
        }

        // otherwise subscribe to current socket result
        testExchange
        .queue(topic => topic.eq(pipeline.id + '.out'))
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
    });
};
