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
function storeInit() {

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
function getContainer(cb)
{
    if (isDatabaseInitialized) cb(dbInitError, cosmosContainer);
    else waitingForDbInit.push(cb);
}


//
// delete an item from the database
//
function deleteDbItem(id, callback) {
    getContainer(function(error, container) {
        if (error) {
            callback(error);
            return;
        }
        container.item(id).delete()
        .then(function(result) {
            callback(null, id );
        })
        .catch(function(error) {
            logger.error("delete failed in cosmos", error);
            callback(error);
        });
    });
}

//
// update an item from the database
//
function updateDbItem(item, callback) {

    getContainer(function(error, container) {
        if (error) {
            logger.error("updatedbitem getcontainer failed %s", error);
            callback(error);
            return;
        }
        container.item(item.id).replace(item)
        .then(function(result) {
            callback(null, result)
        })
        .catch(function(error) {
            logger.error("update failed in cosmos", error);
            callback(error);
        });
    });
}


//
// create an item from the database
//
function createDbItem(item, callback) {

    getContainer(function(error, container) {
        if (error) {
            logger.error("createDbItem getcontainer failed %s", error);
            callback(error);
            return;
        }
        container.items.create(item)
        .then(function(result) {
            callback(null, result);
        })
        .catch(function(error) {
            logger.error("create failed in cosmos", error);
            callback(error);
        });
    });
}

//
// createorupdate an item from the database
//
function createOrUpdateDbItem(item, callback) {
    getContainer(function(error, container) {
        if (error) {
            logger.error("createupdateitem getcontainer failed %s", error);
            callback(error);
            return;
        }
        container.items.upsert(item)
        .then(function(result) {
            callback(null, result);
        })
        .catch(function(error) {
            logger.error("createOrUpdate failed in cosmos", error);
            callback(error);
        });
    });
}

//
// get an item from the database
//
function getDbItem(id, callback) {
    getContainer(function(error, container) {
        if (error) {
            logger.error("getDbItem getcontainer failed %s", error);
            callback(error);
            return;
        }
        //
        // pass the id and partition key: in this example, the id is also the partition key
        container.item(id, id).read()
        .then(function(result) {
            /*
            * it appears cosmosdb actuall returns a result with status not 200 in case of errors, so filter it here
            */
            if (result.statusCode == 200) {
                callback(null, result );
            }           
            else {
                logger.error("getDbItem failed in cosmos %d for id %s", result.statusCode, id);

                callback(result.statusCode);
            }
        })
        .catch(function(error) {
            logger.error("getDbItem failed in cosmos %s", error);
            callback(error);
        });
    });
}

//
// query from the database
//
function fetchQueryDbItem(queryStr, callback) {
    var querySpec = {
        query: queryStr
    };

    getContainer(function(error, container) {
        if (error) {
            logger.error("fetchdb getcontainer failed %o", error);
            callback(error);
            return;
        }
        container.items.query(querySpec).fetchAll()
        .then(function(result) {
            /* result.resources is the array we are interested in, and contains all of our records*/ 
            logger.trace("got records %d", result.resources.length);   
            var returnArray = [];
            for (var index = 0; index < result.resources.length; index++) {
                returnArray.push({'id' :result.resources[index].id, ...result.resources[index].item});
            }
            logger.trace("fetch query dbitem return %o", returnArray);

            callback(null, returnArray);

        })
        .catch(function(error) {
            logger.error("fetch query dbitem error %o query %o", error, querySpec);
            callback(error);
        });
    });
}



module.exports = {deleteDbItem, createDbItem, updateDbItem, createOrUpdateDbItem, getDbItem, fetchQueryDbItem};
