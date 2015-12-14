import logger from '../logger';
import {User} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {id, isAdmin, isApproved, isEmailValid} = req.body;
    logger.debug('updating user with:', req.body);
    // update user
    await User.update(id, {
        isAdmin,
        isApproved,
        isEmailValid,
    });
    logger.debug('user updated!');
    res.sendStatus(204);
};

export default asyncRequest.bind(null, handler);
