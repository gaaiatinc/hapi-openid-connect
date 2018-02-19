/**
 * @author Ali Ismael <ali@gaaiat.com>
 */

import React from "react";
import {get as _get, set as _set} from "lodash";
import PropTypes from "prop-types";

import headMetaTags from "./template_components/HeadMetaTags";

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

        this.getExternalAssetsDescriptor = this
            .getExternalAssetsDescriptor
            .bind(this);
        this.filterModel = this
            .filterModel
            .bind(this);
        this.getHeaderTags = this
            .getHeaderTags
            .bind(this);
        this.getBodyEndElement = this
            .getBodyEndElement
            .bind(this);
        this.getBodyClassName = this
            .getBodyClassName
            .bind(this);

        const isomorphic_props = _get(props, "isomorphic_props");
        const model = _get(props, "model");
        if ((typeof isomorphic_props === "object") && (typeof model === "object")) {
            _set(isomorphic_props, "assets", this.getExternalAssetsDescriptor(model));
            _set(isomorphic_props, "filtered_model", this.filterModel(model));
            _set(isomorphic_props, "header_tags", this.getHeaderTags(model));
            _set(isomorphic_props, "body_class_name", this.getBodyClassName(model));
            _set(isomorphic_props, "body_end_element", this.getBodyEndElement(model));
        }
    }

    /**
   * This method should return a json descriptor of the EXTERNAL
   * javascript and stylesheet links
   *
   * [getExternalAssetsDescriptor description]
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
    getExternalAssetsDescriptor(model) {
        const assets = {
            javascript: [
                "https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js",
                // "https://npmcdn.com/axios/dist/axios.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/react/16.2.0/umd/react.production.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.2.0/umd/react-dom.production.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.31.5/react-bootstrap.min.js"
            ],
            styles: [
                //
                //
                "https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css",
                "https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap-theme.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-social/5.0.0/bootstrap-social.min.css"
            ]
        };
        return assets;
    }

    /**
   * This method must return a subset of the model that is secure for
   * sending to the browser.
   *
   * [filterModelData description]
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
    filterModel(model) {
        if (model && model.account_data && model.account_data.password) {
            model.account_data.password = "******";
        }
        return model;
    }

    /**
    *
    */
    getHeaderTags(model) {

        return headMetaTags(model);
    }

    /**
    *
    */
    getBodyEndElement(model) {
        return (
            <div>
                {/* <pre>{JSON.stringify(model, null, 4)}</pre> */}
            </div>
        );
    }

    /**
   * [getBodyClassName description]
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
    getBodyClassName(model) {
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

RootTemplate.propTypes = {
    model: PropTypes.object
};
RootTemplate.defaultProps = {};
