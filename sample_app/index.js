/**
 * Created by Ali on 3/10/2015.
 */
"use strict";

let platform = require("valde-hapi");
let path = require("path");
let dbMgr = require("./lib/database");

platform.init(path.dirname(require.main.filename));

const pilot = async () => {
    try {
        let app_config = platform.app_config;
        const db_logger = platform.app_logger.getLogger(
            "DatabaseLogger", app_config.get("env:production")
            ? "WARN"
            : "DEBUG");
        await dbMgr.init(app_config, db_logger);

        const server = await platform.launch();

        let loggerFactory = platform.app_logger;

        let logger = loggerFactory.getLogger(
            "SampleApp", (app_config.get("env:production"))
            ? "WARN"
            : "DEBUG");

        logger.info(`Server running at: ${server.info.uri}`);
    } catch (err) {
        console.log(err);
    }
};

pilot();
