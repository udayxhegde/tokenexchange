"use strict";
const schemaValidator = require("jsonschema").Validator;
const schemaValidatorInstance = new schemaValidator();
var HttpStatus = require('http-status-codes');
var logger = require("../utils/loghelper").logger;
var HttpError = require('../utils/HttpError');
//
// this is our trust schema... o
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
// this is our tokenexchange body schema... 
//
const tokenSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "required": [ "subjectToken", "clientId", "scopes"],
    "additionalProperties": false,
    "properties": {
        "subjectToken": { "type": "string"},  
        "clientId" : { "type": "string"},
        "scopes" : { "type": "string"},
        "options" : { "type": "string"}

    }
};

//
// make sure we are accepting an event that conforms to the schema.
//
async function validateTrust(trust) {
  const validateResult = schemaValidatorInstance.validate(trust, trustSchema);

  if (validateResult.errors.length) {
    let errorReturn = "";
    for(var index = 0; index < validateResult.errors.length; index++) {
        errorReturn = errorReturn.concat(" " + validateResult.errors[index].message);
    }
    throw new HttpError(HttpStatus.BAD_REQUEST, errorReturn);
  }
  return true;
}


//
// make sure we are accepting an event that conforms to the schema.
//
async function validateTokenBody(tokenBody) {
  const validateResult = schemaValidatorInstance.validate(tokenBody, tokenSchema);

  if (validateResult.errors.length) {
    let errorReturn = "";
    for(var index = 0; index < validateResult.errors.length; index++) {
        errorReturn = errorReturn.concat(" " + validateResult.errors[index].message);
    }
    throw new HttpError(HttpStatus.BAD_REQUEST, errorReturn);
  }
  return true;
}

module.exports = {validateTrust, validateTokenBody};