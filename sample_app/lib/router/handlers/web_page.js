/**
 * Created by Ali on 3/13/2015.
 */

"use strict";

let path = require("path"),
    db_mgr = require("valde-hapi").database,
    ObjectId = require("mongodb").ObjectID,
    app_config = require("valde-hapi").app_config;

function handler(request, reply) {

    if (!(request.__valde.web_model)) {
        request.__valde.web_model = {};
    }

    if (request.auth.isAuthenticated) {
        //add the user account data to the model

        db_mgr.find(
                app_config.get("app:db_collections:user_account"), {
                    "username": request.auth.credentials.username
                })
            .then(
                (accounts) => {
                    if (accounts.length > 0) {
                        request.__valde.web_model.account_data = accounts[0];
                    }
                },
                (err) => {})
            .catch(function(err) {})
            .finally(function() {
                reply.view(request.__valde.web_model.pageViewTemplate, request.__valde.web_model);
            });
    } else {
        reply.view(request.__valde.web_model.pageViewTemplate, request.__valde.web_model);
    }
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
