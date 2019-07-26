/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import assign from 'object-assign';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { setControlProperty } from '../actions/controls';
import { updateNode } from '../actions/layers';
import { getSelectedLayer } from '../selectors/layers';
import PropTypes from 'prop-types';
import { Button, Glyphicon } from 'react-bootstrap';
import Form from '../components/misc/Form';

const formatLabels = {
    'application/vnd.mapbox-vector-tile': 'MapBox Vector Tile',
    'application/json;type=geojson': 'GeoJSON',
    'application/json;type=topojson': 'TopoJSON',
    'image/png': 'Image PNG',
    'image/png8': 'Image PNG 8',
    'image/jpeg': 'Image JPEG',
    'image/gif': 'Image GIF'
};

class WMTSSettings extends Component {

    static propTypes = {
    };

    render() {
        return null;
    }
}

const TOCButton = connect(createSelector([
    state => get(state, 'controls.wmtsSettings.enabled'),
    getSelectedLayer
], (enabled, { type } = {}) => ({
    enabled: enabled && type === 'wmts'
})), {
    onToggle: setControlProperty.bind(null, 'wmtsSettings', 'enabled', true)
})(({ status, enabled, onToggle, ...props }) => !enabled && status === 'LAYER'
    ? <Button {...props} onClick={() => onToggle()}>
        <Glyphicon glyph="wrench"/>
    </Button>
    : null);

class TOCPanel extends Component {

    static propTypes = {
        enabled: PropTypes.bool,
        selectedLayer: PropTypes.object,
        form: PropTypes.func,
        onChange: PropTypes.func
    };

    static defaultProps = {
        form: ({ availableFormats = [] }) => [
            {
                type: 'text',
                id: 'title',
                label: 'Title',
                placeholder: 'Enter title'
            },
            {
                type: 'select',
                id: 'format',
                label: 'Format',
                placeholder: 'Enter format',
                clearable: false,
                ignoreAccents: false,
                setValue: (fieldId, { format } = {}) => {
                    return format && format.value && { format: format.value };
                },
                options: [...availableFormats
                    .map(format => ({ value: format, label: formatLabels[format] || format }))
                    .sort((a, b) => a.label > b.label ? 1 : -1)]
            }
        ],
        onChange: () => {}
    };

    componentWillReceiveProps(newProps) {
        if (this.props.onClose && !newProps.selectedLayer.name && this.props.selectedLayer.name
        || newProps.selectedLayer.type !== this.props.selectedLayer.type && newProps.selectedLayer.type !== 'wmts') {
            this.props.onClose();
        }
    }

    render() {
        const { selectedLayer, onChange } = this.props;
        // const { name } = selectedLayer;
        return this.props.enabled
        ? (<div
            style={{
                width: 300,
                padding: 8,
                borderLeft: '1px solid #ddd' }}>
            <Form
                bootstrap
                form={this.props.form(selectedLayer)}
                values={selectedLayer}
                onChange={(changedOptions) => onChange(selectedLayer.id, 'layers', changedOptions)}/>
        </div>)
        : null;
    }
}

export const WMTSSettingsPlugin = assign(WMTSSettings, {
    TOC: {
        priority: 1,
        tool: TOCButton,
        panel: connect(
            createSelector([
                state => get(state, 'controls.wmtsSettings.enabled'),
                getSelectedLayer
            ], (enabled, selectedLayer) => ({
                enabled,
                selectedLayer: selectedLayer || {}
            })),
            {
                onClose: setControlProperty.bind(null, 'wmtsSettings', 'enabled', false),
                onChange: updateNode
            }
        )(TOCPanel)
    }
});

export const reducers = {};
