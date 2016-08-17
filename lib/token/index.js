/**
 * Created by aismael on 9/1/2015.
 */
"use strict";

let path = require("path"),
    Q = require("q"),
    fs = require("fs"),
    jwt = require("jsonwebtoken"),
    Joi = require("joi");

let AUTH_HEADER_PARAM_AUTHORIZATION = "REQUIRED. Http header Authorization, must be of type 'Basic', containing the requester's credentials.";

let TOKEN_REQUEST_VALIDATION_SCHEMA = {
    grant_type: Joi.string().required().valid(["authorization_code", "password", "refresh_token"]).description("Only 'authorization_code' , 'password', and 'refresh_token' are supported"),
    code: Joi.string().description("The authorization code issued via the Authorization Request endpoint - required for authorization_code grant_type"),
    redirect_uri: Joi.string().uri({
        scheme: ["https"]
    }).description("The same redirect_uri registered for the client, and must be identical to the redirect_uri parameter value that was included in the initial Authorization Request  - required for authorization_code grant_type"),
    client_id: Joi.string().description("The client_id - required for authorization_code grant_type"),
    username: Joi.string().description("The resource owner's username - rquired for the password grant_type"),
    password: Joi.string().description("The resource owner's password - rquired for the password grant_type"),
    scope: Joi.string().description("The scope - optional for the both password and refresh_token grant_types"),
    refresh_token: Joi.string().description("The refresh_token - rquired for the refresh_token grant_type")
};

let oidc_options;
let authorization_endpoint;
let user_info_endpoint;
let client_endpoint;
let token_endpoint;

let private_key;

/**
 *
 * @param  {[type]} request [description]
 * @return {[type]}         [description]
 */
function __verify_and_get_token_request_params(request) {
    let request_params = {
        grant_type: request.payload.grant_type
    };

    let authorization_header = request.headers["authorization"];

    let authorization_credentials;

    if (authorization_header) {
        let auth_header_str_array = authorization_header.match(/(\S+)\s+(\S+)/);

        if ((auth_header_str_array) && (auth_header_str_array[1].trim().toUpperCase() === "BASIC")) {
            try {
                let temp_buff = new Buffer(auth_header_str_array[2], "base64");
                let temp_str = temp_buff.toString("utf8");
                let temp_str_arr = temp_str.match(/(\S+):(\S+)/);

                if (temp_str_arr) {
                    let temp_authorization_credentials = {};
                    temp_authorization_credentials.username = temp_str_arr[1].trim();
                    temp_authorization_credentials.password = temp_str_arr[2].trim();

                    request_params.authorization_credentials = temp_authorization_credentials;
                }
            } catch (err) {}
        }
    }

    if (request_params.grant_type === "authorization_code") {
        /**
         * grant_type "authorization_code":
         *
         * code
         *     REQUIRED.  The authorization code received from the
         *     authorization server.
         *
         * redirect_uri
         *     REQUIRED, if the "redirect_uri" parameter was included in the
         *     authorization request as described in Section 4.1.1, and their
         *     values MUST be identical.
         *
         * client_id
         *     REQUIRED, if the client is not authenticating with the
         *     authorization server as described in Section 3.2.1.
         *
         */

        if (request.payload.code) {
            request_params.code = request.payload.code;
        } else {
            throw new Error("code is required for authorization_code grant_type");
        }

        if (request.payload.redirect_uri) {
            request_params.redirect_uri = request.payload.redirect_uri;
        } else {
            throw new Error("redirect_uri is required for authorization_code grant_type");
        }

        if (request.payload.client_id) {
            request_params.client_id = request.payload.client_id;
        } else {
            throw new Error("client_id is required for authorization_code grant_type");
        }
    } else if (request_params.grant_type === "password") {

        /**
         *
         * grant_type "password":
         *
         * username:
         *     REQUIRED.  The resource owner username.
         *
         * password:
         *     REQUIRED.  The resource owner password.
         *
         * scope:
         *     OPTIONAL.  The scope of the access request as described by Section 3.3.
         */

        if (request.payload.username) {
            request_params.username = request.payload.username;
        } else {
            throw new Error("username is required for password grant_type");
        }

        if (request.payload.password) {
            request_params.password = request.payload.password;
        } else {
            throw new Error("password is required for password grant_type");
        }

        if (request.payload.scope) {
            request_params.scope = request.payload.scope;
        }

    } else if (request_params.grant_type === "refresh_token") {

        /**
         * grant_type "refresh_token".
         *
         * refresh_token:
         *     REQUIRED.  The refresh token issued to the client.
         *
         * scope:
         *     OPTIONAL.  The scope of the access request as described by
         *         Section 3.3.  The requested scope MUST NOT include any scope
         *         not originally granted by the resource owner, and if omitted is
         *         treated as equal to the scope originally granted by the
         *         resource owner.
         *
         */
        if (request.payload.refresh_token) {
            request_params.refresh_token = request.payload.refresh_token;
        } else {
            throw new Error("refresh_token is required for refresh_token grant_type");
        }

        if (request.payload.scope) {
            request_params.scope = request.payload.scope;
        }

    }

    return request_params;
}

/**
   //  5.1.  Successful Response
   //
   //     The authorization server issues an access token and optional refresh
   //     token, and constructs the response by adding the following parameters
   //     to the entity-body of the HTTP response with a 200 (OK) status code:
   //
   //     access_token
   //           REQUIRED.  The access token issued by the authorization server.
   //
   //     token_type
   //           REQUIRED.  The type of the token issued as described in
   //           Section 7.1.  Value is case insensitive.
   //
   //     expires_in
   //           RECOMMENDED.  The lifetime in seconds of the access token.  For
   //           example, the value "3600" denotes that the access token will
   //           expire in one hour from the time the response was generated.
   //           If omitted, the authorization server SHOULD provide the
   //           expiration time via other means or document the default value.
   //
   //
   //
   //
   //
   //  Hardt                        Standards Track                   [Page 43]
   //
   //  RFC 6749                        OAuth 2.0                   October 2012
   //
   //
   //     refresh_token
   //           OPTIONAL.  The refresh token, which can be used to obtain new
   //           access tokens using the same authorization grant as described
   //           in Section 6.
   //
   //     scope
   //           OPTIONAL, if identical to the scope requested by the client;
   //           otherwise, REQUIRED.  The scope of the access token as
   //           described by Section 3.3.
   //
   //
   // response:
   //  {
   //    "access_token":"2YotnFZFEjr1zCsicMWpAA",
   //    "token_type":"example",
   //    "expires_in":3600,
   //    "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA",
   //    "example_parameter":"example_value"
   //  }
   //
   //
 */

/**
 *
 * @param  {[type]} request_params [description]
 * @return {[type]}                [description]
 */
function __send_token_for_authorization_code(request_params, request, reply) {

    function __process_authorization_code(request_params) {
        return authorization_endpoint.authorization_request_registrar_module.get_authorization_request(request_params.code);
    }

    [__process_authorization_header_for_client, __process_authorization_code].reduce(Q.when, Q(request_params))
        .then((authorization_request_record) => {
            if (authorization_request_record.granted) {
                if ((authorization_request_record.client_id === request_params.client_id) &&
                    (authorization_request_record.redirect_uri === request_params.redirect_uri)) {

                    //send token for authorization_code grant_type
                    let oidc_claims = {
                        audience: [authorization_request_record.client_id],
                        subject: authorization_request_record.subject
                    };

                    if (authorization_request_record.nonce) {
                        oidc_claims.nonce = authorization_request_record.nonce;
                    }

                    return __send_oidc_token(request, reply, oidc_claims, token_endpoint.authorization_code_grant_type.token_duration_seconds);
                }
            }

            /**
             * if we get here, then either the authorization_code has expired,
             * invalid, or used already
             */
            return reply({
                "error": "access_denied",
                "error_description": "Invalid, denied, or expired authorization code"
            }).type("application/json").code(401);
        }, (err) => {
            return reply({
                "error": "access_denied",
                "error_description": "Invalid, denied, expired authorization code, or incorrect Basic authorization header"
            }).type("application/json").code(401);
        });
}

/**
 *
 * @param  {[type]} request_params [description]
 * @return {[type]}                [description]
 */
function __send_token_for_refresh_token(request_params, request, reply) {
    return reply({
        status: "Not implemented.",
        status_code: 501
    }).code(501).type("application/json");
}

/**
 * The authorization header credentials will be checked with the clien_registrar.
 *
 * @param  {[type]} request_params [description]
 * @return {[type]}                [description]
 */
function __process_authorization_header_for_client(request_params) {
    return Q.Promise((resolve, reject) => {
        client_endpoint.client_registrar_module.get_client_account_id_for_credentials(request_params.authorization_credentials.username, request_params.authorization_credentials.password)
            .then((client_account_id) => {
                return resolve(request_params);
            })
            .catch((err) => {
                return reject(new Error("Unauthorized request"));
            });

    });
}

/**
 * The credentials will be checked with the user_registrar.
 *
 * If no user account matches the credentials, then, the
 * request is denied.
 *
 * @param  {[type]} request_params [description]
 * @return {[type]}                [description]
 */
function __process_authorization_header_for_user(request_params) {
    return Q.Promise((resolve, reject) => {
        user_info_endpoint.user_account_registrar_module.get_user_account_id_for_credentials(request_params.authorization_credentials.username, request_params.authorization_credentials.password)
            .then((user_account_id) => {
                return resolve(request_params);
            }, reject);
    });
}

/**
 *
 * @param  {[type]} request_params [description]
 * @return {[type]}                [description]
 */
function __send_token_for_password(request_params, request, reply) {

    let authorization_header_processor = null;
    if ((request_params.username === request_params.authorization_credentials.username) &&
        (request_params.password === request_params.authorization_credentials.password)) {
        //the user is requesting an id password_grant:
        //
        authorization_header_processor = __process_authorization_header_for_user(request_params);
    } else {
        authorization_header_processor = __process_authorization_header_for_client(request_params);
    }

    authorization_header_processor.then(
            () => {
                user_info_endpoint.user_account_registrar_module.get_user_account_id_for_credentials(request_params.username, request_params.password)
                    .then((user_account_id) => {

                        //send token for password grant_type
                        let oidc_claims = {
                            audience: [oidc_options.configuration.issuer_audience],
                            subject: user_account_id
                        };

                        return __send_oidc_token(request, reply, oidc_claims, token_endpoint.password_grant_type.token_duration_seconds);

                    }, (err) => {
                        return reply({
                            "error": "access_denied",
                            "error_description": "Invalid, denied, or expired authorization code"
                        }).type("application/json").code(401);
                    });

            })
        .catch((err) => {
            return reply({
                "error": "access_denied",
                "error_description": "Invalid, denied, or incorrect authorization credentials"
            }).type("application/json").code(401);
        });

}

/**
 *
 * @param  {[type]} request                [description]
 * @param  {[type]} reply                  [description]
 * @param  {[type]} oidc_claims            [description]
 * @param  {[type]} token_duration_seconds [description]
 * @return {[type]}                        [description]
 */
function __send_oidc_token(request, reply, oidc_claims, token_duration_seconds) {

    let now_time_seconds = Math.floor(new Date().getTime() / 1000);

    let new_token = {};

    //REQUIRED. Issuer Identifier for the Issuer of the response. The iss value is a case sensitive URL using the
    // https scheme that contains scheme, host, and optionally, port number and path components and no query or fragment components.
    new_token.iss = oidc_options.configuration.issuer;

    //REQUIRED. Subject Identifier. A locally unique and never reassigned identifier within the Issuer for the End-User,
    // which is intended to be consumed by the Client, e.g., 24400320 or AItOawmwtWwcT0k51BayewNvutrJUqsvl6qs7A4. It
    // MUST NOT exceed 255 ASCII characters in length. The sub value is a case sensitive string.
    new_token.sub = oidc_claims.subject;

    //REQUIRED. Audience(s) that this ID Token is intended for. It MUST contain the OAuth 2.0 client_id of the Relying
    // Party as an audience value. It MAY also contain identifiers for other audiences. In the general case, the aud
    // value is an array of case sensitive strings. In the common special case when there is one audience, the aud
    // value MAY be a single case sensitive string.
    new_token.aud = oidc_claims.audience;

    //REQUIRED. Expiration time on or after which the ID Token MUST NOT be accepted for processing. The processing of
    // this parameter requires that the current date/time MUST be before the expiration date/time listed in the value.
    // Implementers MAY provide for some small leeway, usually no more than a few minutes, to account for clock skew.
    // Its value is a JSON number representing the number of seconds from 1970-01-01T0:0:0Z as measured in UTC until
    // the date/time. See RFC 3339 [RFC3339] for details regarding date/times in general and UTC in particular.
    new_token.exp = now_time_seconds + token_duration_seconds;

    //REQUIRED. Time at which the JWT was issued. Its value is a JSON number representing the number of seconds from
    // 1970-01-01T0:0:0Z as measured in UTC until the date/time.
    new_token.iat = now_time_seconds;

    //Time when the End-User authentication occurred. Its value is a JSON number representing the number of seconds
    // from 1970-01-01T0:0:0Z as measured in UTC until the date/time. When a max_age request is made or when auth_time
    // is requested as an Essential Claim, then this Claim is REQUIRED; otherwise, its inclusion is OPTIONAL. (
    // The auth_time Claim semantically corresponds to the OpenID 2.0 PAPE [OpenID.PAPE] auth_time response parameter.)
    new_token.auth_time = Math.floor((new Date().getTime() / 1000) - 10);
    if (new_token.auth_time < 0) {
        new_token.auth_time = 0;
    }

    //If the original oidc_claims included a nonce, it must be included in the id_token
    if (oidc_claims.nonce) {
        new_token.nonce = oidc_claims.nonce;
    }

    // sign with RSA SHA256
    let oidc_token = jwt.sign(new_token, private_key, {
        algorithm: "RS256"
    });

    let oidc_token_record = {
        "token_type": "Bearer",
        //TODO: refresh_token
        //"refresh_token": "8xLOxBtZp8",
        "expires_in": token_duration_seconds,
        "id_token": oidc_token
    };

    token_endpoint.token_registrar_module.post_token(oidc_token_record)
        .then((access_token) => {
            return reply({
                "access_token": access_token,
                "token_type": oidc_token_record.token_type,
                //TODO: refresh_token
                //"refresh_token": oidc_token_record.refresh_token,
                "expires_in": oidc_token_record.expires_in,
                "id_token": oidc_token_record.id_token
            }).type("application/json");

        }, (err) => {

            return reply({
                "error": "invalid_request"
            }).type("application/json");

        });

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function __process_token_request(request, reply) {
    let request_params;

    try {
        request_params = __verify_and_get_token_request_params(request);

        if (!request_params.authorization_credentials) {
            /**
             * http authorization Basic is required for all grant_types.
             */
            return reply({
                "error": "access_denied",
                "error_description": "Basic authorization required for all grant_types"
            }).type("application/json").header("WWW-Authenticate", "Basic realm='" + oidc_options.oidc_url_path + "'");
        }

        if (request_params.grant_type === "authorization_code") {
            return __send_token_for_authorization_code(request_params, request, reply);
        } else if (request_params.grant_type === "refresh_token") {
            return __send_token_for_refresh_token(request_params, request, reply);
        } else if (request_params.grant_type === "password") {
            return __send_token_for_password(request_params, request, reply);
        }

    } catch (err) {
        return reply({
            "error": "invlalid_request",
            "error_description": err.message
        }).type("application/json");
    }
}

/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function(server, options, next) {

    oidc_options = options;
    authorization_endpoint = oidc_options.configuration.authorization_endpoint;
    user_info_endpoint = oidc_options.configuration.user_info_endpoint;
    client_endpoint = oidc_options.configuration.client_endpoint;
    token_endpoint = oidc_options.configuration.token_endpoint;

    server.route({
        method: "POST",
        path: oidc_options.oidc_url_path + "/token",
        config: {
            handler: __process_token_request,
            description: "token",
            notes: "OIDC token POST request implementation",
            tags: ["api"],
            plugins: {},
            validate: {
                payload: TOKEN_REQUEST_VALIDATION_SCHEMA,
                headers: Joi.object({
                    "authorization": Joi.string().required().description(AUTH_HEADER_PARAM_AUTHORIZATION)
                }).options({
                    allowUnknown: true
                }),
                options: {
                    stripUnknown: true
                }
            }
        }
    });

    Q.nfcall(
            fs.readFile, oidc_options.configuration.jwk.priv_key_file_name, {
                encoding: "utf8"
            })
        .then(function(private_key_text) {
            private_key = private_key_text;
        })
        .catch(function(err) {
            console.warn(err);
        })
        .finally(() => {
            next();
        });
};

/**
 *
 * @type {{pkg: *}}
 */
module.exports.register.attributes = {
    pkg: require("./package.json")
};
