import {join} from 'path';
import express from 'express';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cors from 'cors';
import logger from './logger';
import setupUsers from './users';
import setupAdmin from './admin';
import setupComponents from './components';
import setupPipes from './pipes';
import setupDb from './db';
// compile client code
import './client';

// init app
const app = express();
// parse request bodies (req.body)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// support _method (PUT in forms etc)
app.use(methodOverride());
// enable CORS headers
app.use(cors());
// enable CORS pre-flights
app.options('*', cors());
// enable websockets on routes
expressWs(app);
// error handling inside of express
app.use((err, req, res, next) => { // eslint-disable-line
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});
// static files
const staticPrefix = process.env.NODE_ENV === 'production' ? '/api' : '';
app.use(staticPrefix + '/static', express.static(join(__dirname, 'static')));
// output all uncaught exceptions
process.on('uncaughtException', err => logger.error('uncaught exception:', err));
process.on('unhandledRejection', error => logger.error('unhandled rejection:', error));


// setup api
// users & auth
setupUsers(app);
// admin
setupAdmin(app);
// components
setupComponents(app);
// pipes
setupPipes(app);

// wait for DB setup
setupDb().then(() => {
    // start server
    const server = app.listen(8080, () => {
        const host = server.address().address;
        const port = server.address().port;
        logger.info(`Exynize platform REST API listening at http://${host}:${port}`);
    });
});
