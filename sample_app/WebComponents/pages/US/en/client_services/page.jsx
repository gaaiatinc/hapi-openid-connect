/**
 * @author Ali Ismael <ali@gaaiat.com>
 */
"use strict";

import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";

import RootTemplate from "pages/templates/root_react_template";

/**
 * An example of how to extend the parent template, and replace the elements that the
 * parent template allows for overriding.
 */
export default class AppMainPage extends RootTemplate {
    constructor(props) {
        super(props);
    }


    /**
     * You should never override the render method of the parent template!
     */
    createBody() {

        return (
            <div>
                <h1>Client services demo page</h1>

                <p>This page is intended to demostrate the redirect action upon user authentication and consent.</p>
            </div>
        );
    }
}
