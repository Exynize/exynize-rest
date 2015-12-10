import Rx from 'rx';
import React from 'react';
import logger from '../logger';
import {join} from 'path';
import {dependencies} from './package.json';
import {dependencies as clientDependencies} from '../client/package.json';

// hacky mocks of window, document, etc for leaflet
// TODO: find better solution (jsdom?)
global.window = {};
global.document = {
    documentElement: {style: []},
    getElementsByTagName: () => [],
    createElement: () => ({getContext: () => {}}),
};
global.navigator = {userAgent: 'node'};

// append package stuff
const packages = {};
Object.keys(dependencies).forEach(name => packages[name] = require(name));
// append client package stuff
const clientPackages = {};
Object.keys(clientDependencies).forEach(name => {
    logger.debug('loading', name);
    packages[name] = require(join('..', 'client', 'node_modules', name));
});

logger.debug('loaded packages: ', Object.keys(packages));

const context = {
    // dummy module and exports for babel
    module: {},
    exports: {},

    // expose default tick functions
    setTimeout,
    setInterval,

    // expose Rxjs
    Rx,
    // expose React
    React,

    // expose custom require
    require(name) {
        if (packages[name]) {
            return packages[name];
        }

        // fallback to client packages
        if (clientPackages[name]) {
            return clientPackages[name];
        }

        throw new Error(`Package "${name}" is not available! Try requesting it's addition.`);
    },
};

export default context;
