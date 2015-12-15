import r from 'rethinkdb';
import uuid from 'node-uuid';
import logger from '../logger';
import {User} from '../db';
import sendEmail from './sendEmail';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const host = process.env.EXYNIZE_HOST || req.get('host');
    const {email} = req.body;
    const resetId = uuid.v1();
    logger.debug('reset pass for: ', email, 'with resetId:', resetId);
    // find user
    const user = await User.find({email});
    // send email
    if (user) {
        logger.debug('user found:', user, ', sending reset password email');
        // save token to db
        await User.update(user.id, {
            passwordReset: {
                token: resetId,
                date: r.now(),
            },
        });
        // generate email
        const resetLink = `http://${host}/api/password/reset/${resetId}`;
        const text = `Hi there,
        Please Click on the link to reset your password: ${resetId}`;
        const html = `Hi there,<br/>
        Please Click on the link to reset your password.<br/>
        <a href="${resetLink}">Click here to reset password</a><br/>
        Or open this in a browser: ${resetLink}.`;

        // send email
        await sendEmail({
            to: email,
            subject: 'Exynize: Password Reset',
            text,
            html,
        });
    }

    logger.debug('password reset for user: ', user);
    res.sendStatus(204);
};

export default asyncRequest.bind(null, handler);
