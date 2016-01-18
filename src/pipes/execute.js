import {runPipeline} from './runner/runPipeline';
import {authedSocket} from '../sockutil';
import logger from '../logger';

export default (ws) => {
    let cleanRunners;

    const start = async (data: Object) => {
        const {pipeline: pipelineJSON} = data;
        const pipeline = JSON.parse(pipelineJSON);
        logger.debug('executing pipe:', JSON.stringify(pipeline, null, 4));

        // get source
        const {stream, clean} = await runPipeline(pipeline);
        cleanRunners = clean;
        // subscribe
        stream.subscribe(
            resp => {
                logger.debug('[RESPONSE]:', resp);
                // if socket is not open
                if (ws.readyState !== 1) {
                    logger.debug('socket is already closed!');
                    return;
                }

                ws.send(JSON.stringify(resp));
            },
            e => {
                logger.error(e);
            },
            () => {
                ws.close();
            }
        );
    };

    const end = () => {
        cleanRunners();
    };

    authedSocket(ws, {start, end});
};
