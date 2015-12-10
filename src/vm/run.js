import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {Observable, Subject} from 'rx';
import {compileInVm} from './compile';
import logger from '../logger';


export const runInVm = (jsString: string, args: Array = [], componentType: string = 'processor') => {
    logger.debug('running type:', componentType, ', with code:', jsString);
    const compiledArgs = args.map(arg => {
        try {
            const newArg = JSON.parse(arg);
            return newArg;
        } catch (e) {
            return arg;
        }
    });
    logger.debug('with args:', compiledArgs);
    const vmFunction = compileInVm(jsString);
    if (componentType === 'processor') {
        logger.debug('running processor');
        const functionResult = vmFunction(...compiledArgs);
        return functionResult;
    }

    if (componentType === 'source') {
        logger.debug('running source');
        // create
        const subject = new Subject();
        // push to args
        compiledArgs.push(subject);
        // execute
        setTimeout(() => vmFunction(...compiledArgs), 10);
        return subject;
    }

    if (componentType === 'render') {
        const Component = vmFunction();
        const props = {data: compiledArgs[0]};
        logger.debug('rendering with props:', props);
        const element = React.createElement(Component, props);
        return Observable.return(ReactDOMServer.renderToString(element));
    }

    throw new Error('Unknown component type:', componentType);
};
