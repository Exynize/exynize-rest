import vm from 'vm';
import fs from 'fs';
import logger from '../logger';
import vmContext from './context';

// get babel & config
const babel = require('babel-core');
const babelConfig = JSON.parse(fs.readFileSync('./.babelrc'));

export const compileInVm = (jsString: string) : Function => {
    logger.debug('compiling code: ', jsString);
    const transformed = babel.transform(jsString, babelConfig);
    logger.debug('transformed code: ', transformed.code);
    const context = vm.createContext(vmContext);
    const vmFunction = vm.runInContext(transformed.code, context);
    return vmFunction;
};
