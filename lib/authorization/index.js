/**
 * Created by aismael on 9/1/2015.
 */
"use strict";


var path = require("path"),
    Q = require("q"),
    Joi = require("joi");


var AUTH_PARAM_SCOPE_DESCR = "Requested Authentication Context Class Reference values",
    AUTH_PARAM_RESPONSE_TYPE_DESCR = "only authorization code flow is supported",
    AUTH_PARAM_CLIENT_ID_DESCR = "client id which is registered with this OP",
    AUTH_PARAM_REDIRECT_URI_DESCR = "redirec uri back to the client",
    AUTH_PARAM_STATE_DESCR = "Opaque value used to maintain state between the request and the callback. Typically, Cross-Site Request Forgery (CSRF, XSRF) ",
    AUTH_PARAM_RESPONSE_MODE_DESCR = "Informs the Authorization Server of the mechanism to be used for returning parameters from the Authorization Endpoint.",
    AUTH_PARAM_NONCE_DESCR = "String value used to associate a Client session with an ID Token, and to mitigate replay attacks",
    AUTH_PARAM_DISPLAY_DESCR = "ASCII string value that specifies how the Authorization Server displays the authentication and consent user interface pages to the End-User.",
    AUTH_PARAM_PROMPT_DESCR = "Space delimited, case sensitive list of ASCII string values that specifies whether the Authorization Server prompts the End-User for reauthentication and consent",
    AUTH_PARAM_MAX_AGE_DESCR = "Maximum Authentication Age. Specifies the allowable elapsed time in seconds since the last time the End-User was actively authenticated by the OP.",
    AUTH_PARAM_UI_LOCALES_DESCR = "End-User's preferred languages and scripts for the user interface, represented as a space-separated list of BCP47 [RFC5646] language tag values",
    AUTH_PARAM_ID_TOKEN_HINT_DESCR = "ID Token previously issued by the Authorization Server being passed as a hint about the End-User's current or past authenticated session with the Client",
    AUTH_PARAM_LOGIN_HINT_DESCR = " Hint to the Authorization Server about the login identifier the End-User might use to log in",
    AUTH_PARAM_ACR_VALUES_DESCR = "Requested Authentication Context Class Reference values";


var AUTH_REQUEST_VALIDATION_SCHEMA = {
    //required params
    scope: Joi.string().description(AUTH_PARAM_SCOPE_DESCR),
    //response_type: Joi.string().required().valid("code").description(AUTH_PARAM_RESPONSE_TYPE_DESCR),
    response_type: Joi.string().description(AUTH_PARAM_RESPONSE_TYPE_DESCR),
    client_id: Joi.string().description(AUTH_PARAM_CLIENT_ID_DESCR),
    //redirect_uri: Joi.string().required().uri({scheme: ["https"]}).description(AUTH_PARAM_REDIRECT_URI_DESCR),
    redirect_uri: Joi.string().description(AUTH_PARAM_REDIRECT_URI_DESCR),
    //
    //optional params
    state: Joi.string().description(AUTH_PARAM_STATE_DESCR),
    response_mode: Joi.string().description(AUTH_PARAM_RESPONSE_MODE_DESCR),
    nonce: Joi.string().description(AUTH_PARAM_NONCE_DESCR),
    display: Joi.string().valid(["page", "popup", "touch", "wap"]).description(AUTH_PARAM_DISPLAY_DESCR),
    prompt: Joi.string().valid(["none", "login", "consent", "select_account"]).description(AUTH_PARAM_PROMPT_DESCR),
    max_age: Joi.number().positive().description(AUTH_PARAM_MAX_AGE_DESCR),
    ui_locales: Joi.string().description(AUTH_PARAM_UI_LOCALES_DESCR),
    id_token_hint: Joi.string().description(AUTH_PARAM_ID_TOKEN_HINT_DESCR),
    login_hint: Joi.string().description(AUTH_PARAM_LOGIN_HINT_DESCR),
    acr_values: Joi.string().description(AUTH_PARAM_ACR_VALUES_DESCR)
};


/**
 * Returns a string with the error code if validation fails.
 *
 * @param request
 * @param reply
 * @private
 */
function __authorizationRequestValidator(authorizeRequest) {

    var INVALID_REQUEST = "invlalid_request";

    authorizeRequest = authorizeRequest || {};


    //TODO: check to see if the client credentials match registration
    //if the client is not registered, the no redirect should be sent
    // should return "unauthorized_client" if the client is not registered

    if(!authorizeRequest.scope) {
        return INVALID_REQUEST;
    } else {
        var scopeVales = authorizeRequest.scope.split(" ");
        if(Array.isArray(scopeVales)) {

        } else {
            return "invalid_scope"
        }
    }

}


/**
 *
 * @param request
 * @param reply
 * @private
 */
function __postAuthorize(request, reply) {
    return reply({
        "success": true,
        "message": "",
        "redirect": String("rediretcTo")
    }).type("application/json");
}


/**
 *
 * @param request
 * @param reply
 * @private
 */
function __getAuthorize(request, reply) {
    return reply({
        "success": true,
        "message": "",
        "redirect": String("rediretcTo")
    }).type("application/json");
}


/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function (server, options, next) {

    //TODO check if all options are valid or use defaults and log status
    console.log(options);


    var oidcOptions = options;

    var __postAuthorizationValidator = function (payload, options, callback) {

        console.log("__postAuthorizationValidator");
        callback(null);
    };

    /**
     *
     */
    server.route({
        method: "POST",
        path: oidcOptions.oidc_url_root + "/authorize",
        config: {
            handler: __postAuthorize,
            description: "authorize",
            notes: "OIDC authorize  POST implementation",
            tags: ["api"],
            auth: null,
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                },
                "csrf_agent": {
                    enabled: false
                }
            },
            validate: {
                payload: AUTH_REQUEST_VALIDATION_SCHEMA,
                options: {
                    stripUnknown: true
                }
            }
        }
    });


    /**
     *
     */
    server.route({
        method: "GET",
        path: oidcOptions.oidc_url_root + "/authorize",
        config: {
            handler: __getAuthorize,
            description: "authorize",
            notes: "OIDC authorize  GET implementation",
            tags: ["api"],
            auth: null,
            plugins: {
                "hapi-auth-cookie": {
                    redirectTo: false
                },
                "csrf_agent": {
                    enabled: false
                }
            },
            validate: {
                query: AUTH_REQUEST_VALIDATION_SCHEMA,
                options: {
                    stripUnknown: true
                },
                callback: function (err, value) {
                    console.log("error:", err);
                }
                //payload: {
                //    //user_id: Joi.string().email().required().description(USER_ID_DESCR),
                //    //account_type: Joi.string().valid(["CUSTOMER", "AGENT"]).required().description(ACCOUNT_TYPE_DESCR)
                //}
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
    pkg: require('./package.json')
};

