/**
 *
 *
 *
 */
let Q = require("q");
let crypto = require("crypto");
let moment = require("moment");

/**
 * This is a demo implementaion of the get_user_profile_for_signin() function
 * that is required for the hapi-openid-connect plugin.  The implementaion must
 * perform the following:
 *
 * 1- verify that the user_id (email) and password match a user account record
 * 2- if the user account is found, set the session cookie for the request if
 *     not already set.
 * 3- return a Promise that must resolve with the user profile
 *
 *
 * @param  {[type]} user_id      [description]
 * @param  {[type]} access_token [description]
 * @return {[type]}              [description]
 */
function get_user_profile_for_signin(request) {

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

    return Q({
        user_id: "tester@sampleapp.com",
        user_password: "pwd",
        region: "en-US"
    });
}

/**
 *
 * @param  {[type]} user_id [description]
 * @return {[type]}         [description]
 */
function update_user_profile_for_signout(request) {
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
function change_password(request) {
    return Q({
        status: "successful",
        status_code: 501
    });
}

/**
 *
 * @param {[type]} request [description]
 * @param {[type]} reply   [description]
 */
function request_password_reset(request) {
    return Q({
        status: "successful",
        status_code: 501
    });
}

/**
 *
 * @param {[type]} request [description]
 * @param {[type]} reply   [description]
 */
function perform_password_reset(request) {
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
function activate(request) {
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
function resend_activation_code(request) {
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
function remove_account(request) {
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
function signup(request) {
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
    get_user_profile_for_signin,
    update_user_profile_for_signout,
    change_password,
    request_password_reset,
    perform_password_reset,
    activate,
    resend_activation_code,
    remove_account,
    signup
};
