/**
 * Created by Ali on 11/10/2015.
 */
"use strict";

let platform = require("valde-hapi");
let appConfig = platform.app_config.getConfig();

let loggerFactory = platform.app_logger;

let logger = loggerFactory.getLogger("SampleApp", (appConfig.get("env:production")) ? "WARN" : "DEBUG");

platform.init(function (err, server) {
    server.start(function () {
        logger.info("Server running at:", server.info.uri);
    });
});
