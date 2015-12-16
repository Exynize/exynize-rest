import uuid from 'node-uuid';
import hash from './hash';
import sendEmail from './sendEmail';
import logger from '../logger';
import {User} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const host = process.env.EXYNIZE_HOST || req.get('host');
    const {email, password} = req.body;
    const hashedPassword = hash(password);
    const verifyId = uuid.v1();
    logger.debug('adding: ', email, hashedPassword);
    // find user
    const user = await User.create({
        email,
        password: hashedPassword,
        verifyId,
        isEmailValid: false,
    });

    if (!user) {
        logger.debug('unknown error while creating user during registration!');
        res.status(500).json({error: 'Error while creating user!'});
        return;
    }

    logger.debug('created user: ', user);

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
