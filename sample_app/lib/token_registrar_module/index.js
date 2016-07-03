/**
 * @author Ali Ismael
 *
 * This is an example module implementing the methods required for the
 * hapi-openid-connect plugin to store and retrieve tokens temporarily.
 *
 * The hapi-openid-connect plugin require this module to export four functions,
 *   which must return promises:
 *
 * 1- put_token( oidc_token) which must update the
 *   oidc_token object in the psersistence store.
 *
 * 2- get_token(oidc_token_id) which must retrieve the
 *   oidc_token associated with the oidc_token_id argument
 *   from the persistence sotre.  The oidc_token_id is also used as the
 *   access_token.
 *
 * 3- post_token( oidc_token) which must persist the
 *   oidc_token object, and return an id for it.
 *
 * 4- delete_token( oidc_token_id) which must
 *    delete the oidc_token request from the persistence store
 *
 * This demo example uses mongoDB for the underlying persistence and relies on
 * mongodb "expire_after" indexes to automatically remove the expired
 * oidc_tokens from the database.
 */

"use strict";

let Q = require("q");

let dbMgr = require("valde-hapi").database;

/**
 * This function must return a promise, which persists the oidc_token
 * object, and resolve with the ID for the persisted oidc_token.  The
 * ID can be used later to retrieve the persisted oidc_token.
 *
 * @param   oidc_token
 * @return oidc_token_id
 */
function post_token(oidc_token) {
    return Q.Promise((resolve, reject) => {
        dbMgr.updateOne(
                "oidc_token", {
                    id_token: {
                        $eq: null
                    }
                }, {
                    $currentDate: {
                        expire_on: true
                    },
                    $set: oidc_token
                }, {
                    upsert: true
                })
            .then(
                (result) => {
                    if (result.upsertedCount === 1) {
                        return resolve(result.upsertedId._id);
                    } else {
                        return reject(new Error("No oidc_token recoreds inserted"));
                    }
                }, (err) => {
                    reject(err);
                });
    });
}

/**
 * This function return a Promse which resolves after updating a token record
 * in the persistent stor. (rejects on errors )
 *
 * @param  {[type]} oidc_token [description]
 * @return {[type]}                       [description]
 */
function put_token(oidc_token) {
    return Q.Promise((resolve, reject) => {
        dbMgr.updateOne(
                "oidc_token", {
                    _id: {
                        $eq: oidc_token._id
                    }
                }, {
                    $currentDate: {
                        expire_on: true
                    },
                    $set: oidc_token
                }, {
                    upsert: true
                })
            .then(
                (result) => {
                    if (result.modifiedCount === 1) {
                        return resolve(oidc_token._id);
                    } else {
                        return reject(new Error("No oidc_token recoreds inserted"));
                    }
                }, (err) => {
                    reject(err);
                });
    });
}

/**
 * This function must return a promise, which resolves with the
 * oidc_token associated with the oidc_token_id argument.
 *
 * Also, the implementation must check for the time the respective
 * oidc_token was granted, and reject the promise if the persisted
 * and/or granted authorizeRequest is older than some configurable duration.
 *
 * @param  oidc_token_id: the oidc_token_code is used as the id
 *     in this implementation.
 * @return {[object]}
 */
function get_token(oidc_token_id) {
    return dbMgr.find("oidc_token", {
        _id: {
            $eq: oidc_token_id
        }
    }, {
        limit: 1
    });
}

/**
 * This function is used by the OIDC plugin to delete granted oidc_token
 * requests after being consumed for tokens
 *
 * @param  {[type]} oidc_token_id [description]
 * @return {[type]}                        [description]
 */
function delete_token(oidc_token_id) {
    return dbMgr.deleteOne("oidc_token", {
        _id: oidc_token_id
    }, {});
}

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
    post_token,
    put_token,
    get_token,
    delete_token
};
