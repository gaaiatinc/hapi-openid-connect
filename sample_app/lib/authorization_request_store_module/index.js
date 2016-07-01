/**
 * @author Ali Ismael
 *
 * This is an example module implementing the methods required for the
 * hapi-openid-connect plugin to store and retrieve authorization requests in
 * between redirections and consumption.
 *
 * The hapi-openid-connect plugin require this module to export two functions,
 *   which must return promises:
 *
 * 1- put_authorization_request( authorization_request) which must persist the
 *   authorization_request object, and return an id for it.
 *
 * 2- get_authorization_request(authorization_request_id) which must retrieve the
 *   authorization_request associated with the authorization_request_id argument
 *   from the persistence sotre.
 *
 * This example uses mongoDB for the underlying persistence
 */

"use strict";

let Q = require("q");

let dbMgr = require("valde-hapi").database;

/**
 * This function must return a promise, which persists the authorization_request
 * object, and resolve with the ID for the persisted authorization_request.  The
 * ID can be used later to retrieve the persisted authorization_request.
 *
 * @param   authorization_request
 * @return authorization_request_id
 */
function post_authorization_request(authorization_request) {
    return Q.Promise((resolve, reject) => {
        dbMgr.updateOne(
                "authorization_request", {
                    original_authorization_request: {
                        $eq: null
                    }
                }, {
                    $set: {
                        original_authorization_request: authorization_request
                    }
                }, {
                    upsert: true
                })
            .then(
                (result) => {
                    if (result.upsertedCount === 1) {
                        return resolve(result.upsertedId._id);
                    } else {
                        return reject(new Error("No authorization recoreds inserted"));
                    }
                }, (err) => {
                    reject(err);
                });
    });
}

/**
 * [put_authorization_request description]
 * @param  {[type]} authorization_request [description]
 * @return {[type]}                       [description]
 */
function put_authorization_request(authorization_request) {

    let update_spec = {
        original_authorization_request: authorization_request.original_authorization_request
    };
    if (authorization_request.original_authorization_request.granted) {
        update_spec.expire_on = new Date();
    }
    return Q.Promise((resolve, reject) => {
        dbMgr.updateOne(
                "authorization_request", {
                    _id: {
                        $eq: authorization_request._id
                    }
                }, {
                    $set: update_spec
                }, {
                    upsert: true
                })
            .then(
                (result) => {
                    if (result.modifiedCount === 1) {
                        return resolve(authorization_request._id);
                    } else {
                        return reject(new Error("No authorization recoreds inserted"));
                    }
                }, (err) => {
                    reject(err);
                });
    });
}

/**
 * This function must return a promise, which resolves with the
 * authorization_request associated with the authorization_request_id argument.
 *
 * Also, the implementation must check for the time the respective
 * authorization_request was granted, and reject the promise if the persisted
 * and/or granted authorizeRequest is older than some configurable duration.
 *
 * @param  authorization_request_id
 * @return {[object]}
 */
function get_authorization_request(authorization_request_id) {
    return dbMgr.find("authorization_request", {
        _id: {
            $eq: authorization_request_id
        }
    }, {
        limit: 1
    });
}

/**
 * This function is used by the OIDC plugin to delete granted authorization
 * requests after being consumed for tokens
 *
 * @param  {[type]} authorization_request_id [description]
 * @return {[type]}                        [description]
 */
function delete_authorization_request(authorization_request_id) {
    return dbMgr.deleteOne("authorization_request", {
        _id: authorization_request_id
    }, {});
}

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
    post_authorization_request,
    put_authorization_request,
    get_authorization_request,
    delete_authorization_request
};
