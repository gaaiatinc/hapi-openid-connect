/**
 * @author Ali Ismael <ali@gaaiat.com>
 */
"use strict";

import React, {Component, PropTypes} from "react";
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

        // this.bodyTop = <PageBodyTop />;
        // this.bodyMain = <PageBodyMain id="t24" ref={(bdyMnRef) => {
        //     this.__bodyMainRef = bdyMnRef;
        // }} />;
        // this.bodyBottom = <PageBodyBottom id="q122" onClick={() => {
        //     this.__bodyMainRef.setNewGraphData({age: Math.random()});
        // }} />;
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

        let action_string = "/sample_app/oidc/signin";

        if (this.props.model.requestInfo.query["authorization_request_id"]) {
            action_string += "?authorization_request_id=" + this.props.model.requestInfo.query["authorization_request_id"];
        }

        return (

            <Grid className="loginForm">
                <Row>
                    <Col sm={8} smOffset={2} xs={12}>
                        <h1>OpenID-Connect 2.0</h1>
                    </Col>
                </Row>
                <Row>
                    <Col sm={8} smOffset={2} xs={12}>
                        <h1></h1>
                    </Col>
                </Row>
                <Row>
                    <Form method="POST" action={action_string} horizontal>
                        <FormGroup controlId="formHorizontalEmail">
                            <Col componentClass={ControlLabel} xs={2}>
                                Email
                            </Col>
                            <Col sm={8} xs={12}>
                                <FormControl type="email" name="user_id" placeholder="Email"/>
                            </Col>
                        </FormGroup>

                        <FormGroup controlId="formHorizontalPassword">
                            <Col componentClass={ControlLabel} xs={2}>
                                Password
                            </Col>
                            <Col sm={8} xs={12}>
                                <FormControl type="password" name="user_password" placeholder="Password"/>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col sm={8} smOffset={2} xs={12}>
                                <Checkbox>Remember me</Checkbox>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col sm={8} smOffset={2} xs={12}>
                                <Button type="submit">
                                    Sign in
                                </Button>
                            </Col>
                        </FormGroup>
                    </Form>
                </Row>
            </Grid>
        );
    }
}
