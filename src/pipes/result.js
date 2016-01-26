// start webpack
import logger from '../logger';
import {Pipeline, PipelineLog} from '../db';
import {asyncRequest} from '../util';

const json = async (req, res) => {
    const {user, pipeline: pipelineName} = req.params;
    logger.debug('getting json log for', user, pipelineName);
    // get log
    const pipeline = await Pipeline.getByUserAndRef(user, pipelineName);
    const pipelineLog = await PipelineLog.latest({pipeline: pipeline.id});
    // say we're good
    res.status(200).json(pipelineLog);
};

const html = async (req, res) => {
    const {user, pipeline: pipelineName} = req.params;
    logger.debug('getting html result for', user, pipelineName);
    const pipeline = await Pipeline.getByUserAndRef(user, pipelineName);
    const renderId = pipeline.render.id;
    const staticPrefix = process.env.NODE_ENV === 'production' ? '/api' : '';
    logger.debug('got compiled render:', renderId);
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Exynize Pipeline: ${user}/${pipelineName}</title>
        </head>
        <body>
            <div id="container"></div>
            <script src="${staticPrefix}/static/exynize.min.js"></script>
            <script src="${staticPrefix}/static/${renderId}.min.js"></script>
            <script>
                var UserRendererComponent = window.default();
                var UserRenderer = React.createElement(UserRendererComponent);
                ReactDOM.render(
                    React.createElement(App, {}, UserRenderer),
                    document.getElementById('container')
                );
            </script>
        </body>
        </html>
    `);
};

export default (req, res) => {
    res.format({
        json() {
            asyncRequest(json, req, res);
        },

        html() {
            asyncRequest(html, req, res);
        },

        default() {
            // log the request and respond with 406
            res.status(406).send('Not Acceptable');
        }
    });
};
