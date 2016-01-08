import checkToken from '../users/checkToken';
import getComponents from './getAll';
import getComponent from './get';
import createComponent from './create';
import executeComponent from './execute';

export default (app) => {
    // get all public
    app
    .route('/api/components')
    .all(checkToken)
    .get(getComponents);

    // get one
    app
    .route('/api/component/:user/:component')
    .all(checkToken)
    .get(getComponent);

    // create new
    app
    .route('/api/components')
    .all(checkToken)
    .post(createComponent);

    app.ws('/api/components/exec', executeComponent);
};
