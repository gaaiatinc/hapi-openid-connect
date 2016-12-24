/**
 * Created by aismael on 9/1/2015.
 */
"use strict";

let path = require("path"),
    Q = require("q"),
    URL = require("url"),
    crypto = require("crypto"),
    FormURLEncoder = require("form-urlencoded"),
    moment = require("moment"),
    _has = require("lodash/has"),
    _startsWith = require("lodash/startsWith"),
    Joi = require("joi");

let oidc_options;
let authorization_endpoint;
let user_info_endpoint;
let client_endpoint;

var username_DESCR = "Email address",
    NEW_ACCESS_TOKEN_DESCR = "New password sent in the password reset request",
    NEW_ACCESS_TOKEN_AUTH_CODE_DESCR = "Authorization code sent in the reply from request_password_reset response",
    AUTHORIZATION_REQUEST_ID_DESCR = "An ID for the authorization request processing in progress",
    REDIRECT_URI_DESCR = "The URI to redirect to upon successful user authentication",
    ACCEPT_HEADER_DESCR = "The HTTP accept header, optional, defaults to text/html",
    ACCESS_TOKEN_DESCR = "Account password";

/**
 *
 * @param  {[type]}   server  [description]
 * @param  {[type]}   options [description]
 * @param  {Function} next    [description]
 * @return {[type]}           [description]
 */
module.exports.register = function(server, options, next) {

    oidc_options = options;
    authorization_endpoint = oidc_options.configuration.authorization_endpoint;
    user_info_endpoint = oidc_options.configuration.user_info_endpoint;
    client_endpoint = oidc_options.configuration.client_endpoint;

    function __signin_handler(request, reply) {
        var message = "";

        /**
         *
         * @param  {[type]} redirect_uri [description]
         * @return {[type]}              [description]
         */
        function get_sanitized_redirect_uri(redirect_uri) {
            if (typeof redirect_uri !== "string") {
                return null;
            } else if (_startsWith(redirect_uri.trim().toUpperCase(), "HTTPS")) {
                let redirect_url = URL.parse(redirect_uri);
                let issuer_url = URL.parse(oidc_options.configuration.issuer);

                if (redirect_url.host === issuer_url.host) {
                    return redirect_uri;
                }
            } else if (_startsWith(redirect_uri.trim(), "/")) {
                return redirect_uri;
            } else {
                return null;
            }
        }

        /**
         *
         * @param  {[type]} query_error_message [description]
         * @param  {[type]} redirect_descriptor [description]
         * @return {[type]}                     [description]
         */
        function get_redirect_to_signin_with_error(query_error_message, redirect_descriptor) {
            let query_atring_obj = redirect_descriptor || {
                error: query_error_message
            };

            return URL.format(user_info_endpoint.user_authentication_url + "?" + FormURLEncoder(query_atring_obj));
        }

        user_info_endpoint.user_account_registrar_module.process_signin_request(request, request)
            .then((user_account_id) => {

                /**
                 * login is successful, one of the following actions will be taken in the exact orfer:
                 *
                 * 1- if the request has a query variable named authorization_request_id, then it will be used:
                 * 2- if the request has a redirect_uri query variable, then it will be used
                 * 3- otherwise, the user_post_login_account_url (in the plugin config) will be used.
                 */
                let redirect_uri;

                if (request.query["authorization_request_id"]) {
                    //lookup the redirect uri of the respective client:
                    authorization_endpoint.authorization_request_registrar_module.get_authorization_request(request.query["authorization_request_id"])
                        .then((authorization_request_record) => {

                            let redirect_query_params = {};
                            if (authorization_request_record.state) {
                                redirect_query_params.state = authorization_request_record.state;
                            }

                            redirect_query_params = {
                                code: authorization_request_record._id.toString()
                            };

                            authorization_request_record.granted = true;
                            authorization_request_record.subject = user_account_id;
                            authorization_endpoint.authorization_request_registrar_module.put_authorization_request(authorization_request_record)
                                .then(() => {
                                    redirect_uri = URL.format(authorization_request_record.redirect_uri + "?" + FormURLEncoder(redirect_query_params));
                                    return reply.redirect(redirect_uri);
                                }, (err) => {
                                    redirect_uri = URL.format(authorization_request_record.redirect_uri + "?" + FormURLEncoder({
                                        error: "authorization request expired"
                                    }));
                                    return reply.redirect(redirect_uri);
                                });
                        }, (err) => {
                            redirect_uri = get_redirect_to_signin_with_error("Authorization request ID not found");
                            return reply.redirect(redirect_uri);
                        });
                } else if (get_sanitized_redirect_uri(request.query["redirect_uri"])) {
                    redirect_uri = get_sanitized_redirect_uri(request.query["redirect_uri"]);
                    return reply.redirect(redirect_uri);
                } else {
                    let reply_obj = {
                        status: "success",
                        status_code: 200,
                        status_message: "Signin successful"
                    };
                    return reply(reply_obj).type("application/json").code(200);
                }
            }, (err) => {
                let error_message = "Incorrect username and/or password";
                let redirect_descriptor = null;
                if (request.query["authorization_request_id"]) {
                    redirect_descriptor = {};
                    redirect_descriptor.authorization_request_id = request.query["authorization_request_id"];
                } else if (get_sanitized_redirect_uri(request.query["redirect_uri"])) {
                    redirect_descriptor = {};
                    redirect_descriptor.redirect_uri = get_sanitized_redirect_uri(request.query["redirect_uri"]);
                }

                if (redirect_descriptor) {
                    redirect_descriptor.error = error_message;
                    redirect_descriptor.error_code = 401;
                    let redirect_uri = get_redirect_to_signin_with_error(error_message, redirect_descriptor);
                    return reply.redirect(redirect_uri);
                } else {
                    let reply_obj = {
                        status: "error",
                        status_code: 401,
                        status_message: "Incorrect username and/or password"
                    };
                    return reply(reply_obj).type("application/json").code(401);
                }
            });
    }

    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/signin",
        config: {
            handler: __signin_handler,
            tags: ["api"],
            description: "signin",
            notes: "An API method implementing account signin method",
            auth: {
                mode: "try",
                strategy: "session"
            },
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                }
            },
            validate: {
                payload: {
                    username: Joi.string().email().required().lowercase().description(username_DESCR),
                    password: Joi.string().required().description(ACCESS_TOKEN_DESCR)
                },
                query: {
                    authorization_request_id: Joi.string().description(AUTHORIZATION_REQUEST_ID_DESCR),
                    redirect_uri: Joi.string().description(REDIRECT_URI_DESCR)
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })
            }
        }
    });

    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/user_info/change_password",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.change_password,
            tags: ["api"],
            description: "change_password",
            notes: "An API method implementing password change request",
            auth: "session",
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                },
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                payload: {
                    username: Joi.string().email().required().lowercase().description(username_DESCR),
                    password: Joi.string().required().description(ACCESS_TOKEN_DESCR),
                    new_password: Joi.string().required().description(ACCESS_TOKEN_DESCR)
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })
            }
        }
    });

    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/user_info/request_password_reset",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.request_password_reset,
            tags: ["api"],
            description: "request_password_reset",
            notes: "An API method implementing the function of password reset request",
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                },
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                payload: {
                    username: Joi.string().email().required().lowercase().description(username_DESCR),
                    "g-recaptcha-response": Joi.string().default("")
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })
            }
        }
    });

    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/user_info/perform_password_reset",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.perform_password_reset,
            tags: ["api"],
            description: "perform_password_reset",
            notes: "An API method implementing the function of performing a password reset",
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                },
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                payload: {
                    username: Joi.string().email().required().lowercase().description(username_DESCR),
                    new_password: Joi.string().required().description(NEW_ACCESS_TOKEN_DESCR),
                    authorization_code: Joi.string().required().description(NEW_ACCESS_TOKEN_AUTH_CODE_DESCR)
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })

            }
        }
    });

    /**
     *
     * @param  {[type]} request [description]
     * @param  {[type]} reply   [description]
     * @return {[type]}         [description]
     */
    function __signout_handler(request, reply) {
        try {
            request.cookieAuth.clear();
        } catch (err) {
            console.error(err);
        }

        return reply.redirect(user_info_endpoint.user_authentication_url);
    }

    /**
     *
     */
    server.route({
        method: "GET",
        path: oidc_options.oidc_url_path + "/signout",
        config: {
            handler: __signout_handler,
            description: "signout",
            notes: "Redirects the user agent to the signin URL after clearing the auth session cookie",
            tags: ["api"]
        }
    });

    /**
     *
     */
    server.route({
        method: "GET",
        path: oidc_options.oidc_url_path + "/user_info/activate",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.activate,
            description: "activate",
            notes: "Activates an account just created.",
            tags: ["api"],
            plugins: {
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                query: {
                    "act-code": Joi.string().required()
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })

            }
        }
    });

    /**
     *
     */
    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/user_info/resend_activation_code",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.resend_activation_code,
            description: "resend_activation_code",
            notes: "Resend activation code for a new account.",
            tags: ["api"],
            plugins: {
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                payload: {
                    "email_address": Joi.string().email().required().description("Email address for sample_app")
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })

            }
        }
    });

    /**
     *
     */
    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/user_info/delete",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.remove_account,
            description: "activate",
            notes: "Deletes an account in DB.",
            tags: ["api"],
            auth: "session",
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                },
                "csrf_agent": {
                    enabled: true
                },
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                payload: {
                    username: Joi.string().email().required().lowercase().description(username_DESCR)
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })
            }
        }
    });

    /**
     *
     */
    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/user_info/signup",
        config: {
            handler: user_info_endpoint.user_account_registrar_module.signup,
            tags: ["api"],
            description: "signup",
            notes: "An API method implementing sign up for a sample_app account",
            plugins: {
                "resource_set": {
                    enabled: true
                }
            },
            validate: {
                payload: {
                    username: Joi.string().email().required().lowercase().description(username_DESCR),
                    password: Joi.string().required().description(ACCESS_TOKEN_DESCR),
                    password_confirmation: Joi.string().required().description(ACCESS_TOKEN_DESCR),

                    //optional
                    first_name: Joi.string(),
                    locale: Joi.string().length(5).description("iso locale string, e.g. en_US"),
                    last_name: Joi.string(),
                    remember_me: Joi.string().description("checkbox on"),
                    accept_terms: Joi.string().description("checkbox on"),
                    "g-recaptcha-response": Joi.string().default("")
                },
                headers: Joi.object({
                    "accept": Joi.string().default("text/html").description(ACCEPT_HEADER_DESCR),
                    "accept-language": Joi.string().required(),
                    "user-agent": Joi.string().required()
                }).options({
                    allowUnknown: true
                })
            }
        }
    });

    next();
};

/**
 *
 * @type {{pkg: *}}
 */
module.exports.register.attributes = {
    pkg: require("./package.json")
};
