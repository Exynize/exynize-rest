import Microwork from 'microwork';
import {rabbit} from '../../config';

const service = new Microwork({host: rabbit.host, exchange: rabbit.exchange});

export default service;
