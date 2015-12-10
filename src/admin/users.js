import logger from '../logger';
import {User} from '../db';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    logger.debug('getting all users');
    // find user
    const users = await User.findAll({});
    // check if user was found
    if (!users) {
        res.status(401).json({error: 'Could not get users!'});
        return;
    }
    logger.debug('got users: ', users);
    res.status(200).json({users});
};

export default asyncRequest.bind(null, handler);
