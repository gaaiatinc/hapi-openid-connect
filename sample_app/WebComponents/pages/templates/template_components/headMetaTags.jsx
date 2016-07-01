/**
 * @author Ali Ismael
 */

"use strict";

import React from "react";
import ReactDOM from "react-dom";

import {Image} from "react-bootstrap";
import {Col} from "react-bootstrap";
import {Grid} from "react-bootstrap";
import {Row} from "react-bootstrap";

import {Button} from "react-bootstrap";
import {Modal} from "react-bootstrap";
import {Navbar} from "react-bootstrap";

import {NavItem} from "react-bootstrap";
import {NavDropdown} from "react-bootstrap";
import {MenuItem} from "react-bootstrap";
import {Nav} from "react-bootstrap";

function headMetaTags(model) {
    const retVal = [
        (<meta key="head_tag_1" charSet="utf-8"/>),

        (<title key="head_tag_2">{model.content.page.title}</title>),
        (<meta key="head_tag_3" name="keywords" content={model.content.page.keywords} />),
        (<meta key="head_tag_4" name="description" content={model.content.page.description}/>),
        (<meta key="head_tag_5" name="robots" content="NOODP"/>),
        (<meta key="head_tag_6" httpEquiv="X-UA-Compatible" content="IE=edge"/>),
        (<meta key="head_tag_7" name="application-name" content="sampleapp"/>),
        (<meta key="head_tag_11" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0"/>),
        (<link key="head_tag_20" rel="dns-prefetch" href="https://www.sampleapp.me/" />),
        (<meta key="head_tag_24" property="twitter:card" content="summary"/>),
        (<meta key="head_tag_25" property="twitter:site" content="@sampleapp.me"/>)
    ];

    return retVal;
}

export default headMetaTags;
