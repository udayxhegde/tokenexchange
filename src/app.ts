var express = require("express");
var logHelper = require("./utils/loghelper");
require('dotenv').config();

var port = process.env.PORT || 3001;

var trustApi = require("./api/trustroute");
var tokenApi = require("./api/tokenroute");

var app = express();
logHelper.init(app);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

/*
* Tell express to go to the apiRoute when it sees /API/notes in the URL
*/
app.use('/api/trust', trustApi);
app.use('/api/token', tokenApi);

app.use(function timeLog(req, res, next) {
    var date = new Date();

    console.log(`Got request ${req.method} at time`, date.toLocaleString());
    next();
});

app.listen(port);
logHelper.logger.info("express running log level %s logger level %s port %s", process.env.LOG_LEVEL, logHelper.logger.level, port);

