import winston from 'winston';

const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            colorize: true,
            timestamp: true,
        }),
    ],
});

export default logger;
