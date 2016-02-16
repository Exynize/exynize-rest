import checkToken from '../users/checkToken';
// pipelines listing
import getPipes from './getAll';
// pipeline management
import getPipe from './get';
import deletePipe from './delete';
import createPipe from './create';
import executePipe from './execute';
import startPipe from './start';
import stopPipe from './stop';
// pipeline results / status
import getPipeLog from './log';
import pipeStatusSocket from './statusSocket';
import getPipeSocket from './resultSocket';
import getPipeResult from './result';
// inputs
import pipelineInput from './input';
import pipelineInputSocket from './inputSocket';

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

    // get/delete pipeline
    app
    .route('/api/pipes/:user/:pipeline')
    .all(checkToken)
    .get(getPipe)
    .delete(deletePipe);

    // latest execution result
    app
    .route('/api/pipes/:user/:pipeline/result')
    .all(checkToken)
    .get(getPipeResult);

    // pipeline inputs:
    // pipeline REST input
    app
    .route('/api/pipes/:user/:pipeline/input')
    .get(pipelineInput)
    .post(pipelineInput)
    .put(pipelineInput);
    // pipeline socket input
    app.ws('/api/pipes/:user/:pipeline/input', pipelineInputSocket);

    // execute pipe
    app.ws('/api/pipes/exec', executePipe);
    // execution socket
    app.ws('/api/pipes/:user/:pipeline/result', getPipeSocket);
    // status socket
    app.ws('/api/pipes/:id/status', pipeStatusSocket);
};
