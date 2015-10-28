/**
 * Created by aismael on 8/26/2015.
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
    /**
     * load the individual plugins for authorization, token, and userInfo
     */
    [
        Q.Promise(function (resolve, reject) {
            server.register({
                    register: require("./config"),
                    options: options
                },
                function (err) {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
        }),
        Q.Promise(function (resolve, reject) {
            server.register({
                    register: require("./authorization"),
                    options: options
                },
                function (err) {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
        }),
        Q.Promise(function (resolve, reject) {
            server.register({
                    register: require("./token"),
                    options: options
                },
                function (err) {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
        }),
        Q.Promise(function (resolve, reject) {
            server.register({
                    register: require("./userinfo"),
                    options: options
                },
                function (err) {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
        })
    ].reduce(Q.when, Q())
        .then(next)
        .catch(function (err) {
            console.log(err);
            next(err)
        })
        .done();
};


/**
 *
 * @type {{pkg: *}}
 */
module.exports.register.attributes = {
    pkg: require('./package.json')
};


