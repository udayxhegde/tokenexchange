"use strict";
const eventRoute = require("express").Router();
var HttpStatus = require('http-status-codes');
var eventHelper = require("../../utils/eventhelper");

//
// add middleware to log all incoming requests
//
eventRoute.use(function timeLog(req, res, next) {
    var date = new Date();

    // use our pino logger setup in req, is this necessary?
    req.log.info(`EventRoute Got request ${req.method} at time`, date.toLocaleString());
    next();
});


eventRoute.route('/:id')
    .get(function(req, res) {
        eventHelper.getEvent(req.params.id, function(err, item) {    
            if (err) {
                req.log.error("EventRoute Get for id ${req.params.id} failed", err);
                return res.send(err);
            }
            else {
                req.log.trace("EventRoute for id ${req.params.id} success");
                return res.json(item);
            }
        });
    })
    .put(function(req, res) {

    })
    .post(function(req, res) {
        req.log.error("EventRoute post not allowed for id");
        return res.status(HttpStatus.METHOD_NOT_ALLOWED).json({message: "post not allowed"});
    })
    .delete(function(req, res) {
        eventHelper.getEvent(req.params.id, function(err, item) {         
            if (err) {
                req.log.error("EventRoute delete for id ${req.params.id} failed", err);
                return res.send(err);
            }
            else {
                //access check in future... for now just allow
                eventHelper.deleteEvent(req.params.id, function(err, id) {
                    if (err){
                        req.log.error("error delete", req.param.id);
                        return res.json(err);
                    }
                    else {
                        req.log.info("EventRoute delete success for ", id);
                        return res.json({'id' : id});
                    }
                });
            }
        });
    });

eventRoute.route('/')
    .get(function(req, res) {
        for (const key in req.query) {
            console.log(key, req.query[key])
        }
        req.log.trace("eventRoute, reading all events");
        eventHelper.queryEvents(req.query, function(err, items) {
            if (err) {
                req.log.error("EventRoute read failed ", err);
                return res.send(err);
            }
            else {
                req.log.info("EventRoute read success %d items", items.length);
                return res.json(items);
            }
        });
    })
    .post(function(req, res) {
        eventHelper.validateEventCreate(req, function(error, result) {
            if (error) {
                req.log.error("eventRoute post validate failed", error);
                return res.status(error.status).json(error.message);
            }
            eventHelper.addEvent(result, function(err, item) {
                if (err) {
                    req.log.error("createEvent failed", err);
                    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(err);
                }
                else {
                    req.log.info("createEvent succeeded ", item);
                    return res.json(item);
                }
            });
        });
    });

module.exports = eventRoute;
