/**
 * Created by Ali on 3/13/2015.
 */

"use strict";

let path = require("path"),
    dbMgr = require("../../database"),
    ObjectId = require("mongodb").ObjectID,
    _set = require("lodash/set"),
    _get = require("lodash/get"),
    app_config = require("valde-hapi").app_config;

async function handler(request, h) {
    if (request.auth.isAuthenticated) {
        try {
            let accounts = await dbMgr.find(app_config.get("app:db_collections:user_account"), {"username": request.auth.credentials.username});
            if (accounts && accounts.length > 0) {
                _set(request, "plugins.valde_web_model.account_data", accounts[0]);
            }
        } catch (err) {
            //error case!!!   Request is authenticated with no account username in auth!!!
        }
    }

    return h.view(_get(request, "plugins.valde_web_model.pageViewTemplate"), _get(request, "plugins.valde_web_model"));
}

module.exports = {
    method: "GET",
    path: app_config.get("app_root") + "/{pageID*}",
    config: {
        handler: handler,
        auth: {
            mode: "try",
            strategy: "session"
        },
        plugins: {
            "hapi-auth-cookie": {
                redirectTo: false
            },
            "resource_set": {
                enabled: true
            },
            "web_model": {
                enabled: true
            }
        }
    }
};
