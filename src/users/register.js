import jwt from 'jsonwebtoken';
import hash from './hash';
import logger from '../logger';
import {User} from '../db';
import {jwtconf} from '../../config';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {email, password} = req.body;
    const hashedPassword = hash(password);
    logger.debug('adding: ', email, hashedPassword);
    // find user
    const user = await User.create({
        email,
        password: hashedPassword,
    });

    if (!user) {
        res.status(500).json({error: 'Error while creating user!'});
        return;
    }

    logger.debug('created user: ', user);
    // remove password from token
    delete user.password;
    // generate token
    const token = jwt.sign(user, jwtconf.secret, {expiresIn: '1d'});
    res.status(200).json({token});
};

export default asyncRequest.bind(null, handler);
