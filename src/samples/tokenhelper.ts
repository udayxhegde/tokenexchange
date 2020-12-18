import {GetTokenOptions, TokenCredential, AccessToken} from  "@azure/core-http";
import { Token } from "typescript";
const fs = require('fs');
const identity = require('@azure/identity');
const fetch = require('node-fetch');
var logger = require("./loghelper").logger;


class TokenExchangeCredential implements TokenCredential {
    private clientId: String;

    constructor(
        clientId: string,
    ) {
        this.clientId = clientId;
        //validate token, and see if it matches clientid trust
        // throw authenticationerror if fail
    }

    private async getLocalToken(scopes, options) {

        if (process.env.TOKEN_FILE_PATH) {
            const filepath = process.env.TOKEN_FILE_PATH; 
            logger.debug("get local token, reading path %s", filepath);
            return new Promise(function(resolve, reject) {
                fs.readFile(filepath, "utf8", function (err,data) {
                    if (err) {
                        logger.error("get local token, read path %s failed with %s", filepath, err);
                        reject(err);
                    }
                    else {
                        logger.debug("get local token, read %o", data);
                        resolve(data);
                    } 
                    return;
                });
            });            
        }
        else {
            throw new Error("token file path not defined");
        }
    }

    public async getToken(
        scopes: string | string[],
        options?: GetTokenOptions,
    ): Promise<AccessToken | null> {

        var token = await this.getLocalToken(scopes, options);
        const token_url = process.env.TOKEN_EXCHANGE_URL;

        logger.info("putting token in body");
        const body = {
            subjectToken : token,
            clientId: this.clientId,
            scopes: scopes,
            options: options
        }
        logger.debug("sending body to %s token exchange %o", token_url, body);        
        var status;

        var gotToken = fetch( token_url, {
                method : 'post',
                body: JSON.stringify(body),
                headers: {'Content-Type' : 'application/json'},
            })
            .then(function(result) {    
                status = result.status;
                return result.json();
            })
            .then(function(data) {
                logger.info("in token exchange cred get token, got %d status %o", status, data);
                if (status != 200) throw new Error(data);
                return data;
            })
            .catch(function(error) {
                logger.error("in token exchange cred get token error %o", error);
                throw(error);
            });
            
        return gotToken;
    }

}

module.exports = {TokenExchangeCredential};