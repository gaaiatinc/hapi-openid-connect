/**
 * Created by aismael on 9/1/2015.
 */
"use strict";

let path = require("path"),
    Url = require("url"),
    FormURLEncoder = require("form-urlencoded"),
    Joi = require("joi");

const {promiseSequencer} = require("../utils/promise_utils");

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
    scope: Joi
        .string()
        .default("")
        .description(AUTH_PARAM_SCOPE_DESCR),
    response_type: Joi
        .string()
        .default("")
        .description(AUTH_PARAM_RESPONSE_TYPE_DESCR),
    client_id: Joi
        .string()
        .required()
        .description(AUTH_PARAM_CLIENT_ID_DESCR),
    redirect_uri: Joi
        .string()
        .uri({scheme: ["https"]})
        .required()
        .description(AUTH_PARAM_REDIRECT_URI_DESCR),

    //recommended params:
    state: Joi
        .string()
        .description(AUTH_PARAM_STATE_DESCR),

    //optional params
    response_mode: Joi
        .string()
        .description(AUTH_PARAM_RESPONSE_MODE_DESCR),
    nonce: Joi
        .string()
        .description(AUTH_PARAM_NONCE_DESCR),
    display: Joi
        .string()
        .valid(["page", "popup", "touch", "wap"])
        .default("page")
        .description(AUTH_PARAM_DISPLAY_DESCR),
    prompt: Joi
        .string()
        .valid(["login"])
        .default("login")
        .description(AUTH_PARAM_PROMPT_DESCR), //only login prompt is supported
    max_age: Joi
        .number()
        .positive()
        .description(AUTH_PARAM_MAX_AGE_DESCR),
    ui_locales: Joi
        .string()
        .description(AUTH_PARAM_UI_LOCALES_DESCR),
    id_token_hint: Joi
        .string()
        .description(AUTH_PARAM_ID_TOKEN_HINT_DESCR),
    login_hint: Joi
        .string()
        .description(AUTH_PARAM_LOGIN_HINT_DESCR),
    acr_values: Joi
        .string()
        .description(AUTH_PARAM_ACR_VALUES_DESCR)
};

let oidc_options;
let authorization_endpoint;
let user_info_endpoint;
let client_endpoint;

/**
 * This method verifies that the client ID and the redirect URI in the request
 *    match the respective ones in the client registry. If the client ID and
 *    redirect URI do not match the ones in the client registry, then no redirect
 *    is sent at all, this is necessary to prevent reflected attacks.  In this
 *    case only an error is returned to the user agent without redirects.
 *
 *
 *
 * @param  {[type]} authorize_request [description]
 * @return {[type]}                  [description]
 */
function __verify_client_registration_entries(authorize_request) {

    return new Promise(async (resolve, reject) => {
        let error_object = {
            error: "unauthorized_client",
            error_description: ""
        };

        try {
            if (!authorize_request.client_id || !authorize_request.redirect_uri) {
                error_object.error_description = "Incorrect client_id/redirect_uri values";
                return reject(error_object);
            }

            let redirect_url = Url.parse(authorize_request.redirect_uri);

            if (redirect_url.protocol.toLowerCase() !== "https:") {
                error_object.error_description = "Redirect_uri must use the https protocol.";
                return reject(error_object);
            }

            try {
                const client_registry = await client_endpoint
                    .client_registrar_module
                    .get_client_registration(authorize_request.client_id);
                if (!client_registry || (client_registry.redirect_uri_hostname.trim() !== redirect_url.hostname) || (client_registry.redirect_uri_port.trim() !== redirect_url.port)) {
                    error_object.error_description = "Incorrect client_id/redirect_uri values";
                    return reject(error_object);
                } else {
                    return resolve();
                }
            } catch (err) {
                return reject(error_object);
            }
        } catch (err) {
            error_object.error_description = "Incorrect client_id/redirect_uri values";
            return reject(error_object);
        }
    });
}

/**
 * Returns an error descriptor object with the error code if validation fails.
 *
 * @param       {[type]} authorize_request
 * @return      {[type]}
 */
function __validate_authorization_request(authorize_request) {
    return new Promise((resolve, reject) => {
        let error_object = {
            error: "invlalid_request",
            error_description: ""
        };

        if (authorize_request.state) {
            error_object.state = authorize_request.state;
        }

        if (authorize_request.nonce) {
            error_object.nonce = authorize_request.nonce;
        }

        let openid_scope_found = authorize_request
            .scope
            .split(" ")
            .find((element, idx, arr) => {
                if (element.trim() === "openid") {
                    return true;
                }
            });

        if (!openid_scope_found) {
            error_object.error = "invalid_scope";
            error_object.error_description = "scope must include openid";
            return reject(error_object);
        }

        if ((!authorize_request.response_type) || (authorize_request.response_type.trim() !== "code")) {
            error_object.error = "unsupported_response_type";
            error_object.error_description = "Only Authorization Code Flow is supported.";
            return reject(error_object);
        }

        return resolve(authorize_request);
    });
}

/**
 *
 * @param  {[type]} request              [description]
 * @param  {[type]} h                [description]
 * @param  {[type]} authorization_request [description]
 * @return {[type]}                      [description]
 */
async function __process_authorization_request(request, h, authorization_request) {
    /**
     * The first step in validating the authorizaion request is to verify that the
     * the client_id and the redirect_uri match the ones in the client registry
     * entry.  If this verification step fails, no reidrect should be sent.  this
     * is essential to prevent reflected attacks.
     *
     * @param  {[type]} authorization_request [description]
     * @return {[type]}                      [description]
     */
    try {
        await __verify_client_registration_entries(authorization_request);
        /**
             * Now that the client_id and redirect_uri are verified, we validate the
             * authorization request and we can redirect with errors if any is found.
             */
        let processing_tasks = [__validate_authorization_request, authorization_endpoint.authorization_request_registrar_module.post_authorization_request];

        try {
            const authorization_request_id = await promiseSequencer(processing_tasks, authorization_request);
            /**
             * Everything is good to proceed for End-User authentication & consent:
             */
            let temp_redirect_uri = user_info_endpoint.user_authentication_url + "?authorization_request_id=" + encodeURIComponent(authorization_request_id);
            return h.redirect(temp_redirect_uri);
        } catch (auth_validation_error) {
            let temp_redirect_uri = authorization_request.redirect_uri + "?" + FormURLEncoder(auth_validation_error);
            return h.redirect(temp_redirect_uri);
        }
    } catch (client_validation_error) {
        let error_html = "<html><head></head> <body>  " + JSON.stringify(client_validation_error, null, 4) + "  </body> </html>";
        return h
            .response(error_html)
            .code(401)
            .type("text/html");
    }
}

/**
 *
 * @param request
 * @param h
 * @private
 */
function __post_authorize(request, h) {
    let authorization_request = {};

    authorization_request.scope = request.payload["scope"];
    authorization_request.response_type = request.payload["response_type"];
    authorization_request.client_id = request.payload["client_id"];
    authorization_request.redirect_uri = request.payload["redirect_uri"];

    //recommended params:
    authorization_request.state = request.payload["state"];

    //optional params
    authorization_request.response_mode = request.payload["response_mode"];
    authorization_request.nonce = request.payload["nonce"];
    authorization_request.display = request.payload["display"];
    authorization_request.prompt = request.payload["prompt"];
    authorization_request.max_age = request.payload["max_age"]; //number
    authorization_request.ui_locales = request.payload["ui_locales"];
    authorization_request.id_token_hint = request.payload["id_token_hint"];
    authorization_request.login_hint = request.payload["login_hint"];
    authorization_request.acr_values = request.payload["acr_values"];

    __process_authorization_request(request, h, authorization_request);
}

/**
 *
 * @param request
 * @param h
 * @private
 */
function __get_authorize(request, h) {
    let authorization_request = {};

    authorization_request.scope = request.query["scope"];
    authorization_request.response_type = request.query["response_type"];
    authorization_request.client_id = request.query["client_id"];
    authorization_request.redirect_uri = request.query["redirect_uri"];

    //recommended params:
    authorization_request.state = request.query["state"];

    //optional params
    authorization_request.response_mode = request.query["response_mode"];
    authorization_request.nonce = request.query["nonce"];
    authorization_request.display = request.query["display"];
    authorization_request.prompt = request.query["prompt"];
    authorization_request.max_age = request.query["max_age"]; //number
    authorization_request.ui_locales = request.query["ui_locales"];
    authorization_request.id_token_hint = request.query["id_token_hint"];
    authorization_request.login_hint = request.query["login_hint"];
    authorization_request.acr_values = request.query["acr_values"];

    __process_authorization_request(request, h, authorization_request);
}

/**
 *
 * @param server
 * @param options
 */
const hoc_authorization_plugin = async (server, options) => {

    oidc_options = options;
    authorization_endpoint = oidc_options.configuration.authorization_endpoint;
    user_info_endpoint = oidc_options.configuration.user_info_endpoint;
    client_endpoint = oidc_options.configuration.client_endpoint;

    /**
     *
     */
    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/authorize",
        config: {
            handler: __post_authorize,
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
        path: oidc_options.oidc_url_path + "/authorize",
        config: {
            handler: __get_authorize,
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

    return;
};

/**
 * [plugin description]
 * @type {Object}
 */
module.exports.plugin = {
    register: hoc_authorization_plugin,
    pkg: require("./package.json")
};
