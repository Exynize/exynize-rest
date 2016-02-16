import logger from '../logger';
import {Pipeline} from '../db';
import service from '../runner/service';

export default async (ws, req) => {
    const {user, pipeline: pipelineName} = req.params;
    // find pipeline
    logger.debug('starting socket with id:', user, pipelineName);
    // get pipeline
    const pipeline = await Pipeline.getByUserAndRef(user, pipelineName);
    if (!pipeline) {
        ws.send({error: 'pipeline not found'});
        ws.close();
        return;
    }
    logger.debug('found pipeline', pipeline.id);
    // wait for messages
    ws.on('message', async (msg) => {
        const incData = JSON.parse(msg);
        // send
        const data = {
            type: 'incoming-http-request',
            method: 'ws',
            ...incData,
        };
        const request = {id: pipeline.instance.sourceId, data};
        await service.send('runner.command', request, {expiration: 500});
    });
};
