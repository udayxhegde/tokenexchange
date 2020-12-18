"use strict";

const CosmosClient = require('@azure/cosmos').CosmosClient;
var logger = require("../utils/loghelper").logger;
const keyHelper = require("../utils/keyhelper");

var isDatabaseInitialized = false;
var dbInitError = null;
var cosmosContainer = null;
var waitingForDbInit = [];


/*
 * configuration details about our cosmosdb using SQL.
 * the key should not be in this file! it is our password to this account and should not be in github
 */
storeInit();

//
// Initialize the database using the key, which came either from env or from keyvault
//
async function storeInit() {

    const configSql = {
        "endpoint"        : process.env.COSMOS_DB_URL,
        "databaseId"         : process.env.COSMOS_DB_DATABASE,
        "containerId" : process.env.COMSOS_DB_CONTAINER
    };

    logger.info("setting up cosmos %s database %s container %s", 
        configSql.endpoint, configSql.databaseId, configSql.containerId );

    keyHelper.getSecret()
    .then(function(result) {
        var cosmosDbKey = result.value; 
       /*
        * use the endpoint and our password, to get an instance of the cosmosclient ,we can then use the database and container from
        * config to get a handle on our database and container, from this endpoint.
        */

        const client = new CosmosClient({ 'endpoint': configSql.endpoint, 'key': cosmosDbKey });
        cosmosContainer = client.database(configSql.databaseId).container(configSql.containerId);

        waitingForDbInit.forEach(function(cb) {
            logger.info("success with container")
            cb(dbInitError, cosmosContainer);
        });
    })
    .catch(function(error) {
        logger.error("cosmosdb key error %s", error);
        dbInitError = error;
        waitingForDbInit.forEach(function(cb) {
            cb(dbInitError);
        });
    });

 
    isDatabaseInitialized = true;
}



//
// Everyone calls getContainer to operate against the database. If things are not yet initialized, add ourselves to the
// callback array
//
async function getContainer()
{
    return new Promise(function(resolve, reject) {
        if (isDatabaseInitialized) {
            logger.debug("initialized and is error %d", dbInitError);
            dbInitError ? reject(dbInitError) : resolve(cosmosContainer);
        }
        else {
            waitingForDbInit.push(function(error, result) {
                logger.debug("callback and is error %d", error);
                error ? reject(error) : resolve (result);
            });
        }
    });
}

//
// delete an item from the database
//
async function deleteDbItem(id) {
    return getContainer()
    .then(function(container:any) {
        container.item(id).delete();
    });
}

//
// update an item from the database
//
async function updateDbItem(item, callback) {

    return getContainer()
    .then(function(container:any) {
        container.item(item.id).replace(item);
    });
}


//
// create an item from the database
//
async function createDbItem(item, callback) {
    return getContainer()
    .then(function(container:any) {
        return container.items.create(item);
    })
    .then(function(result:any) {
        return result;
    });
}

//
// createorupdate an item from the database
//
async function createOrUpdateDbItem(item, callback) {
    return getContainer()
    .then(function(container:any) {
        return container.items.upsert(item);
    })
    .then(function(result:any) {
        return result;
    });
}

//
// get an item from the database
//
async function getDbItem(id) {
    return getContainer()
    .then(function(container:any) {
        return container.item(id, id).read();
    })
    .then(function(result:any) {
        return result;
    });
}

//
// query from the database
//
async function fetchQueryDbItem(queryStr) {
    var querySpec = {
        query: queryStr
    };

    return getContainer()
    .then (function(container:any) {
        return container.items.query(querySpec).fetchAll()
    })
    .then(function(result) {
    
            /* result.resources is the array we are interested in, and contains all of our records*/ 
        logger.debug("got records %d", result.resources.length);   
        var returnArray = [];
        for (var index = 0; index < result.resources.length; index++) {
            returnArray.push({'id' :result.resources[index].id, 'managedIdentity': result.resources[index].mid, ...result.resources[index].item});
        }
        logger.debug(returnArray);

        return returnArray;
    });
 
}



module.exports = {deleteDbItem, createDbItem, updateDbItem, createOrUpdateDbItem, getDbItem, fetchQueryDbItem};
