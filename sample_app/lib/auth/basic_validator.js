/**
 *
 */
"use strict";

let db_mgr = require("valde-hapi").database,
    app_config = require("valde-hapi").app_config,
    auth_util = require("./util");

/**
 * This is a demo module.  It does not perform the required verification of
 * the username and password from a persistent store, as it should.
 *
 *
 *
 * validateFunc: (required) a user lookup and password validation function with
 *   the signature function(request, username, password, callback) where:
 *     request - is the hapi request object of the request which is being authenticated.
 *     username - the username received from the client.
 *     password - the password received from the client.
 *     callback - a callback function with the signature
 *       function(err, isValid, credentials) where:
 *         err - an internal error. If defined will replace default Boom.unauthorized error
 *         isValid - true if both the username was found and the password matched, otherwise false.
 *         credentials - a credentials object passed back to the application in
 *           request.auth.credentials. Typically, credentials are only included
 *           when isValid is true, but there are cases when the application needs
 *           to know who tried to authenticate even when it fails (e.g. with authentication mode 'try').
 */
module.exports = function(request, username, password, callback) {
    let request_credentials = {
        "username": username,
        "password": password
    };
console.log("\n\n>>>>>> basic auth:", request_credentials);

    db_mgr.find(
            "user_account", request_credentials, {
                limit: 1
            })
        .then((user_accounts) => {
            if (user_accounts.length > 0) {
                if (auth_util.encrypt_password(password) === user_accounts[0].password) {
                    return callback(null, true, request_credentials);
                } else {
                    return callback(null, false);
                }
            } else {
                return callback(null, false);
            }
        }, (err) => {
            return callback(null, false);
        });

};
