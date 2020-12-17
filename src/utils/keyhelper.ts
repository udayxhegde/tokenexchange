"use strict";

const KeyVaultSecret = require('@azure/keyvault-secrets');
var identity = require('@azure/identity');
var logger = require("../utils/loghelper").logger;


//
// Get secret reads the secret from the env if it is available, otherwise reads it from keyvault
// returns a promise in either case that needs to be resolved on return
//
module.exports = {
    getSecret: function() {

        if (process.env.COSMOS_DB_KEY) {
            logger.info("key in env");
            let result = { value : process.env.COSMOS_DB_KEY };
            return new Promise(function(resolve) {        
                resolve(result);
            });                
        }
        else {
            const managedIDClientId =  null || process.env.MANAGED_IDENTITY_CLIENT_ID;
            const keyVaultUrl = process.env.KEY_VAULT_URL;
            const cosmosDBSecretName = process.env.COSMOS_DB_SECRET_NAME;

            logger.info("managed id client id is %s", managedIDClientId);

            const keyVaultClient = new KeyVaultSecret.SecretClient(keyVaultUrl, new identity.ManagedIdentityCredential(managedIDClientId));
       
            return keyVaultClient.getSecret(cosmosDBSecretName);
        }
    }
};

