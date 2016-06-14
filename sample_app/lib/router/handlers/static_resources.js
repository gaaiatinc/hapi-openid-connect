/**
 * Created by Ali on 3/13/2015.
 */

"use strict";

let path = require ("path");
let appConfig = require("valde-hapi").app_config.getConfig();

module.exports = {
    method: "GET",
    path: appConfig.get("app_root") + "/res/{resID*}",
    handler: {
        directory: {
            path: "public",
            etagMethod: "hash"
        }
    }
};
