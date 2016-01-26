import checkToken from '../users/checkToken';
import createPipe from './create';
import getPipes from './getAll';
import getPipe from './get';
import executePipe from './execute';
import startPipe from './start';
import stopPipe from './stop';
import getPipeLog from './log';
import getPipeResult from './result';
import getPipeSocket from './resultSocket';
import pipeStatusSocket from './statusSocket';

export default (app) => {
    // get all public
    app
    .route('/api/pipes')
    .all(checkToken)
    .get(getPipes);

    // create new
    app
    .route('/api/pipes')
    .all(checkToken)
    .post(createPipe);

    // start
    app
    .route('/api/pipes/:id/start')
    .all(checkToken)
    .post(startPipe);

    // stop
    app
    .route('/api/pipes/:id/stop')
    .all(checkToken)
    .post(stopPipe);

    // execution log
    app
    .route('/api/pipes/:id/log')
    .all(checkToken)
    .get(getPipeLog);

    // get pipeline
    app
    .route('/api/pipes/:user/:pipeline')
    .all(checkToken)
    .get(getPipe);

    // latest execution result
    app
    .route('/api/pipes/:user/:pipeline/result')
    .all(checkToken)
    .get(getPipeResult);

    // execute pipe
    app.ws('/api/pipes/exec', executePipe);
    // execution socket
    app.ws('/api/pipes/:user/:pipeline/result', getPipeSocket);
    // status socket
    app.ws('/api/pipes/:id/status', pipeStatusSocket);
};
