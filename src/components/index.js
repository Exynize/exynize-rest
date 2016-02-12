import checkToken from '../users/checkToken';
import getComponents from './getAll';
import getComponent from './get';
import createComponent from './create';
import executeComponent from './execute';
import deleteComponent from './delete';

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
    .get(getComponent)
    .delete(deleteComponent);

    // create new
    app
    .route('/api/components')
    .all(checkToken)
    .post(createComponent);

    app.ws('/api/components/exec', executeComponent);
};
