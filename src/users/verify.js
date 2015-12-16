import logger from '../logger';
import {User} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id: verifyId} = req.params;
    logger.debug('verifying email for', verifyId);
    if (verifyId === '0') {
        res.status(401).send('Incorrect verification token!');
        return;
    }
    // find user
    const user = await User.find({
        verifyId,
        isEmailValid: false,
    });
    // check if user was found
    if (!user) {
        res.status(401).send('Incorrect verification token!');
        return;
    }
    logger.debug('got user: ', user);
    await User.update(user.id, {isEmailValid: true, verifyId: '0'});
    res.status(200).send(`Your email was successfully activated! You can login <a href="/">now</a>.`);
};

export default asyncRequest.bind(null, handler);
