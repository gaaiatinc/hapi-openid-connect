/**
 *
 *
 *
 */
let Q = require("q");
let crypto = require("crypto");
let moment = require("moment");

/**
 * This is a demo implementaion of the get_user_account_for_signin() function
 * that is required for the hapi-openid-connect plugin.  The implementaion must
 * perform the following:
 *
 *
 * 1- verify that the user_id (email) and password match a user account record
 * 2- if the user account is found, set the session cookie for the request if
 *     not already set.
 * 3- return a Promise that must resolve with the user profile
 *
 * The user profile must have a unique attirbute named _id, that has a toString()
 *    method, and it must be less than 255 characters (as per OpenID specs).
 *
 * @param  {[type]} request      [description]
 * @return {[type]}              [description]
 */
function get_user_account_for_signin(request) {

    if (!request.auth.isAuthenticated) {
        var shasum = crypto.createHash("sha1");
        shasum.update(String(request.payload.user_id));
        shasum.update(String(request.headers["accept-language"]));
        shasum.update(String(request.headers["user-agent"]));
        var device_fingerprint = "29af01" + shasum.digest("hex").substr(5);

        var expire_on = moment().add(6, "months");
        var session = {
            device_fingerprint: device_fingerprint,
            user_id: request.payload.user_id,
            expire_on: expire_on.format()
        };
        request.cookieAuth.set(session);
    }

    /**
     * for the demo sample_app, this module has one hard-coded end_user account,
     * with  user_id: "tester@sampleapp.com", and
     *       user_password: "pwd"
     *
     * These credentials map to the following basic authorization header:
     *    authorization: BASIC dGVzdGVyQHNhbXBsZWFwcC5jb206cHdk
     *
     */
    return Q({
        _id: "1235asddgf34545",
        user_id: "tester@sampleapp.com",
        user_password: "pwd",
        region: "en-US"
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
    return Q({
        status: "successful",
        status_code: 200
    });
}

/**
 * This function must return a Promise which resolves upon successful update of
 * matching user_account in the persistent store.
 *
 * @param  {[type]} user_account [description]
 * @return {[type]}              [description]
 */
function put_user_account(user_account) {
    return Q({
        status: "successful",
        status_code: 200
    });
}

/**
 * This function must return a Promise which resolves with the user_account
 * identifed by the given user_id.
 *
 * @param  {[type]} user_id [description]
 * @return {[type]}                 [description]
 */
function get_user_account(user_id) {
    return Q({
        _id: "1235asddgf34545",
        user_id: "tester@sampleapp.com",
        user_password: "pwd",
        region: "en-US"
    });
}

/**
 * This function must return a Prmoise which resolves upon successful delteion
 * of the user_account in the persistent store (identifed by the given user_id)
 *
 * @param  {[type]} user_id [description]
 * @return {[type]}                 [description]
 */
function delete_user_account(user_id) {
    return Q({
        status: "successful",
        status_code: 200
    });
}

/**
 * This is a demo omplementation which does not implement all the typical
 * tasks involved in marking a user profile on a device as signed out.
 *
 * @param  {[type]} request [description]
 * @return {[type]}         [description]
 */
function update_user_account_for_signout(user_id) {
    return Q({
        status: "successful",
        status_code: 200
    });
}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function change_password(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });
}

/**
 *
 * @param {[type]} request [description]
 * @param {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function request_password_reset(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });
}

/**
 *
 * @param {[type]} request [description]
 * @param {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function perform_password_reset(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function activate(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function resend_activation_code(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function remove_account(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });

}

/**
 *
 * @param  {[type]} request [description]
 * @param  {[type]} reply   [description]
 * @return {[type]}         [description]
 */
function signup(request, reply) {
    return Q({
        status: "successful",
        status_code: 501
    });

}

/**
 *
 * @type {Object}
 */
module.exports = {
    get_user_account_for_signin,
    update_user_account_for_signout,
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
