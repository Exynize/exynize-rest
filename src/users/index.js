import login from './login';
// import register from './register';
import requestAccess from './requestAccess';
import verify from './verify';
import resetPassword from './resetPassword';
import resetPasswordChange from './resetPasswordChange';
import resetPasswordAccept from './resetPasswordAccept';

export default (app) => {
    app.route('/api/login').post(login);
    app.route('/api/requestAccess').post(requestAccess);
    app.route('/api/verify/:id').get(verify);
    app.route('/api/password/reset').post(resetPassword);
    app.route('/api/password/reset/:id').get(resetPasswordChange);
    app.route('/api/password/reset/:id').post(resetPasswordAccept);
    // app.route('/api/register').post(register);
};
