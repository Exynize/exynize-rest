// start webpack
import webpack from 'webpack';
import config from './webpack.config.js';
import logger from '../logger';

// create a compiler instance
const compiler = webpack(config);

compiler.run(function(err) {
    if (err) {
        logger.error('error compiling webpack:', err);
        return;
    }

    logger.debug('compiled webpack');
});
