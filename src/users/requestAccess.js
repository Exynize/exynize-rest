import uuid from 'node-uuid';
import logger from '../logger';
import {User} from '../db';
import sendEmail from './sendEmail';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const host = process.env.EXYNIZE_HOST || req.get('host');
    const {name, email, requestDescription} = req.body;
    const verifyId = uuid.v1();
    logger.debug('access requested for: ', name, email, requestDescription, 'with verifyId:', verifyId);
    // find user
    const user = await User.create({
        name,
        email,
        requestDescription,
        verifyId,
        isEmailValid: false,
        isApproved: false,
    });

    if (!user) {
        logger.debug('unknown error while creating user for request access!');
        res.status(500).json({error: 'Error while creating user!'});
        return;
    }

    // send email
    const verifyLink = `http://${host}/api/verify/${verifyId}`;
    const text = `Hi there,
    Please Click on the link to verify your email: ${verifyLink}`;
    const html = `Hi there,<br/>
    Please Click on the link to verify your email.<br/>
    <a href="${verifyLink}">Click here to verify</a><br/>
    Or open this in a browser: ${verifyLink}.`;

    // send email
    await sendEmail({
        to: email,
        subject: 'Exynize: Confirm Your Email',
        text,
        html,
    });

    logger.debug('created user: ', user);
    res.sendStatus(201);
};

export default asyncRequest.bind(null, handler);
