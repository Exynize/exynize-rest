import {runPipeline} from './runner/runPipeline';
import {authedSocket} from '../sockutil';
import logger from '../logger';

export default (ws) => {
    let cleanRunners;

    const start = async (data: Object) => {
        const {pipeline: pipelineJSON} = data;
        const pipeline = JSON.parse(pipelineJSON);
        logger.debug('[execute] executing pipe:', JSON.stringify(pipeline, null, 4));

        // get source
        const {stream, clean} = await runPipeline(pipeline);
        cleanRunners = clean;
        // subscribe
        stream.subscribe(
            resp => {
                // logger.debug('[execute] response:', resp);
                // if socket is not open, log and return
                if (ws.readyState !== 1) {
                    logger.debug('[execute] socket is already closed!');
                    return;
                }

                ws.send(JSON.stringify(resp));
            },
            error => {
                logger.error('[execute] error:', error);
                // if socket is not open, log and return
                if (ws.readyState !== 1) {
                    logger.debug('[execute] socket is already closed!');
                    return;
                }

                ws.send(JSON.stringify({error}));
                ws.close();
            },
            () => {
                logger.debug('[execute] done!');
                // if socket is not open, log and return
                if (ws.readyState !== 1) {
                    logger.debug('[execute] socket is already closed!');
                    return;
                }

                ws.close();
            }
        );
    };

    const end = () => {
        cleanRunners();
    };

    authedSocket(ws, {start, end});
};
