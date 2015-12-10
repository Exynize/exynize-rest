import {join} from 'path';
import {fork} from 'child_process';
import uuid from 'node-uuid';
import {testExchange} from '../db';
import {authedSocket} from '../sockutil';
import logger from '../logger';

export default (ws) => {
    let childTopic;

    const start = (data: Object) => {
        const {pipeline: pipelineJSON} = data;
        const pipeline = JSON.parse(pipelineJSON);
        logger.debug('executing pipe:', pipeline);

        const id = uuid.v1();
        logger.debug('starting with id:', id);
        // get topic
        childTopic = testExchange.topic(id + '.in');
        // subscribe
        testExchange
        .queue(topic => topic.eq(id + '.out'))
        .subscribe((topic, payload) => {
            logger.debug('[RESPONSE] for topic:', topic, 'got payload:', payload);
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
        // say we're running in debug mode
        const execMode = 'debug';
        // fork child
        fork(join(__dirname, 'runner', 'index.js'), [id, JSON.stringify(pipeline), execMode]);
    };

    const end = () => {
        childTopic.publish({command: 'kill'});
    };

    authedSocket(ws, {start, end});
};
