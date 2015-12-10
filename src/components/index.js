import checkToken from '../users/checkToken';
import getComponents from './get';
import createComponent from './create';
import executeComponent from './execute';

export default (app) => {
    // get all public
    app
    .route('/api/components')
    .all(checkToken)
    .get(getComponents);

    // create new
    app
    .route('/api/components')
    .all(checkToken)
    .post(createComponent);

    app.ws('/api/components/exec', executeComponent);
};
