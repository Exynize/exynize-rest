import checkToken from '../users/checkToken';
import createPipe from './create';
import getPipes from './get';
import executePipe from './execute';
import startPipe from './start';
import stopPipe from './stop';
import getPipeLog from './log';
import getPipeResult from './result';
import getPipeSocket from './resultSocket';

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

    // latest execution result
    app
    .route('/api/pipes/:id')
    .all(checkToken)
    .get(getPipeResult);

    // execute pipe
    app.ws('/api/pipes/exec', executePipe);
    // execution socket
    app.ws('/api/pipes/:id', getPipeSocket);
};
