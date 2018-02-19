/**
 *
 *
 *
 */
"use strict";

let crypto = require("crypto");
let moment = require("moment");
let auth_util = require("../auth/util");
let dbMgr = require("../database");
let app_config = require("valde-hapi").app_config;

/**
 * This is a demo implementaion of the process_signin_request() function
 * that is required for the hapi-openid-connect plugin.  The implementaion must
 * perform the following:
 *
 *
 * 1- verify that the username (email) and password match a user account record
 * 2- if the user account is found, set the session cookie for the request if
 *     not already set.
 * 3- return a Promise that must resolve with the user account ID (string)
 *
 * The user profile must have a unique attirbute named _id, that has a toString()
 *    method, and it must be less than 255 characters (as per OpenID specs).
 *
 *
 * @param  {[type]} username [description]
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
function process_signin_request(request, h) {
    return new Promise((resolve, reject) => {
        dbMgr
            .findOne(app_config.get("app:db_collections:user_account"), {
                "username": request.payload.username,
                "password": auth_util.encrypt_password(request.payload.password)
            })
            .then((account) => {
                /**
             * In this demo implementaion, the sessin cookie is set up without
             * encryption!!!
             *
             * A production implementaion must set the session state to
             * reflect signed in state.
             *
             */

                if (account) {
                    var expire_on = moment().add(6, "months");
                    var session = {
                        username: request.payload.username,
                        expire_on: expire_on.format()
                    };
                    request
                        .cookieAuth
                        .set(session);

                    return resolve(account._id.toString());
                } else {
                    return reject(new Error("Account not found."));
                }
            }, (err) => {
                reject(err);
            });
    });
}

/**
 * This is a demo implementaion of the process_signin_request() function
 * that is required for the hapi-openid-connect plugin.  The implementaion must
 * perform the following:
 *
 *
 * 1- verify that the username (email) and password match a user account record
 * 2- return a Promise that must resolve with the user account ID (string)
 *
 * The user profile must have a unique attirbute named _id, that has a toString()
 *    method, and it must be less than 255 characters (as per OpenID specs).
 *
 *
 * @param  {[type]} username [description]
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
function get_user_account_id_for_credentials(username, password) {

    return new Promise((resolve, reject) => {

        dbMgr
            .find(app_config.get("app:db_collections:user_account"), {
                "username": username,
                "password": auth_util.encrypt_password(password)
            }, {"limit": 1})
            .then((accounts) => {
                if (accounts.length > 0) {
                    return resolve(accounts[0]._id.toString());
                } else {
                    return reject(new Error("Account not found."));
                }
            }, reject);
    });
}

/**
 * This function must return a promise which resolves with the given user_account
 * persisted in the store.
 *
 * @param  {[type]} user_account [description]
 * @return {[type]}              [description]
 */
function post_user_account(user_account) {
    return Promise.resolve({status: "successful", status_code: 200});
}

/**
 * This function must return a Promise which resolves upon successful update of
 * matching user_account in the persistent store.
 *
 * @param  {[type]} user_account [description]
 * @return {[type]}              [description]
 */
function put_user_account(user_account) {
    return Promise.resolve({status: "successful", status_code: 200});
}

/**
 * This function must return a Promise which resolves with the user_account
 * identifed by the given username.
 *
 * @param  {[type]} username [description]
 * @return {[type]}                 [description]
 */
function get_user_account(username) {
    return Promise.resolve({_id: "1235asddgf34545", username: "tester@sampleapp.com", password: "dfxTK8Gf8LbreZtBDeRrElMAQz9pzinouAp2pr2g8uE=", region: "en-US"});
}

/**
 * This function must return a Prmoise which resolves upon successful delteion
 * of the user_account in the persistent store (identifed by the given username)
 *
 * @param  {[type]} username [description]
 * @return {[type]}                 [description]
 */
function delete_user_account(username) {
    return Promise.resolve({status: "successful", status_code: 200});
}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} h   [description]
 * @return {[type]}         [description]
 */
function change_password(request, h) {
    return Promise.resolve({status: "successful", status_code: 501});
}

/**
 *
 * @param {[type]} request [description]
 * @param {[type]} h   [description]
 * @return {[type]}         [description]
 */
function request_password_reset(request, h) {
    return Promise.resolve({status: "successful", status_code: 501});
}

/**
 *
 * @param {[type]} request [description]
 * @param {[type]} h   [description]
 * @return {[type]}         [description]
 */
function perform_password_reset(request, h) {
    return Promise.resolve({status: "successful", status_code: 501});

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} h   [description]
 * @return {[type]}         [description]
 */
function activate(request, h) {
    return Promise.resolve({status: "successful", status_code: 501});

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} h   [description]
 * @return {[type]}         [description]
 */
function resend_activation_code(request, h) {
    return Promise.resolve({status: "successful", status_code: 501});

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} h   [description]
 * @return {[type]}         [description]
 */
function remove_account(request, h) {
    return Promise.resolve({status: "successful", status_code: 501});

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} h   [description]
 * @return {[type]}         [description]
 */
function signup(request, h) {

    if (request.payload.password !== request.payload.password_confirmation) {
        return h
            .response({status: "error", status_message: "passwords are not identical"})
            .type("application/json")
            .code(400);
    }

    let new_account = {
        $set: {
            username: request.payload.username,
            password: auth_util.encrypt_password(request.payload.password),
            first_name: request.payload.first_name || "",
            locale: request.payload.locale || "",
            last_name: request.payload.last_name || "",
            accept_terms: request.payload.accept_terms || false
        }
    };

    dbMgr
        .updateOne(app_config.get("app:db_collections:user_account"), {
            username: {
                $eq: null
            }
        }, new_account, {upsert: true})
        .then((result) => {
            //TODO: send email for activation
            //
            return h
                .response({status: "success", status_message: "account created"})
                .type("application/json")
                .code(200);
        }, (err) => {
            return h
                .response({status: "error", status_message: err.message})
                .type("application/json")
                .code(400);
        });

}

/**
 *
 * @type {Object}
 */
module.exports = {
    get_user_account_id_for_credentials,
    process_signin_request,
    encrypt_password: auth_util.encrypt_password,
    post_user_account,
    put_user_account,
    get_user_account,
    delete_user_account,
    change_password,
    request_password_reset,
    perform_password_reset,
    activate,
    resend_activation_code,
    remove_account,
    signup
};
