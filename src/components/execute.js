import logger from '../logger';
import {authedSocket} from '../sockutil';
import {runInVm} from '../vm';

export default (ws) => {
    let sub;

    const start = (data) => {
        const {args, source, componentType} = data;
        logger.debug('executing component source:', source);
        logger.debug('executing component type:', componentType);
        logger.debug('with args:', args);
        try {
            sub = runInVm(source, args, componentType)
            .subscribe(
                execRes => {
                    logger.debug('exec result:', execRes);
                    ws.send(JSON.stringify(execRes));
                },
                e => {
                    logger.debug('exec error:', e);
                    ws.send(JSON.stringify({error: e.message}));
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
