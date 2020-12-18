import {GetTokenOptions, TokenCredential} from  "@azure/core-http";
var logger = require("./loghelper").logger;
const jwt = require("jsonwebtoken");
const identity = require('@azure/identity');
var trustHelper = require("./trusthelper");
var HttpError = require('../utils/HttpError');
var HttpStatus = require('http-status-codes');



async function validateToken(subjectToken, clientID)
{
    try {
        logger.debug("validate token, got token object %o", subjectToken);
        logger.debug("validate token, got client %s", clientID);

        var decoded = jwt.decode(subjectToken, {complete: true});
        logger.debug("validate token header %o", decoded.header);
        logger.debug("validate token payload %o", decoded.payload);
        logger.info("issuer %s subject %s", decoded.payload.iss, decoded.payload.sub);
        await trustHelper.getTrust(clientID, decoded.payload.sub);
        logger.info("found issuer and sub");
        return true;
    }
    catch(error) {
        logger.error("validate token error %o", error);
        if (error instanceof HttpError) {
            if (error.status == HttpStatus.NOT_FOUND) {
                throw new HttpError(HttpStatus.FORBIDDEN, error.message);
            }
        }
        throw(error);
    }

}

async function exchangeToken(subjectToken, clientID, scopes, options)
{
    return validateToken(subjectToken, clientID)
    .then(function(result) {
        if (result) {
            logger.info("in token exchange for id %s and scopes %o", clientID, scopes);

            const credential = new identity.ManagedIdentityCredential(clientID);
            return credential.getToken(scopes, options)
                .then(function(response) {
                    if (response) {
                        var decoded = jwt.decode(response.token, {complete: true});
                        logger.debug("exchange token: new token header %o", decoded.header);
                        logger.debug("exchange token: new token payload %o", decoded.payload);
                    }
                    else {
                        logger.info("exchange token, empty token return")
                    }
                    return response;
                })
                .catch(function(error) {
                    logger.info("exchange token, exception error %o", error);

                    throw (error);
                });
        }
        else {
            logger.debug("validate token failed");
            throw new HttpError(HttpStatus.BAD_REQUEST, "invalid token");
        }
    });
}

module.exports= {exchangeToken};