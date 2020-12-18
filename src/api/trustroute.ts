const trustRoute = require("express").Router();
const trustHelper = require("../utils/trusthelper");
var logger = require("../utils/loghelper").logger;
var HttpStatus = require('http-status-codes');
var HttpError = require('../utils/HttpError');


var mids = process.env.ASSIGNED_MANAGED_IDS;
var ids = null;

if (mids) { ids = mids.split(',');}


trustRoute.use(function timeLog(req, res, next) {
    var date = new Date();
    logger.debug(`trust Got request ${req.method} at time`, date.toLocaleString());
    next();
});
/*
* 
*/

trustRoute.route('/')
    .get(async function (req, res) {

        try {
            var result = await trustHelper.queryTrusts(null, req.query);
            logger.debug("returning result");
            return res.json(result);
        }
        catch(error){
            req.log.error("trustRoute get failed %o", error);

            if (error instanceof HttpError) {
                res.status(error.status).send(error);
            }
            else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }
        }
    });
    /*
        trustHelper.queryTrusts(null, req.query)
        .then(function(result:any) {
            req.log.trace("trustRoute get success");
            return res.json(result);
        })
     ;   .catch(function(error) {
            req.log.error("trustRoute get failed %o", error);

            if (error instanceof HttpError) {
                res.status(error.status).send(error);
            }
            else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }
        });
    });
*/

trustRoute.route('/id') 
    .get(function(_req, res) {
        res.send(ids);
    });
trustRoute.route('/id/:id')
    .get(async function (req, res) {
        try {
            var result = await trustHelper.queryTrusts(req.params.id, req.query)
            return res.json(result);
        }
        catch(error) {
            req.log.error("trustRoute get id failed %o", error);

            if (error instanceof HttpError) {
                res.status(error.status).send(error);
            }
            else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }
        }
    })
    .post(async function(req,res) {
        try {
            var result = await trustHelper.addTrust(req.params.id, req.body)
            req.log.trace("trustRoute post success");
            return res.json(result);
        }
        catch(error) {
            logger.error("trust route post failed %o", error);
            logger.error(error);
            req.log.error("trustRoute post failed", error);
            if (error instanceof HttpError) {
                res.status(error.status).send(error);
            }
            else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }
        }
    });


trustRoute.route('/id/:id/federatedId/:subject')
    .get(async function (req, res) {
        try {
            var result = await trustHelper.getTrust(req.params.id, req.params.subject);
            logger.debug("done with get for id and subject");
            req.log.trace("trustRoute post success", req.param.id, req.param.subject);
            return res.json(result);
        }
        catch(error) {
            req.log.error("trustRoute get id subject failed", error);
            if (error instanceof HttpError) {
                res.status(error.status).send(error);
            }
            else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }
        }
    })
    .delete(async function(req,res) {
        try{
            var result = await trustHelper.deleteTrust(req.params.id, req.params.subject);
            logger.debug("done with delete success")
            res.status(HttpStatus.OK).send(result);
        }
        catch(error) {
            req.log.error("trustRoute delete id subject failed", error);
            if (error instanceof HttpError) {
                res.status(error.status).send(error);
            }
            else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
            }
        };
    });

module.exports = trustRoute;
