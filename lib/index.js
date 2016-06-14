/**
 * Created by aismael on 8/26/2015.
 */
"use strict";

let path = require("path"),
    Q = require("q"),
    Joi = require("joi");

/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function (server, options, next) {

    if (!options.configuration ||
        (!Array.isArray(options.configuration.scopes_supported)) ||
        ((options.configuration.scopes_supported).length === 0) ||
        ((!options.configuration.jwk) ||
            (!options.configuration.jwk.pub_key_file_name)) ||
        ((!options.configuration.jwk) ||
            (!options.configuration.jwk.priv_key_file_name)) ||
        ((!options.configuration.jwk) ||
            (!options.configuration.jwk.cert_chain_file_name)) ||
        (!options.configuration.issuer)) {

        return next(new Error("Incorrect oidc options passed to module's register"));
    }

    /**
     * verify that the required app modules specified in config params are valid:
     * mainly the login_module
     */
    if (!options.login_module) {
        return next(new Error("login_module is not specified in options!"));
    } else {
        //try to requre the login_module:
        //
        try {
            let loginModulePath = options.login_module.trim();
            if (loginModulePath.match(/^\.|^\//)) {
                loginModulePath = path.join(path.dirname(require.main.filename), loginModulePath);
            }
            let tempVar = require(require.resolve(loginModulePath));
            if (typeof tempVar.login !== "function") {
                return next(new Error("login_module specified in options does not export a login function!"));
            }

            //login_module can be used now:
            options.login_module = tempVar;
        } catch (err) {
            return next(err);
        }
    }

    if (!options.client_registrar_module) {
        return next(new Error("client_registrar_module is not specified in options!"));
    } else {
        //try to requre the client_registrar_module:
        //
        try {
            let clientModulePath = options.client_registrar_module.trim();
            if (clientModulePath.match(/^\.|^\//)) {
                clientModulePath = path.join(path.dirname(require.main.filename), clientModulePath);
            }
            let tempVar = require(require.resolve(clientModulePath));
            if (typeof tempVar.getClientRegistration !== "function") {
                return next(new Error("client_registrar_module specified in options does not export a getClientRegistration function!"));
            }

            //client_registrar_module can be used now:
            options.client_registrar_module = tempVar;
        } catch (err) {
            return next(err);
        }
    }



    /**
     * load the individual plugins for authorization, token, and userInfo
     */
    [
        Q.Promise(
            (resolve, reject) => {
                server.register({
                    register: require("./config"),
                    options: options
                }, function (err) {
                    if (err) {
                        console.warn(err);
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
            }),
        Q.Promise(
            (resolve, reject) => {
                server.register({
                    register: require("./authorization"),
                    options: options
                }, (err) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
            }),
        Q.Promise(
            (resolve, reject) => {
                server.register({
                    register: require("./token"),
                    options: options
                }, (err) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve();
                    }
                });
            }),
        Q.Promise(
            (resolve, reject) => {
                server.register({
                    register: require("./userinfo"),
                    options: options
                }, (err) => {
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
            console.warn(err);
            next(err);
        })
        .done();
};

/**
 *
 * @type {{pkg: *}}
 */
module.exports.register.attributes = {
    pkg: require("./package.json")
};
