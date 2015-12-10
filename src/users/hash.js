import crypto from 'crypto';
import {auth} from '../../config';

export default (string: string) : string => {
    const shasum = crypto.createHash('sha1');
    shasum.update(string);
    shasum.update(auth.salt);
    const d = shasum.digest('hex');
    return d;
};
