/**
 * Created by Ali on 3/13/2015.
 */

"use strict";
let appConfig = require("valde-hapi").app_config.getConfig();

let loggerFactory = require("valde-hapi").app_logger;

let logger = loggerFactory.getLogger("ViewEngine", (appConfig.get("env:production")) ? "WARN" : "DEBUG");

/**
 *
 * @param server
 */
function regiterRoutes(server) {

    server.route(require("./handlers/web_page"));
    server.route(require("./handlers/static_resources"));
}

module.exports = regiterRoutes;
