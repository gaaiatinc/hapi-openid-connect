/**
 *
 */
"use strict";

let app_config = require("valde-hapi").app_config;
let crypto = require("crypto");


/**
 *
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
function encrypt_password(password) {
    const access_key = app_config.get("vault_keeper:access_key");
    const hmac_key = app_config.get("vault_keeper:hmac_key");
    const cipher = crypto.createCipher("aes256", access_key);

    let encrypted_password = cipher.update(password, "utf8", "base64");
    encrypted_password += cipher.final("base64");
    const hmac = crypto.createHmac("sha256", hmac_key);

    hmac.update(encrypted_password);

    encrypted_password = hmac.digest("base64");

    console.log("\n\n encrypted_password for: ", password, " is:", encrypted_password);

    return encrypted_password;
}

/**
 *
 * @type {Object}
 */
module.exports = {
    encrypt_password
};
