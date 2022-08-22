/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { lazy } from 'react';
import assign from 'object-assign';
import { createSelector } from 'reselect';

import { createPlugin, connect } from '../utils/PluginsUtils';
import { on, toggleControl } from '../actions/controls';
import annotationsReducer from '../reducers/annotations';
import { closeAnnotations } from '../actions/annotations';

import annotationsEpics from '../epics/annotations';
import {Glyphicon, Tooltip} from "react-bootstrap";
import Button from "../components/misc/Button";
import OverlayTrigger from "../components/misc/OverlayTrigger";
import Message from "../components/I18N/Message";

import withSuspense from '../components/misc/withSuspense';
const AnnotationsPlugin = connect(createSelector([
    state => (state.controls && state.controls.annotations && state.controls.annotations.enabled) || (state.annotations && state.annotations.closing) || false
], (active) => ({
    active
})))(
    withSuspense(({ active  }) => !!active)(lazy(() => import('./annotations/AnnotationsPanel')))
);

const conditionalToggle = on.bind(null, toggleControl('annotations', null), (state) =>
    !(state.controls && state.controls.annotations && state.controls.annotations.enabled && state.annotations && state.annotations.editing)
, closeAnnotations);

export default createPlugin('Annotations', {
    component: assign(AnnotationsPlugin, {
        disablePluginIf: "{state('mapType') === 'cesium' || state('mapType') === 'leaflet' }"
    }),
    containers: {
        TOC: {
            doNotHide: true,
            name: "Annotations",
            target: 'toolbar',
            selector: () => true,
            Component: connect(() => {}, {
                onClick: conditionalToggle
            })(({onClick, layers, selectedLayers, status}) => {
                if (status === 'DESELECT' && layers.filter(l => l.id === 'annotations').length === 0) {
                    return (<OverlayTrigger
                        key="annotations"
                        placement="top"
                        overlay={<Tooltip
                            id="legend-tooltip-annotations"><Message msgId="toc.addAnnotations"/></Tooltip>}>
                        <Button key="annotations" bsStyle={'primary'} className="square-button-md"
                            onClick={onClick}>
                            <Glyphicon glyph="comment"/>
                        </Button>
                    </OverlayTrigger>);
                }
                if (selectedLayers[0]?.id === 'annotations') {
                    return (
                        <OverlayTrigger
                            key="annotations-edit"
                            placement="top"
                            overlay={<Tooltip
                                id="legend-tooltip-annotations-edit"><Message msgId="toc.editAnnotations"/></Tooltip>}>
                            <Button key="annotations" bsStyle={'primary'} className="square-button-md"
                                onClick={onClick}>
                                <Glyphicon glyph="pencil"/>
                            </Button>
                        </OverlayTrigger>);
                }
                return false;
            })
        },
        BurgerMenu: {
            name: 'annotations',
            position: 40,
            text: <Message msgId="annotationsbutton"/>,
            tooltip: "annotations.tooltip",
            icon: <Glyphicon glyph="comment"/>,
            action: conditionalToggle,
            priority: 2,
            doNotHide: true
        }
    },
    reducers: {
        annotations: annotationsReducer
    },
    epics: annotationsEpics
});
