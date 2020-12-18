"use strict";
const trustValidator = require("jsonschema").Validator;
const trustValidatorInstance = new trustValidator();
var HttpStatus = require('http-status-codes');
var logger = require("../utils/loghelper").logger;
var sqlStore = require('../utils/sqlstore');
var HttpError = require('../utils/HttpError');
var jsonValidate = require('../utils/jsonvalidate');

  
async function readTrust(id, subject) {
    var query = "SELECT * from r where r.type='trust' AND r.mid = '" + id + "' AND r.item.subject = '" + subject +"'";

    return sqlStore.fetchQueryDbItem(query)
    .then(function(values) {
        logger.debug("sqlstore read trust sucess %o", values);
        return(values);
    })
    .catch(function(error) {
        logger.error("sqlstore read trust failed %o, %o", error, query);
        throw(error);
    });
}

module.exports = {  
  
    getTrust : async function (id, subject) {
        logger.debug("in get trust with id %s sub %s", id, subject);
        return readTrust(id, subject)
        .then(function(result) {
            if (result.length == 1) {
                return result;
            }
            else if (result.length == 0) {
                logger.debug("trust not found");

                var error = "Id " + id + " subject " + subject + "Trust not found";
                throw(new HttpError(HttpStatus.NOT_FOUND, error));
            }
            else {
                logger.debug("too many trusts found");

                var error = "multiple trusts found. Found " + result.length + "trusts for id " + id + " subject " + subject;
                throw(new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, error));
            }
        });
    },

    addTrust : async function(id, trust) {
        
        return jsonValidate.validateTrust(trust)
        .then (function(result) {
            return readTrust(id, trust.subject);
        })
        .then(function(result:any) {
            if (result.length == 0) {
                var wrapper = {"item" : trust};
                wrapper['type'] = "trust";
                wrapper['mid'] = id;

                return sqlStore.createDbItem(wrapper);
            }
            else {
                logger.error("trust already exists in add trust, number of trusts %d", result.length);
                throw(new HttpError(HttpStatus.BAD_REQUEST, "trust already exists"));
            }
        })
        .then(function(result:any) {
            logger.debug("add trust done", result);
            logger.debug(result);
            return({...result.resource.item})
        });
    },

    queryTrusts :  async function (id, queryScope) {
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

        return sqlStore.fetchQueryDbItem(query)
        .then(function(values:any) {
            logger.debug("in query trusts returning values %o", values)
            return values;
        });
    },

    deleteTrust : async function( id, subject ) {
        return readTrust(id, subject)
        .then(function(result:any) {
            logger.debug(result);
            logger.debug("in deleter trust found %d", result.length);

            if (result.length == 1) {
                return sqlStore.deleteDbItem(result[0].id);                
            }
            else if (result.length == 0) {
                throw new HttpError(HttpStatus.NOT_FOUND, "no matching trust");      
            }
            else if (result.length > 1) {
                throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, "more than one trust");      
            } 
        });
    }
};