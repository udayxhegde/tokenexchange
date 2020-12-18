const tokenRoute = require("express").Router();
var identity = require('@azure/identity');
const tokenHelper = require("../utils/tokenhelper");
var logger = require("../utils/loghelper").logger;
var HttpError = require('../utils/HttpError');

tokenRoute.use(function timeLog(req, res, next) {
    var date = new Date();
    logger.debug(`token Got request %s at time %s`, req.method, date.toLocaleString());
    next();
});
/*
* body contiains: subject-token, client-id, audience
*/
tokenRoute.route('/exchange')
    .post(function (req, res) {
        logger.debug("in post token exchange");
        // get token
        tokenHelper.exchangeToken(req.body.subjectToken, 
            req.body.clientId, req.body.scopes, req.body.options)
            .then (function(response) {
                logger.debug("token exchange, returning object %o", response);
                return res.json(response);
            })
            .catch(function(error) {
                logger.error("in token exchange post, error %o", error);

                if (error instanceof HttpError) {
                    return res.status(error.status).send(error);
                }
                else {
                    return res.status(500).send();
                }
            })
    });
    
module.exports = tokenRoute;