/**
 * @author Ali Ismael <ali@gaaiat.com>
 */
"use strict";

import React from "react";
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
     * [handleClick description]
     * @return {[type]} [description]
     */
    handleClick() {
        this.__bodyMainRef.setState({age: Math.random()});
    }

    /**
     * You should never override the render method of the parent template!
     */
    createBody() {

        return (

            <div>
                <h1>
                    User account page demo
                </h1>
                <p>This is a demo page to which the sign in process will redirect</p>
            </div>
        );
    }
}
