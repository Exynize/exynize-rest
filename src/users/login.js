import jwt from 'jsonwebtoken';
import hash from './hash';
import logger from '../logger';
import {User} from '../db';
import {jwtconf} from '../../config';
import {asyncRequest} from '../util';

const handler = async (req, res) => {
    const {email, password} = req.body;
    const hashedPassword = hash(password);
    logger.debug('searching for: ', email, hashedPassword);
    // find user
    const user = await User.find({
        email,
        password: hashedPassword,
        isEmailValid: true,
    });
    // check if user was found
    if (!user) {
        res.status(401).json({error: 'Incorrect email or password!'});
        return;
    }
    logger.debug('got user: ', user);
    // generate token
    const token = jwt.sign(user, jwtconf.secret, {expiresIn: '1d'});
    res.status(200).json({token});
};

export default asyncRequest.bind(null, handler);
