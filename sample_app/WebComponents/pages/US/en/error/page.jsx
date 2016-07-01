/**
 * @author Ali Ismael <ali@gaaiat.com>
 */
"use strict";

import React from "react";
import ReactDOM from "react-dom";

import RootTemplate from "pages/templates/root_react_template";

import {
    Grid,
    Row,
    Form,
    FormGroup,
    FormControl,
    Col,
    Checkbox,
    Button,
    ControlLabel
} from "react-bootstrap";

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
            <Grid>
                <Row>
                    <Col md={8} mdOffset={4} sm={8} smOffset={4} xs={12}>
                        <h2>OpenID-Connect 2.0</h2>
                    </Col>
                </Row>
                <Row>
                <Col md={8} mdOffset={4} sm={8} smOffset={4} xs={12}>
                        <h1>Oops! Page not found.</h1>
                    </Col>
                </Row>
            </Grid>
        );

    }
}
