import nodemailer from 'nodemailer';
import logger from '../logger';
import {email} from '../../config';

// create transporter
const transporter = nodemailer.createTransport(email);

// export send function
export default ({to, subject, text, html}) => new Promise((resolve, reject) => {
    transporter.sendMail({
        from: 'Exynize Bot <bot@exynize.com>', // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plaintext body
        html // html body
    }, (error, info) => {
        if (error) {
            logger.error('error sending email:', error);
            return reject(error);
        }

        logger.debug('Message sent:', info);
        resolve(info);
    });
});
