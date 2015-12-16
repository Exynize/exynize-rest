import checkAdmin from './checkAdmin';
import checkToken from '../users/checkToken';
import users from './users';
import updateUser from './updateUser';

export default (app) => {
    // get users
    app
    .route('/api/admin/users')
    .all(checkToken)
    .all(checkAdmin)
    .get(users);

    // update user
    app
    .route('/api/admin/users')
    .all(checkToken)
    .all(checkAdmin)
    .post(updateUser);
};
