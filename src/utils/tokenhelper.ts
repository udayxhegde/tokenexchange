import {GetTokenOptions, TokenCredential} from  "@azure/core-http";
var logger = require("./loghelper").logger;
const jwt = require("jsonwebtoken");
const identity = require('@azure/identity');


function validateToken(subjectToken, _clientID)
{
    try {
        logger.debug("validate token, got token object %o", subjectToken);
        
        var decoded = jwt.decode(subjectToken, {complete: true});
        logger.debug("validate token header %o", decoded.header);
        logger.debug("validate token payload %o", decoded.payload);
        logger.info("issuer %s subject %s", decoded.payload.iss, decoded.payload.sub); 
    }
    catch(error) {
        logger.error("validate token error %o", error);
    }
    //for now always return true, in future verify
    return true;
}

function exchangeToken(subjectToken, clientID, scopes, options)
{
    if (validateToken(subjectToken, clientID)) {
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
}

module.exports= {exchangeToken};