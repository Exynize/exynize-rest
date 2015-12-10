import r from 'rethinkdb';
import uuid from 'node-uuid';
import logger from '../logger';
import {asyncRequest} from '../util';
import sendEmail from '../users/sendEmail';
import {User} from '../db';

const handler = async (req, res) => {
    const {id, email} = req.body;
    logger.debug('sending approve email to:', email, id);

    // generate reset password id
    const resetId = uuid.v1();
    // save token to db, and update approved flag
    await User.update(id, {
        isApproved: true,
        passwordReset: {
            token: resetId,
            date: r.now(),
        },
    });

    // generate email
    const resetLink = `http://${req.get('host')}/api/password/reset/${resetId}`;
    const text = `Congratulations!
    You have been invited to try Exynize platform.
    Please click on the link to set up your new password: ${resetLink}
    Once you'd created new password for your accont, you can start using Exynize platform!
    http://alpha.exynize.com/`;
    const html = `Congratulations!<br/>
    You have been invited to try Exynize platform.<br/>
    Please <a href="${resetLink}">click here</a> to set up your new password.<br/>
    Once you'd created new password for your accont,
    you can start using <a href="http://alpha.exynize.com/">Exynize platform</a>!`;

    // send email
    await sendEmail({
        to: email,
        subject: 'Exynize: Welcome!',
        text,
        html,
    });

    logger.debug('approve email sent, done.');
    res.status(204);
};

export default asyncRequest.bind(null, handler);
