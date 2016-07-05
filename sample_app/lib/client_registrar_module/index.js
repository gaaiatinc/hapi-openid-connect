/**
 * Example client registrar module required for the hapi-openid-connect plugin
 *
 * This module must export a function named get_client_registration() which
 * returns a promise resolving with a client registration object from a
 * persistence store. The get_client_registration() function takes the same
 * client ID (OIDC client_id) used to identify the client in the authorization
 * request.
 *
 * The client registration must include as a minium the host name, and port
 * for the client redirect uri.
 *
 */
"use strict";

let Q = require("q");

/**
 * This method must retrun a Promise which resolves to the client registration
 * entry from a persistent store.  The client registration entry must have attributes
 * identical to the ones in this demo implementation (redirect_uri_hostname,
 * redirect_uri_port, redirect_uri_path, and description).
 *
 * This is a demo implementaiton of the function implementing client registry
 * lookup.  It has a hard-coded entry for the sample app running on:
 *     https://localhost:8443
 * with client_id: 123456
 *
 * For demo purposes, the http basic auth header is:
 *    authorization: Basic MTIzNDU2OmNsaWVudF9wd2Q=
 *    
 * @param  {[type]} client_id
 * @return {[type]}
 */
function get_client_registration(client_id) {

    return Q.Promise((resolve, reject) => {
        if (client_id === "123456") {
            return resolve({
                redirect_uri_hostname: "localhost.sampleapp.com",
                redirect_uri_port: "8443",
                redirect_uri_path: "/sample_app/client_services",
                description: "sample app",
                client_id: client_id,
                client_password: "client_pwd"

            });
        } else {
            return reject(new Error("client ID not registered!"));
        }
    });
}

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
    get_client_registration
};
