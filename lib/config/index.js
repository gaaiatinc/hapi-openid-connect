/**
 * Created by aismael on 9/1/2015.
 */
"use strict";


var path = require("path"),
    Q = require("q"),
    appConstants = require("../constants"),
    Joi = require("joi");


var AUTH_PARAM_SCOPE_DESCR = "Requested Authentication Context Class Reference values";


var AUTH_REQUEST_VALIDATION_SCHEMA = {
    //required params
    scope: Joi.string().required().description(AUTH_PARAM_SCOPE_DESCR),
    response_type: Joi.string().required().valid("code").description(AUTH_PARAM_RESPONSE_TYPE_DESCR),
    client_id: Joi.string().required().description(AUTH_PARAM_CLIENT_ID_DESCR),
    redirect_uri: Joi.string().required().uri({scheme: ["https"]}).description(AUTH_PARAM_REDIRECT_URI_DESCR),

    //optional params
    state: Joi.string().description(AUTH_PARAM_STATE_DESCR),
    response_mode: Joi.string().description(AUTH_PARAM_RESPONSE_MODE_DESCR),
    nonce: Joi.string().description(AUTH_PARAM_NONCE_DESCR),
    display: Joi.string().valid(["page", "popup", "touch", "wap"]).default("page").description(AUTH_PARAM_DISPLAY_DESCR),
    prompt: Joi.string().valid(["none", "login", "consent", "select_account"]).default("login").description(AUTH_PARAM_PROMPT_DESCR),
    max_age: Joi.number().positive().description(AUTH_PARAM_MAX_AGE_DESCR),
    ui_locales: Joi.string().description(AUTH_PARAM_UI_LOCALES_DESCR),
    id_token_hint: Joi.string().description(AUTH_PARAM_ID_TOKEN_HINT_DESCR),
    login_hint: Joi.string().description(AUTH_PARAM_LOGIN_HINT_DESCR),
    acr_values: Joi.string().description(AUTH_PARAM_ACR_VALUES_DESCR)
};


/**
 *
 * @param server
 * @param options
 * @param next
 */
module.exports.register = function (server, options, next) {

    //TODO check if all options are valid or use defaults and log status
    console.log(options);

    if (!oidcOptions.configuration
        || (!oidcOptions.configuration.issuer)) {
        return reply().code(404);
    }

    var oidcOptions = options || {};

    var oidcConfiguration = {
        //REQUIRED. URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier.
        //If Issuer discovery is supported (see Section 2), this value MUST be identical to the issuer value returned by WebFinger.
        //This also MUST be identical to the iss Claim value in ID Tokens issued from this Issuer.
        "issuer": oidcOptions.configuration.issuer,

        //REQUIRED. URL of the OP's OAuth 2.0 Authorization Endpoint [OpenID.Core].
        "authorization_endpoint": oidcOptions.configuration.issuer + oidcOptions.oidc_url_root + appConstants.AUTHORIZATION_ENDPOINT,


        //URL of the OP's OAuth 2.0 Token Endpoint [OpenID.Core]. This is REQUIRED unless only the Implicit Flow is used.
        "token_endpoint": "",

        //RECOMMENDED. URL of the OP's UserInfo Endpoint [OpenID.Core]. This URL MUST use the https scheme and MAY
        // contain port, path, and query parameter components.
        "userinfo_endpoint": "",

        //REQUIRED. URL of the OP's JSON Web Key Set [JWK] document. This contains the signing key(s) the RP uses to
        // validate signatures from the OP. The JWK Set MAY also contain the Server's encryption key(s), which are used
        // by RPs to encrypt requests to the Server. When both signing and encryption keys are made available, a use
        // (Key Use) parameter value is REQUIRED for all keys in the referenced JWK Set to indicate each key's intended
        // usage. Although some algorithms allow the same key to be used for both signatures and encryption, doing so
        // is NOT RECOMMENDED, as it is less secure. The JWK x5c parameter MAY be used to provide X.509 representations
        // of keys provided. When used, the bare key values MUST still be present and MUST match those in the certificate.
        "jwks_uri": "",

        //RECOMMENDED. URL of the OP's Dynamic Client Registration Endpoint [OpenID.Registration].
        "registration_endpoint": "",

        //RECOMMENDED. JSON array containing a list of the OAuth 2.0 [RFC6749] scope values that this server supports.
        // The server MUST support the openid scope value. Servers MAY choose not to advertise some supported scope
        // values even when this parameter is used, although those defined in [OpenID.Core] SHOULD be listed, if supported.
        "scopes_supported": "",

        //REQUIRED. JSON array containing a list of the OAuth 2.0 response_type values that this OP supports. Dynamic
        // OpenID Providers MUST support the code, id_token, and the token id_token Response Type values.
        "response_types_supported": "",

        //OPTIONAL. JSON array containing a list of the OAuth 2.0 response_mode values that this OP supports, as
        // specified in OAuth 2.0 Multiple Response Type Encoding Practices [OAuth.Responses]. If omitted, the default
        // for Dynamic OpenID Providers is ["query", "fragment"].
        "response_modes_supported": "",

        //OPTIONAL. JSON array containing a list of the OAuth 2.0 Grant Type values that this OP supports. Dynamic
        // OpenID Providers MUST support the authorization_code and implicit Grant Type values and MAY support other
        // Grant Types. If omitted, the default value is ["authorization_code", "implicit"].
        "grant_types_supported": "",

        //OPTIONAL. JSON array containing a list of the Authentication Context Class References that this OP supports.
        "acr_values_supported": "",

        //REQUIRED. JSON array containing a list of the Subject Identifier types that this OP supports. Valid types
        // include pairwise and public.
        "subject_types_supported": "",

        //REQUIRED. JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for the
        // ID Token to encode the Claims in a JWT [JWT]. The algorithm RS256 MUST be included. The value none MAY be
        // supported, but MUST NOT be used unless the Response Type used returns no ID Token from the Authorization
        // Endpoint (such as when using the Authorization Code Flow).
        "id_token_signing_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWE encryption algorithms (alg values) supported by the OP for
        // the ID Token to encode the Claims in a JWT [JWT].
        "id_token_encryption_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWE encryption algorithms (enc values) supported by the OP for
        // the ID Token to encode the Claims in a JWT [JWT].
        "id_token_encryption_enc_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWS [JWS] signing algorithms (alg values) [JWA] supported by the
        // UserInfo Endpoint to encode the Claims in a JWT [JWT]. The value none MAY be included.
        "userinfo_signing_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWE [JWE] encryption algorithms (alg values) [JWA] supported by
        // the UserInfo Endpoint to encode the Claims in a JWT [JWT].
        "userinfo_encryption_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWE encryption algorithms (enc values) [JWA] supported by the
        // UserInfo Endpoint to encode the Claims in a JWT [JWT].
        "userinfo_encryption_enc_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWS signing algorithms (alg values) supported by the OP for
        // Request Objects, which are described in Section 6.1 of OpenID Connect Core 1.0 [OpenID.Core]. These
        // algorithms are used both when the Request Object is passed by value (using the request parameter) and when
        // it is passed by reference (using the request_uri parameter). Servers SHOULD support none and RS256.
        "request_object_signing_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWE encryption algorithms (alg values) supported by the OP for
        // Request Objects. These algorithms are used both when the Request Object is passed by value and when it is
        // passed by reference.
        "request_object_encryption_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the JWE encryption algorithms (enc values) supported by the OP for
        // Request Objects. These algorithms are used both when the Request Object is passed by value and when it is
        // passed by reference.
        "request_object_encryption_enc_values_supported": "",

        //OPTIONAL. JSON array containing a list of Client Authentication methods supported by this Token Endpoint.
        // The options are client_secret_post, client_secret_basic, client_secret_jwt, and private_key_jwt, as described
        // in Section 9 of OpenID Connect Core 1.0 [OpenID.Core]. Other authentication methods MAY be defined by
        // extensions. If omitted, the default is client_secret_basic -- the HTTP Basic Authentication Scheme specified
        // in Section 2.3.1 of OAuth 2.0 [RFC6749].
        "token_endpoint_auth_methods_supported": "",

        //OPTIONAL. JSON array containing a list of the JWS signing algorithms (alg values) supported by the Token
        // Endpoint for the signature on the JWT [JWT] used to authenticate the Client at the Token Endpoint for the
        // private_key_jwt and client_secret_jwt authentication methods. Servers SHOULD support RS256. The value none
        // MUST NOT be used.
        "token_endpoint_auth_signing_alg_values_supported": "",

        //OPTIONAL. JSON array containing a list of the display parameter values that the OpenID Provider supports.
        // These values are described in Section 3.1.2.1 of OpenID Connect Core 1.0 [OpenID.Core].
        "display_values_supported": "",

        //OPTIONAL. JSON array containing a list of the Claim Types that the OpenID Provider supports. These Claim Types
        // are described in Section 5.6 of OpenID Connect Core 1.0 [OpenID.Core]. Values defined by this specification
        // are normal, aggregated, and distributed. If omitted, the implementation supports only normal Claims.
        "claim_types_supported": "",

        //RECOMMENDED. JSON array containing a list of the Claim Names of the Claims that the OpenID Provider MAY be
        // able to supply values for. Note that for privacy or other reasons, this might not be an exhaustive list.
        "claims_supported": "",

        //OPTIONAL. URL of a page containing human-readable information that developers might want or need to know when
        // using the OpenID Provider. In particular, if the OpenID Provider does not support Dynamic Client Registration,
        // then information on how to register Clients needs to be provided in this documentation.
        "service_documentation": "",

        //OPTIONAL. Languages and scripts supported for values in Claims being returned, represented as a JSON array of
        // BCP47 [RFC5646] language tag values. Not all languages and scripts are necessarily supported for all Claim
        // values.
        "claims_locales_supported": "",

        //OPTIONAL. Languages and scripts supported for the user interface, represented as a JSON array of BCP47
        // [RFC5646] language tag values.
        "ui_locales_supported": "",

        //OPTIONAL. Boolean value specifying whether the OP supports use of the claims parameter, with true indicating
        // support. If omitted, the default value is false.
        "claims_parameter_supported": "",

        //OPTIONAL. Boolean value specifying whether the OP supports use of the request parameter, with true indicating
        // support. If omitted, the default value is false.
        "request_parameter_supported": "",

        //OPTIONAL. Boolean value specifying whether the OP supports use of the request_uri parameter, with true
        // indicating support. If omitted, the default value is true.
        "request_uri_parameter_supported": "",

        //OPTIONAL. Boolean value specifying whether the OP requires any request_uri values used to be pre-registered
        // using the request_uris registration parameter. Pre-registration is REQUIRED when the value is true. If
        // omitted, the default value is false.
        "require_request_uri_registration": "",

        //OPTIONAL. URL that the OpenID Provider provides to the person registering the Client to read about the OP's
        // requirements on how the Relying Party can use the data provided by the OP. The registration process SHOULD
        // display this URL to the person registering the Client if it is given.
        "op_policy_uri": "",

        //OPTIONAL. URL that the OpenID Provider provides to the person registering the Client to read about OpenID
        // Provider's terms of service. The registration process SHOULD display this URL to the person registering the
        // Client if it is given.
        "op_tos_uri": ""
    };


    function __get_oidc_configuration(request, reply) {
        if (oidcOptions.configuration) {
            return reply(
                oidcOptions
            ).type("application/json");
        } else {
            return reply().code(404);
        }
    }


    /**
     *
     */
    server.route({
        method: "GET",
        path: oidcOptions.oidc_url_root + "/.well-known/openid-configuration",
        config: {
            handler: __get_oidc_configuration,
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
    pkg: require('./package.json')
};

