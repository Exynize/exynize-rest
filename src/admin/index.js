import checkAdmin from './checkAdmin';
import checkToken from '../users/checkToken';
import users from './users';
import updateUser from './updateUser';
import approveEmail from './approveEmail';

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

    // send approve email + reses pass
    app
    .route('/api/admin/approveEmail')
    .all(checkToken)
    .all(checkAdmin)
    .post(approveEmail);
};
