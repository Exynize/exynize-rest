import logger from '../logger';
import {User} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id: resetId} = req.params;
    if (resetId === '-1') {
        res.status(500).send(`Error! Password reset request not found!`);
        return;
    }
    const errorMessage = req.query.error || '';
    logger.debug('reset pass for: ', resetId);
    // find user
    const user = await User.find({passwordReset: {token: resetId}});
    // check for user and time validity
    const now = new Date().getTime() - 60 * 60 * 1000; // 60 mins expiration
    if (!user || user.passwordReset.date.getTime() < now) {
        logger.debug('error during password reset with user or date:', user);
        if (user) {
            await User.update(user.id, {passwordReset: {token: '-1', date: 0}});
        }
        res.status(500).send(`Error! Password reset request not found!`);
        return;
    }

    logger.debug('password reset for user: ', user);
    res.status(200).send(`
    <html>
        <body>
            ${errorMessage}
            <form action="/api/password/reset/${resetId}" method="post">
                <input type="password" name="password" placeholder="Password">
                <input type="password" name="passwordRepeat" placeholder="Repeat password">
                <button type="submit">Change</button>
            </form>
        </body>
    </html>
    `);
};

export default asyncRequest.bind(null, handler);
