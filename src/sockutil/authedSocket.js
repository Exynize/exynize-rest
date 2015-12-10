import {checkStringToken} from '../users/checkToken';

export const authedSocket = (ws: Object, {start, end} = {}) => {
    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);

        // check if it's end request
        if (data.end) {
            end();
            ws.close();
            return;
        }

        // check auth
        try {
            const user = await checkStringToken(data.token);
            if (!user) {
                throw new Error('Not authorized');
            }
        } catch (e) {
            ws.send(JSON.stringify({error: e.message}));
            ws.close();
            return;
        }

        start(data);
    });
};
