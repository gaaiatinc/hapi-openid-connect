/**
 * @author aismael
 */
"use strict";


function getBasicAuthCredentials(request) {

    if (!request.headers["authorization"]) {
        throw new Error("Authorization header is missing!");
    }

    let authHeaderParts = request.headers["authorization"].split(/\s+/);
    if (Array.isArray(authHeaderParts) &&
        (authHeaderParts[0].trim().toUpperCase() === "BASIC")
    ) {
        let authCredentials = authHeaderParts[1].split(/:/);
        return {
            userId: authCredentials[0].trim(),
            password: authCredentials[1].trim()
        };
    }


    throw new Error("Authorization header is incorrect!");


}

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
    getBasicAuthCredentials
};
