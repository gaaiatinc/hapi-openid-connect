/**
 * Created by aismael on 9/1/2015.
 */
"use strict";

let path = require("path"),
    Q = require("q"),
    Url = require("url"),
    Joi = require("joi");

let AUTH_PARAM_SCOPE_DESCR = "Requested Authentication Context Class Reference values",
    AUTH_PARAM_RESPONSE_TYPE_DESCR = "only authorization code flow is supported",
    AUTH_PARAM_CLIENT_ID_DESCR = "client id which is registered with this OP",
    AUTH_PARAM_REDIRECT_URI_DESCR = "redirect uri back to the client",
    AUTH_PARAM_STATE_DESCR = "Opaque value used to maintain state between the request and the callback. Typically, Cross-Site Request Forgery (CSRF, XSRF) ",
    AUTH_PARAM_RESPONSE_MODE_DESCR = "Informs the Authorization Server of the mechanism to be used for returning parameters from the Authorization Endpoint.",
    AUTH_PARAM_NONCE_DESCR = "String value used to associate a Client session with an ID Token, and to mitigate replay attacks",
    AUTH_PARAM_DISPLAY_DESCR = "ASCII string value that specifies how the Authorization Server displays the authentication and consent user interface pages to the End-User.",
    AUTH_PARAM_PROMPT_DESCR = "Only login prompt type is supported by the current implementation, that specifies the Authorization Server is to prompt the End-User for reauthentication and consent",
    AUTH_PARAM_MAX_AGE_DESCR = "Maximum Authentication Age. Specifies the allowable elapsed time in seconds since the last time the End-User was actively authenticated by the OP.",
    AUTH_PARAM_UI_LOCALES_DESCR = "End-User's preferred languages and scripts for the user interface, represented as a space-separated list of BCP47 [RFC5646] language tag values",
    AUTH_PARAM_ID_TOKEN_HINT_DESCR = "ID Token previously issued by the Authorization Server being passed as a hint about the End-User's current or past authenticated session with the Client",
    AUTH_PARAM_LOGIN_HINT_DESCR = " Hint to the Authorization Server about the login identifier the End-User might use to log in",
    AUTH_PARAM_ACR_VALUES_DESCR = "Requested Authentication Context Class Reference values";
    // AUTH_HEADER_PARAM_AUTHORIZATION = "Http header Authorization, must be of type 'Basic', containing the client credentials";

let AUTH_REQUEST_VALIDATION_SCHEMA = {
    //required params
    scope: Joi.string().description(AUTH_PARAM_SCOPE_DESCR),
    response_type: Joi.string().description(AUTH_PARAM_RESPONSE_TYPE_DESCR),
    client_id: Joi.string().description(AUTH_PARAM_CLIENT_ID_DESCR),
    redirect_uri: Joi.string().uri({
        scheme: ["https"]
    }).description(AUTH_PARAM_REDIRECT_URI_DESCR),

    //recommended params:
    state: Joi.string().description(AUTH_PARAM_STATE_DESCR),

    //optional params
    response_mode: Joi.string().description(AUTH_PARAM_RESPONSE_MODE_DESCR),
    nonce: Joi.string().description(AUTH_PARAM_NONCE_DESCR),
    display: Joi.string().valid(["page", "popup", "touch", "wap"]).default("page").description(AUTH_PARAM_DISPLAY_DESCR),
    prompt: Joi.string().valid(["login"]).default("login").description(AUTH_PARAM_PROMPT_DESCR), //only login prompt is supported
    max_age: Joi.number().positive().description(AUTH_PARAM_MAX_AGE_DESCR),
    ui_locales: Joi.string().description(AUTH_PARAM_UI_LOCALES_DESCR),
    id_token_hint: Joi.string().description(AUTH_PARAM_ID_TOKEN_HINT_DESCR),
    login_hint: Joi.string().description(AUTH_PARAM_LOGIN_HINT_DESCR),
    acr_values: Joi.string().description(AUTH_PARAM_ACR_VALUES_DESCR)
};

let oidcOptions;

/**
 * Returns a string with the error code if validation fails.
 *
 * @param request
 * @param reply
 * @private
 */
function __authorizationRequestValidator(authorizeRequest) {

    let errorObject = {
        error: "invlalid_request",
        error_description: ""
    };

    if (authorizeRequest.state) {
        errorObject.state = authorizeRequest.state;
    }

    if (authorizeRequest.nonce) {
        errorObject.nonce = authorizeRequest.nonce;
    }

    let openidScopeFount = authorizeRequest.scope.finc((element, idx, arr) => {
        if (element.trim() === "openid") {
            return true;
        }
    });

    if (!openidScopeFount) {
        errorObject.error_description = "scope must include openid";
        return errorObject;
    }

    if (authorizeRequest.response_type.trime() !== "code") {
        errorObject.error_description = "Only Authorization Code Flow is supported.";
        return errorObject;
    }

    try {
        if(!authorizeRequest.client_id || !authorizeRequest.redirect_uri) {
            errorObject.error_description = "Incorrect client_id/redirect_uri values";
            return errorObject;
        }

        let redirectUrl = Url.parse(authorizeRequest.redirect_uri);
        if (redirectUrl.protocol !== "https") {
            errorObject.error_description = "Redirect_uri must use the https protocol.";
            return errorObject;
        }

        let clientRegistry = oidcOptions.client_registrar_module.getClientRegistration(authorizeRequest.client_id);
        if (!clientRegistry || (clientRegistry.clientDomain.trim() !== redirectUrl.host)) {
            errorObject.error_description = "Request redirect_uri does not match client registry.";
            return errorObject;
        }
    } catch (err) {
        errorObject.error_description = "Incorrect client_id/redirect_uri values";
        return errorObject;
    }

    return null;
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

    oidcOptions = options;

    let __postAuthorizationValidator = function (payload, options, callback) {

        //console.log("__postAuthorizationValidator");
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
            plugins: {},
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
            plugins: {},
            validate: {
                query: AUTH_REQUEST_VALIDATION_SCHEMA,
                options: {
                    stripUnknown: true
                }
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
