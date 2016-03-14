import winston from 'winston';

export const consoleTransport = new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    prettyPrint: process.env.NODE_ENV !== 'production',
    colorize: process.env.NODE_ENV !== 'production',
    timestamp: process.env.NODE_ENV !== 'production',
    logstash: process.env.NODE_ENV === 'production',
    label: 'rest-api',
});

const logger = new winston.Logger({
    transports: [consoleTransport],
});

export default logger;
