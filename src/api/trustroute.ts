const trustRoute = require("express").Router();

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
    })
    .post(function(req,res) {

    });


module.exports = trustRoute;
