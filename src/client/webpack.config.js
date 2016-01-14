import _ from 'lodash';
import path from 'path';
import baseConfig from '../webpack/webpack.config.base';

const cfg = _.merge({}, baseConfig, {
    context: path.resolve(__dirname),
    entry: path.join(__dirname, 'exynize.js'),
    output: {
        filename: 'exynize.min.js',
    },
    resolve: {
        modulesDirectories: [path.join(__dirname, '..', '..', 'node_modules')],
    },
}, (a, b) => {
    if (_.isArray(a)) {
        return a.concat(b);
    }
});

export default cfg;
