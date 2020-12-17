const trustRoute = require("express").Router();
const trustHelper = require("../utils/trusthelper");


trustRoute.use(function timeLog(req, res, next) {
    var date = new Date();
    console.log(`trust Got request ${req.method} at time`, date.toLocaleString());
    next();
});
/*
* 
*/

trustRoute.route('/')
    .get(function (req, res) {
        trustHelper.queryTrusts(null, req.query, function(err, result) {
            if (err) {
                req.log.error("trustRoute get failed", err);
                return res.send(err);
            }
            else {
                req.log.trace("trustRoute get success");
                return res.json(result);
            }
        });

    })

trustRoute.route('/id/:id')
    .get(function (req, res) {
        trustHelper.queryTrusts(req.param.id, req.query, function(err, result) {
            if (err) {
                req.log.error("trustRoute get failed", err);
                return res.send(err);
            }
            else {
                req.log.trace("trustRoute get success");
                return res.json(result);
            }
        });

    })
    .post(function(req,res) {
        trustHelper.addTrust(req.param.id, req.body, function(err, result) {
            if (err) {
                req.log.error("trustRoute post failed", err);
                return res.send(err);
            }
            else {
                req.log.trace("trustRoute post success");
                return res.json(result);
            }
        });
    });


trustRoute.route('/id/:id/federatedId/:subject')
    .get(function (req, res) {
        trustHelper.getTrust(req.param.id, req.param.subject, function(err, result) {
            if (err) {
                req.log.error("trustRoute get failed", err, req.param.id, req.param.subject);
                return res.send(err);
            }
            else {
                req.log.trace("trustRoute post success", req.param.id, req.param.subject);
                return res.json(result);
            }
        });
    });

module.exports = trustRoute;
