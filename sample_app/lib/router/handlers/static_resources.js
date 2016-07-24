/**
 * Created by Ali on 3/13/2015.
 */

"use strict";

let path = require ("path");
let app_config = require("valde-hapi").app_config;

module.exports = {
    method: "GET",
    path: app_config.get("app_root") + "/res/{resID*}",
    handler: {
        directory: {
            path: "public",
            etagMethod: "hash"
        }
    }
};
