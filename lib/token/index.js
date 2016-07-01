/**
 * Created by aismael on 9/1/2015.
 */
"use strict";

let path = require("path"),
    Q = require("q"),
    fs = require("fs"),
    jwt = require("jsonwebtoken"),
    Joi = require("joi");

let AUTH_HEADER_PARAM_AUTHORIZATION = "Http header Authorization, must be of type 'Basic', containing the client credentials";

let TOKEN_REQUEST_VALIDATION_SCHEMA = {
    grant_type: Joi.string().required().valid("authorization_code").description("Only 'authorization_code' is supported"),
    code: Joi.string().required().description("The authorization code issued via the Authorization Request endpoint"),
    redirect_uri: Joi.string().required().uri({
        scheme: ["https"]
    }).description("The same redirect_uri registered for the client, and must be identical to the redirect_uri parameter value that was included in the initial Authorization Request")
};

let oidc_options;
let privCert;




function __verifyTokenRequestParams(request, reply) {

}

/**
 *
 * @param request
 * @param reply
 * @returns {*}
 * @private
 */
function __sendIDToken(request, reply) {

    let retVal = {};

    //REQUIRED. Issuer Identifier for the Issuer of the response. The iss value is a case sensitive URL using the
    // https scheme that contains scheme, host, and optionally, port number and path components and no query or fragment components.
    retVal.iss = oidc_options.configuration.issuer;

    //REQUIRED. Subject Identifier. A locally unique and never reassigned identifier within the Issuer for the End-User,
    // which is intended to be consumed by the Client, e.g., 24400320 or AItOawmwtWwcT0k51BayewNvutrJUqsvl6qs7A4. It
    // MUST NOT exceed 255 ASCII characters in length. The sub value is a case sensitive string.

    retVal.sub = "1342513241234";

    //REQUIRED. Audience(s) that this ID Token is intended for. It MUST contain the OAuth 2.0 client_id of the Relying
    // Party as an audience value. It MAY also contain identifiers for other audiences. In the general case, the aud
    // value is an array of case sensitive strings. In the common special case when there is one audience, the aud
    // value MAY be a single case sensitive string.
    retVal.aud = ["11111999999999"];

    //REQUIRED. Expiration time on or after which the ID Token MUST NOT be accepted for processing. The processing of
    // this parameter requires that the current date/time MUST be before the expiration date/time listed in the value.
    // Implementers MAY provide for some small leeway, usually no more than a few minutes, to account for clock skew.
    // Its value is a JSON number representing the number of seconds from 1970-01-01T0:0:0Z as measured in UTC until
    // the date/time. See RFC 3339 [RFC3339] for details regarding date/times in general and UTC in particular.
    retVal.exp = Math.floor(new Date().getTime() / 1000) + 3600;

    //REQUIRED. Time at which the JWT was issued. Its value is a JSON number representing the number of seconds from
    // 1970-01-01T0:0:0Z as measured in UTC until the date/time.
    retVal.iat = Math.floor(new Date().getTime() / 1000);

    //Time when the End-User authentication occurred. Its value is a JSON number representing the number of seconds
    // from 1970-01-01T0:0:0Z as measured in UTC until the date/time. When a max_age request is made or when auth_time
    // is requested as an Essential Claim, then this Claim is REQUIRED; otherwise, its inclusion is OPTIONAL. (
    // The auth_time Claim semantically corresponds to the OpenID 2.0 PAPE [OpenID.PAPE] auth_time response parameter.)
    retVal.auth_time = Math.floor((new Date().getTime() / 1000) - 10);
    if (retVal.auth_time < 0) {
        retVal.auth_time = 0;
    }

    // sign with RSA SHA256
    let token = jwt.sign(retVal, privCert, {
        algorithm: "RS256"
    });

    //// verify a token asymmetric
    //let pubCert = fs.readFileSync(oidc_options.configuration.jwk.pub_key_file_name, {encoding: "utf8"});  // get public key
    //jwt.verify(token, pubCert, function (err, decoded) {
    //    console.log(">>>> ", decoded);
    //});

    return reply({
        "access_token": "SlAV32hkKG",
        "token_type": "Bearer",
        //"refresh_token": "8xLOxBtZp8",
        "expires_in": 3600,
        "id_token": token
    }).type("application/json");
}

/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function (server, options, next) {

    oidc_options = options;

    server.route({
        method: "POST",
        path: oidc_options.oidc_url_root + "/token",
        config: {
            handler: __sendIDToken,
            description: "token",
            notes: "OIDC token POST request implementation",
            tags: ["api"],
            auth: "session",
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
        .then(function (certChainText) {
            privCert = certChainText;
        })
        .catch(function (err) {
            console.warn(err);
        })
        .done(next);

    next();
};

/**
 *
 * @type {{pkg: *}}
 */
module.exports.register.attributes = {
    pkg: require("./package.json")
};
