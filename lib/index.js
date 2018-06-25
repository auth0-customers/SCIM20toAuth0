const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const extensionExpressTools = require('auth0-extension-express-tools');

const index = express();
const apiProxy = require('./api-proxy');
const errors = require('./error-response');
const schemas = require('./schemas')();

const managementClient = (req, res, next) => {
    const options = {
        domain: req.webtaskContext.secrets.AUTH0_ISSUER_DOMAIN,
        clientId: req.webtaskContext.secrets.AUTH0_CLIENT_ID,
        clientSecret: req.webtaskContext.secrets.AUTH0_CLIENT_SECRET
    };
    return extensionExpressTools.middlewares.managementApiClient(options)(req, res, next);
};

const authMiddleware = (req, res, next) => {
    const issuer = 'https://' + req.webtaskContext.secrets.AUTH0_ISSUER_DOMAIN + '/';
    jwt({
        secret: jwks.expressJwtSecret({jwksUri: issuer + '.well-known/jwks.json'}),
        audience: req.webtaskContext.secrets.AUDIENCE,
        issuer: issuer,
        algorithms: ['RS256']
    })(req, res, next);
};

// configure body parser
index.use(bodyParser.urlencoded({extended: true}));
index.use(bodyParser.json());
index.use(managementClient);

const router = express.Router();

/**  endpoints **/

router.route('/users')
    .post(function (req, res, next) {
        const auth0Client = req.auth0;
        const scimUser = req.body;
        return apiProxy.createUser(auth0Client, scimUser, (err, newScimUser) => {
            if (err) return next(err);
            res.status(201).json(newScimUser);
        });
    })
    .get(function (req, res, next) {
        const auth0Client = req.auth0;
        return apiProxy.getUsers(auth0Client, req.query, (err, scimUsers) => {
            if (err) return next(err);
            res.status(200).json(scimUsers);
        });
    });

router.route('/users/:user_id')
    .get(function (req, res, next) {
        const auth0Client = req.auth0;
        req.query.user_id = req.params.user_id;
        return apiProxy.getUser(auth0Client, req.query, (err, scimUser) => {
            if (err) return next(err);
            res.status(200).json(scimUser);
        });
    })

    .patch(function (req, res, next) {
        const auth0Client = req.auth0;
        const scimUser = req.body;
        return apiProxy.updateUser(auth0Client, {id: req.params.user_id}, scimUser, (err, editedScimUser) => {
            if (err) return next(err);
            res.status(200).json(editedScimUser);
        });
    })
    .delete(function (req, res, next) {
        const auth0Client = req.auth0;
        return apiProxy.deleteUser(auth0Client, {id: req.params.user_id}, (err) => {
            if (err) return next(err); // TODO: If user does not exists, it should return 404 according to the SCIM specification, but auth0 API does not!
            res.sendStatus(204); // 204:No-Content
        });
    });

router.route('/schemas')
    .get(function (req, res, next) {
        res.status(200).json(schemas.all());
    });

router.route('/schemas/:schema_id')
    .get(function (req, res, next) {
        // if the required schema exists
        const schema = schemas.byId(req.params.schema_id);
        if (schema) {
            res.status(200).json(schema);
        } else { // return error indicting the schema is not found
            res.status(404).send(errors.wrap({message: 'Schema not found.', statusCode: 404}));
        }
    });

index.use(authMiddleware, router);
index.use('/api', router);

index.use(function (err, req, res, next) {
    const status = (err.statusCode >= 100 && err.statusCode < 600 ? err.statusCode : 500) || 500;
    res.status(status).send(errors.wrap(err));
});

module.exports = index;