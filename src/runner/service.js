import Microwork from 'microwork';
import {rabbit} from '../../config';
import {consoleTransport} from '../logger';

const service = new Microwork({host: rabbit.host, exchange: rabbit.exchange, loggingTransports: [consoleTransport]});

export default service;
