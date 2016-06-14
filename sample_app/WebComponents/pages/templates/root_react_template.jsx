/**
 * @author Ali Ismael <ali@gaaiat.com>
 */

import React from "react";

//import {Head, Vendors, BodyClassName, Analytics} from "resources/jsx_components/helpers";

/**
 * This is a template for react-based pages.  The purpose of this template is to
 * encapsulate the methods and functionalith which must be implemented in any
 * react-based web pages.
 */
export default class RootTemplate extends React.Component {
    /**
     * [constructor description]
     * @param  {[type]} props [description]
     * @return {[type]}       [description]
     */
    constructor(props) {
        super(props);
    }

    /**
   * This method should return a json descriptor of the EXTERNAL
   * javascript and stylesheet links
   *
   * [getExternalAssetsDescriptor description]
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
    static getExternalAssetsDescriptor(model) {
        const assets = {
            javascript: [
                "https://cdnjs.cloudflare.com/ajax/libs/react/15.1.0/react.min.js", "https://cdnjs.cloudflare.com/ajax/libs/react/15.1.0/react-dom.min.js"
            ],
            styles: []
        };
        return assets;
    }

    /**
   * This method must return a subset of the modelData that is secure for
   * sending to the browser.
   *
   * [filterModelData description]
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
    static filterModelData(model) {
        return model;
    }

    /**
   *
   */
    static getHeaderTags(model) {
        return [];
    }

    /**
    *
    */
    static getBodyEndElement() {
        return "div";
    }

    /**
   * [getBodyClassName description]
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
    static getBodyClassName(model) {
        return "body-class";
    }

    /**
     * [createBody description]
     * @return {[type]} [description]
     */
    createBody() {
        return "";
    }

    /**
     * [render description]
     * @return {[type]} [description]
     */
    render() {
        return (
            <div id="document-body">
                {this.createBody()}
            </div>
        );
    }
}
