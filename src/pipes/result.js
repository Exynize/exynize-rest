// start webpack
import logger from '../logger';
import {Pipeline, PipelineLog} from '../db';
import {asyncRequest} from '../util';
import {requestToToken, checkStringToken} from '../users/checkToken';

const publicOrAuth = async (req, res, user, pipeline) => {
    // check public status / auth
    if (!pipeline.isPublic) {
        const token = requestToToken(req);
        try {
            const authUser = await checkStringToken(token);
            logger.info('user found!', authUser);
            if (authUser.username !== user) {
                throw new Error(`User mismatch!`);
            }
        } catch (e) {
            throw new Error(`You don't have permission to do that!`);
        }
    }
};

const json = async (req, res) => {
    const {user, pipeline: pipelineName} = req.params;
    logger.debug('getting json log for', user, pipelineName);
    // get log
    const pipeline = await Pipeline.getByUserAndRef(user, pipelineName);
    // check public status / auth
    await publicOrAuth(req, res, user, pipeline);
    // get data
    const pipelineLog = await PipelineLog.latest({pipeline: pipeline.id});
    // say we're good
    res.status(200).json(pipelineLog);
};

const html = async (req, res) => {
    const {user, pipeline: pipelineName} = req.params;
    logger.debug('getting html result for', user, pipelineName);
    const pipeline = await Pipeline.getByUserAndRef(user, pipelineName);
    // check public status / auth
    await publicOrAuth(req, res, user, pipeline);
    // get render id
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
