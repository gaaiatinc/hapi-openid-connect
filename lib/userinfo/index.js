/**
 * Created by aismael on 9/1/2015.
 */
"use strict";

var path = require("path"),
    Q = require("q"),
    Joi = require("joi");


/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function (server, options, next) {

    next();
};


/**
 *
 * @type {{pkg: *}}
 */
module.exports.register.attributes = {
    pkg: require('./package.json')
};

