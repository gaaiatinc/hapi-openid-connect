"use strict";

let platform = require("valde-hapi");
let path = require("path");

let app_config;

// let loggerFactory = platform.app_logger;
//
// let logger = loggerFactory.getLogger("SampleApp", (app_config.get("env:production")) ? "WARN" : "DEBUG");

describe("temp tests", function() {

    before(() => {
        // runs before all tests in this block
        //
        platform.init("./");
        console.log(path.resolve("./"));
        app_config = platform.app_config;
        return;
    });

    after(function() {
        // runs after all tests in this block
    });

    beforeEach(function() {
        // runs before each test in this block
    });

    afterEach(function() {
        // runs after each test in this block
    });

    // test cases

    describe("#find()", () => {
        it("respond with matching records", function() {
            let auth_utils = require("../lib/auth/util");

            let enc_pwd = auth_utils.encrypt_password("some password" + Math.random(100));

            console.log("done it in:", app_config.get("application_root_folder"), Math.random(100));

            console.log("done it!", app_config.get("vault_keeper"));
        });
    });

});
