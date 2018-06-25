const Express = require('express');
const app = require('./lib');
// const config = require('./config');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.load();
const server = Express();
const port = process.env.PORT || 8081;

// configure app
server.use(morgan('dev')); // log requests to the console
server.use(mockWebtaskContext);
server.use(app);

function mockWebtaskContext(req, res, next) {
    // Mock `req.webtaskContext` for standalone servers
    if (!req.webtaskContext) {
        req.webtaskContext = {
            secrets: {
                AUTH0_ISSUER_DOMAIN: process.env.AUTH0_ISSUER_DOMAIN,
                AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
                AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
                AUDIENCE: process.env.AUDIENCE
            }
        };
    }
    next();
}

server.listen(port, function () {
    console.log('Server started on port', port);
});