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
 * @param oidc_options
 * @param next
 */
module.exports.register = function(server, oidc_options, next) {

    if (!oidc_options.configuration ||
        (!Array.isArray(oidc_options.configuration.scopes_supported)) ||
        ((oidc_options.configuration.scopes_supported).length === 0) ||
        ((!oidc_options.configuration.jwk) ||
            (!oidc_options.configuration.jwk.pub_key_file_name)) ||
        ((!oidc_options.configuration.jwk) ||
            (!oidc_options.configuration.jwk.priv_key_file_name)) ||
        ((!oidc_options.configuration.jwk) || (!oidc_options.configuration.issuer_audience) ||
            (!oidc_options.configuration.jwk.cert_chain_file_name)) ||
        (!oidc_options.configuration.issuer)) {

        return next(new Error("Incorrect oidc options passed to module's register"));
    }

    /**
     * verify that the user_authentication_url uses https protocol:
     *
     */
    if (!oidc_options.configuration.user_info_endpoint.user_authentication_url) {
        return next(new Error("user_authentication_url for redirecting the user to login is not specified in options!"));
    } else {
        try {
            let user_login_url = Url.parse(oidc_options.configuration.user_info_endpoint.user_authentication_url);
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
    if (!oidc_options.configuration.user_info_endpoint.user_post_login_account_url) {
        return next(new Error("user_post_login_account_url for redirecting the user to account home page is not specified in options!"));
    } else {
        try {
            let user_post_login_account_url = Url.parse(oidc_options.configuration.user_info_endpoint.user_post_login_account_url);
            if (user_post_login_account_url.protocol !== "https:") {
                return next(new Error("User account home URL must use the https protocol"));
            }
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the required app modules specified in config params are valid:
     * first: the authorization_request_registrar_module:
     */
    if (!oidc_options.configuration.authorization_endpoint.authorization_request_registrar_module) {
        return next(new Error("authorization_request_registrar_module is not specified in options!"));
    } else {
        //try to require the authorization_request_registrar_module:
        //
        try {
            let temp_module_path = oidc_options.configuration.authorization_endpoint.authorization_request_registrar_module.trim();
            if (temp_module_path.match(/^\.|^\//)) {
                temp_module_path = path.join(path.dirname(require.main.filename), temp_module_path);
            }
            let temp_var = require(require.resolve(temp_module_path));
            if ((typeof temp_var.post_authorization_request !== "function") ||
                (typeof temp_var.put_authorization_request !== "function") ||
                (typeof temp_var.delete_authorization_request !== "function") ||
                (typeof temp_var.get_authorization_request !== "function")) {
                return next(new Error("authorization_request_registrar_module specified in options does not export required functions!"));
            }

            //authorization_request_registrar_module can be used now:
            oidc_options.configuration.authorization_endpoint.authorization_request_registrar_module = temp_var;
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the token_registrar_module exports the necessay functions:
     */
    if (!oidc_options.configuration.token_endpoint.token_registrar_module) {
        return next(new Error("token_registrar_module is not specified in options!"));
    } else {
        //try to require the token_registrar_module:
        //
        try {
            let temp_module_path = oidc_options.configuration.token_endpoint.token_registrar_module.trim();
            if (temp_module_path.match(/^\.|^\//)) {
                temp_module_path = path.join(path.dirname(require.main.filename), temp_module_path);
            }
            let temp_var = require(require.resolve(temp_module_path));
            if ((typeof temp_var.post_token !== "function") ||
                (typeof temp_var.put_token !== "function") ||
                (typeof temp_var.delete_token !== "function") ||
                (typeof temp_var.get_token !== "function")) {
                return next(new Error("token_registrar_module specified in options does not export required functions!"));
            }

            //token_registrar_module can be used now:
            oidc_options.configuration.token_endpoint.token_registrar_module = temp_var;
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the client_registrar_module is specified:
     */
    if (!oidc_options.configuration.client_endpoint.client_registrar_module) {
        return next(new Error("client_registrar_module is not specified in options!"));
    } else {
        //try to require the client_registrar_module:
        //
        try {
            let client_module_path = oidc_options.configuration.client_endpoint.client_registrar_module.trim();
            if (client_module_path.match(/^\.|^\//)) {
                client_module_path = path.join(path.dirname(require.main.filename), client_module_path);
            }
            let temp_var = require(require.resolve(client_module_path));
            if (typeof temp_var.get_client_registration !== "function") {
                return next(new Error("client_registrar_module specified in options does not export a get_client_registration() function!"));
            }

            if (typeof temp_var.get_client_account_id_for_credentials !== "function") {
                return next(new Error("client_registrar_module specified in options does not export a get_client_account_id_for_credentials() function!"));
            }

            //client_registrar_module can be used now:
            oidc_options.configuration.client_endpoint.client_registrar_module = temp_var;
        } catch (err) {
            return next(err);
        }
    }

    /**
     * verify that the user_account_registrar_module is specified:
     */
    if (!oidc_options.configuration.user_info_endpoint.user_account_registrar_module) {
        return next(new Error("user_account_registrar_module is not specified in options!"));
    } else {
        //try to require the client_registrar_module:
        //
        try {
            let user_account_registrar_module_path = oidc_options.configuration.user_info_endpoint.user_account_registrar_module.trim();
            if (user_account_registrar_module_path.match(/^\.|^\//)) {
                user_account_registrar_module_path = path.join(path.dirname(require.main.filename), user_account_registrar_module_path);
            }
            let temp_var = require(require.resolve(user_account_registrar_module_path));
            if (typeof temp_var.get_user_account_id_for_credentials !== "function") {
                return next(new Error("user_account_registrar_module specified in options does not export a get_user_account_id_for_credentials() function!"));
            }
            if (typeof temp_var.process_signin_request !== "function") {
                return next(new Error("user_account_registrar_module specified in options does not export a process_signin_request() function!"));
            }

            //client_registrar_module can be used now:
            oidc_options.configuration.user_info_endpoint.user_account_registrar_module = temp_var;
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
                        options: oidc_options
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
                        options: oidc_options
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
                        options: oidc_options
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
                        options: oidc_options
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
