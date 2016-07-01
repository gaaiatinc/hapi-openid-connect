/**
 * Created by aismael on 8/26/2015.
 */
"use strict";

let path = require("path"),
    Q = require("q"),
    Url = require("url"),
    Joi = require("joi");

/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function(server, options, next) {

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
     * verify that the user_authentication_url uses https protocol:
     *
     */
    if (!options.user_authentication_url) {
        return next(new Error("user_authentication_url for redirecting the user to login is not specified in options!"));
    } else {
        try {
            let user_login_url = Url.parse(options.user_authentication_url);
            if (user_login_url.protocol !== "https:") {
                return next(new Error("User authorization URL must use the https protocol"));
            }

        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the user_post_login_account_url uses https protocol:
     *
     */
    if (!options.user_post_login_account_url) {
        return next(new Error("user_post_login_account_url for redirecting the user to account home page is not specified in options!"));
    } else {
        try {
            let user_post_login_account_url = Url.parse(options.user_post_login_account_url);
            if (user_post_login_account_url.protocol !== "https:") {
                return next(new Error("User account home URL must use the https protocol"));
            }
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the required app modules specified in config params are valid:
     * first: the authorization_request_store_module:
     */
    if (!options.authorization_request_store_module) {
        return next(new Error("authorization_request_store_module is not specified in options!"));
    } else {
        //try to require the authorization_request_store_module:
        //
        try {
            let temp_module_path = options.authorization_request_store_module.trim();
            if (temp_module_path.match(/^\.|^\//)) {
                temp_module_path = path.join(path.dirname(require.main.filename), temp_module_path);
            }
            let temp_var = require(require.resolve(temp_module_path));
            if ((typeof temp_var.post_authorization_request !== "function") ||
                (typeof temp_var.put_authorization_request !== "function") ||
                (typeof temp_var.delete_authorization_request !== "function") ||
                (typeof temp_var.get_authorization_request !== "function")) {
                return next(new Error("authorization_request_store_module specified in options does not export required functions!"));
            }

            //client_registrar_module can be used now:
            options.authorization_request_store_module = temp_var;
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the client_registrar_module is specified:
     */
    if (!options.client_registrar_module) {
        return next(new Error("client_registrar_module is not specified in options!"));
    } else {
        //try to require the client_registrar_module:
        //
        try {
            let client_module_path = options.client_registrar_module.trim();
            if (client_module_path.match(/^\.|^\//)) {
                client_module_path = path.join(path.dirname(require.main.filename), client_module_path);
            }
            let temp_var = require(require.resolve(client_module_path));
            if (typeof temp_var.get_client_registration !== "function") {
                return next(new Error("client_registrar_module specified in options does not export a get_client_registration() function!"));
            }

            //client_registrar_module can be used now:
            options.client_registrar_module = temp_var;
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the user_account_registrar_module is specified:
     */
    if (!options.user_account_registrar_module) {
        return next(new Error("user_account_registrar_module is not specified in options!"));
    } else {
        //try to require the client_registrar_module:
        //
        try {
            let user_account_registrar_module_path = options.user_account_registrar_module.trim();
            if (user_account_registrar_module_path.match(/^\.|^\//)) {
                user_account_registrar_module_path = path.join(path.dirname(require.main.filename), user_account_registrar_module_path);
            }
            let temp_var = require(require.resolve(user_account_registrar_module_path));
            if (typeof temp_var.get_user_profile_for_signin !== "function") {
                return next(new Error("user_account_registrar_module specified in options does not export a get_user_profile_for_signin() function!"));
            }

            if (typeof temp_var.update_user_profile_for_signout !== "function") {
                return next(new Error("user_account_registrar_module specified in options does not export a update_user_profile_for_signout() function!"));
            }

            //client_registrar_module can be used now:
            options.user_account_registrar_module = temp_var;
        } catch (err) {
            return next(err);
        }
    }

    /**
     * load the individual plugins for config, authorization, token, and userInfo
     */
    [
        Q.Promise(
            (resolve, reject) => {
                try {
                    server.register({
                        register: require("./config"),
                        options: options
                    }, function(err) {
                        if (err) {
                            console.warn(err);
                            return reject(err);
                        } else {
                            return resolve();
                        }
                    });
                } catch (err) {
                    return reject(err);
                }
            }),
        Q.Promise(
            (resolve, reject) => {
                try {
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
                } catch (err) {
                    return reject(err);
                }
            }),
        Q.Promise(
            (resolve, reject) => {
                try {
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
                } catch (err) {
                    return reject(err);
                }
            }),
        Q.Promise(
            (resolve, reject) => {
                try {
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
                } catch (err) {
                    return reject(err);
                }
            })
    ].reduce(Q.when, Q())
        .then(next)
        .catch(function(err) {
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
