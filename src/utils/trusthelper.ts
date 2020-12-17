"use strict";
const trustValidator = require("jsonschema").Validator;
const trustValidatorInstance = new trustValidator();
var HttpStatus = require('http-status-codes');
var logger = require("../utils/loghelper").logger;
var sqlStore = require('../utils/sqlstore');


//
// this is our event schema... only details and created are required for now
//
const trustSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "required": [ "issuer", "subject"],
    "additionalProperties": false,
    "properties": {
        "issuer": { "type": "string"},  
        "subject" : { "type": "string"}
    }
};

//
// make sure we are accepting an event that conforms to the schema.
//
function validateTrust(trust) {
  const validateResult = trustValidatorInstance.validate(trust, trustSchema);

  if (validateResult.errors.length) {
    let errorReturn = "";
    for(var index = 0; index < validateResult.errors.length; index++) {
        errorReturn = errorReturn.concat(" " + validateResult.errors[index].message);
    }
    return {status: HttpStatus.BAD_REQUEST, message:errorReturn};
  }
  else {
    return null;
  }
}
    
  
function readTrust(id, subject, callback) {
    var query = "SELECT * from r where r.type='trust' AND r.mid = '" + id + "AND r.item.subject = '" + subject +"'";

    sqlStore.fetchQueryDbItem(query, function(error, values) {
        if (error) {
            logger.error("sqlstore read trust failed %o, %o", error, query);
            callback(error);
        }
        else {
            logger.debug("sqlstore read trust sucess", values);
            callback(null, values);
        }
    });
}

module.exports = {  
/*
     * Get event is very simple, read the cosmosdb for the id we got, and get the item
     * then pick the item object from the db item, and return it back as a key value pair {id, item}
     * the read returns a promise, so we have .then and .catch: but then we convert this back to the normal
     * callback pattern
     * We can experiment with other patterns here (async, await or promise or something else?)
     */
    getTrust :  function (id, subject, callback) {
        readTrust(id, subject, callback);
    },

    /*
     * add event is very simple, create a wrapper object within which we add our event object. We are doing this because
     * when we add the object to cosmosdb, it adds a bunch of tags and headers. So this provides an easy way to extract 
     * what we need, rather than have to strip out the other things before we return the object back in our API
     * On success, we return back the id for this note, along with the note. {id, note}
     * the create returns a promise, so we have .then and .catch: but then we convert this back to the normal
     * callback pattern
     * We can experiment with other patterns here (async, await or promise or something else?)
     */
    addTrust : async function(id, trust, callback) {
        
        var error = validateTrust(trust);
        if (error) {
            logger.error("validate trust failed", error);
            callback(error);
        }
        else {
            readTrust(id, trust.subject, function(error, result) {
                if (error) {
                    var wrapper = {"item" : trust};
                    wrapper['type'] = "trust";
                    wrapper['mid'] = id;

                    sqlStore.createDbItem(wrapper, function(error, result) {
                        if (error) {
                            logger.error("sqlstore create failed", error);
                            callback({status: HttpStatus.INTERNAL_SERVER_ERROR, message:error});
                        }
                        else {
                            callback(null, {'id' : result.resource.id, ...result.resource.item});
                        }
                    });
                }
                else {
                    callback({status: HttpStatus.BAD_REQUEST, message:"subject already exists"});
                }
            });
        }
    },

    queryTrusts :  function (id, queryScope, callback) {
       /*
        * Since we are using the SQL format in cosmosdb (and not mongo for example), we craft up a query we need
        * this query is saying find all the object in my container which has a note object in it. 
        * This way we can store lot of other objects in our database, not related to our note project, and still find only
        * things we need.
        */

        var query = "SELECT * from r where r.type='trust'";
        if (id) {
            query = query.concat(" AND r.mid = '" + id + "'");
        }
        for (const key in queryScope) {
            query = query.concat(" AND r.item." + key + "= '" + queryScope[key] +"'");
        }

        sqlStore.fetchQueryDbItem(query, function(error, values) {
            if (error) {
                logger.error("sqlstore query failed", error);
                callback(error);
            }
            else {
                logger.debug("sqlstore query sucess", values);
                callback(null, values);
            }
        });
    },

    deleteTrust : function( id, callback ) {
        sqlStore.deleteDbItem(id, callback);
    }
};