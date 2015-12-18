import uuid from 'node-uuid';
import logger from '../logger';
import {authedSocket} from '../sockutil';
import {runWithRabbit} from '../runner';

export default (ws) => {
    let sub;

    const start = (data) => {
        const {source, componentType, args} = data;
        const id = uuid.v1();
        logger.debug('executing component source:', source);
        logger.debug('executing component type:', componentType);
        logger.debug('with args:', args);
        logger.debug('with id:', id);
        try {
            sub = runWithRabbit({source, componentType, args, id, mode: 'test'})
            .subscribe(
                execRes => {
                    logger.debug('exec result:', execRes);
                    ws.send(JSON.stringify(execRes));
                },
                e => {
                    logger.debug('exec error:', e);
                    ws.send(JSON.stringify({error: e.message}));
                    ws.close();
                },
                () => {
                    logger.debug('exec done!');
                    ws.close();
                }
            );
        } catch (e) {
            logger.debug('subscribe error:', e);
            if (e.message.indexOf('subscribe is not a function') !== -1) {
                ws.send(JSON.stringify({error: 'Your function MUST return an Observable!'}));
            } else {
                ws.send(JSON.stringify({error: e.message}));
            }
            ws.close();
        }
    };

    const end = () => {
        if (sub) {
            sub.dispose();
        }
    };

    authedSocket(ws, {start, end});
};
