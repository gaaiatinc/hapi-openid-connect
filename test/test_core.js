/**
 * Created by aismael on 8/26/2015.
 */
"use strict";

var path = require("path"),
    Q = require("q"),
    fs = require("fs"),
    jwt = require("jsonwebtoken"),
    Joi = require("joi");


// verify a token asymmetric
var pubCert = fs.readFileSync("../config/oidc/shiploop-pub.pem", {encoding: "utf8"});  // get public key
var privCert = fs.readFileSync("../config/oidc/shiploop-key.pem", {encoding: "utf8"});  // get private key
//var pubCert = fs.readFileSync("../config/oidc/sloidc-pub.pem", {encoding: "utf8"});  // get public key
//var privCert = fs.readFileSync("../config/oidc/sloidc-key.pem", {encoding: "utf8"});  // get private key

//console.log(">>>>>>> cert", pubCert);

//console.log(">>>>>>> key", privCert);


function getToken() {
    var retVal = {};

//REQUIRED. Issuer Identifier for the Issuer of the response. The iss value is a case sensitive URL using the
// https scheme that contains scheme, host, and optionally, port number and path components and no query or fragment components.
    retVal.iss = "https://www.shiploop.com/oidc";

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
    retVal.exp = new Date().getTime();

//REQUIRED. Time at which the JWT was issued. Its value is a JSON number representing the number of seconds from
// 1970-01-01T0:0:0Z as measured in UTC until the date/time.
    retVal.iat = Math.floor(new Date().getTime() / 1000);

//Time when the End-User authentication occurred. Its value is a JSON number representing the number of seconds
// from 1970-01-01T0:0:0Z as measured in UTC until the date/time. When a max_age request is made or when auth_time
// is requested as an Essential Claim, then this Claim is REQUIRED; otherwise, its inclusion is OPTIONAL. (
// The auth_time Claim semantically corresponds to the OpenID 2.0 PAPE [OpenID.PAPE] auth_time response parameter.)
    retVal.auth_time = Math.floor(new Date().getTime() / 1000 - 10);
    if (retVal.auth_time < 0) {
        retVal.auth_time = 0;
    }

    console.log("original token:", retVal);

// sign with RSA SHA256
    //"HS256", "HS384", "HS512", "RS256", "RS384", "RS512" and "none"
    var token = jwt.sign(retVal, privCert, {algorithm: "RS256"});

    var decoded = jwt.decode(token, {complete: true});
    console.log(decoded.header);
    console.log(decoded.payload);

    return token;
}


var WebIdentityToken = getToken();

console.log("new token:", WebIdentityToken);


var jwkUtils = require("../lib/jwt_utils");

var keyAttr = {
    alg: "RS256",
    use: "sig",
    kid: "962c657425a4a7aa4daa3ab4ce6545fa8c4e01bf"
};

var jwk = jwkUtils(privCert, keyAttr, "public");
console.log(jwk);


jwt.verify(WebIdentityToken, pubCert, function (err, decoded) {
    if (err) {
        console.log(err.stack);
    }

    console.log(">>>> ", decoded);
});
