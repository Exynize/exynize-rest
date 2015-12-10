import logger from '../logger';
import {User} from '../db';
import hash from './hash';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id: resetId} = req.params;
    const {password, passwordRepeat} = req.body;
    logger.debug('reset pass accept for: ', resetId, password, passwordRepeat);
    // redirect back if passwords not equal
    if (password !== passwordRepeat) {
        const error = encodeURIComponent('Passwords must match!');
        res.redirect('/api/password/reset/' + resetId + '?error=' + error);
        return;
    }

    // find user
    const user = await User.find({
        passwordReset: {
            token: resetId
        }
    });

    // send email
    if (!user) {
        logger.debug('user found:', user, ', sending reset password email');
        res.status(500).send(`Error! Password reset request not found!`);
        return;
    }

    // save to db
    const hashedPassword = hash(password);
    logger.debug('saving new password for: ', user.email, user.id, hashedPassword);
    await User.update(user.id, {
        password: hashedPassword,
        passwordReset: {token: '-1', date: 0},
    });

    logger.debug('password reset for user: ', user);
    res.status(200).send(`
    <html>
        <body>
            Password was reset! You can <a href="/">login</a> now.
        </body>
    </html>
    `);
};

export default asyncRequest.bind(null, handler);
