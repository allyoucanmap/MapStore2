/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import {
    ButtonGroup,
    Button,
    Glyphicon,
    Checkbox,
    FormGroup,
    ControlLabel
} from 'react-bootstrap';
import Select from 'react-select';
import FormControl from '../DebouncedFormControl';
import { formatClippingFeatures } from '../../../utils/MapViewsUtils';
import Message from '../../I18N/Message';

function LayerOverridesNode({
    layer,
    onChange,
    onReset,
    title,
    updateLayerRequest,
    vectorLayers,
    clippingFeatures,
    clippingLayerResource
}) {

    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const isVisibilitySupported = !['terrain'].includes(layer.type);
    const isOpacitySupported = !['3dtiles', 'terrain'].includes(layer.type);
    const isClippingSupported = !!['3dtiles', 'terrain'].includes(layer.type);

    function handleUpdateLayer({ layer: resourceLayer }) {
        if (!resourceLayer) {
            return onChange({
                clippingLayerResourceId: undefined,
                clippingPolygonFeatureId: undefined,
                clippingPolygonUnion: undefined
            });
        }
        setLoading(true);
        return updateLayerRequest({ layer: resourceLayer })
            .then((clippingLayerResourceId) => {
                onChange({ clippingLayerResourceId });
                setLoading(false);
            });
    }

    return (
        <li className={`ms-map-views-layer-node${layer.changed ? ' changed' : ''}`}>
            <div className="ms-map-views-layer-node-head">
                <Button
                    className="square-button-md no-border"
                    style={{ borderRadius: '50%', marginRight: 4 }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <Glyphicon glyph={expanded ? "chevron-down" : "chevron-right"} />
                </Button>
                <div className="ms-map-views-layer-node-title">{title}</div>
                <ButtonGroup>
                    {layer.changed && <Button
                        className="square-button-md no-border"
                        onClick={() => onReset()}
                    >
                        <Glyphicon glyph="refresh" />
                    </Button>}
                    {isVisibilitySupported && <Button
                        className="square-button-md no-border"
                        onClick={() => onChange({ visibility: !layer.visibility })}
                    >
                        <Glyphicon glyph={layer.visibility ? 'eye-open' : 'eye-close'} />
                    </Button>}
                </ButtonGroup>
            </div>
            {expanded && <div className="ms-map-views-layer-node-body">
                {isOpacitySupported && <FormGroup controlId={`map-views-layer-opacity-${layer.id}`} className="inline">
                    <ControlLabel><Message msgId="mapViews.layerOpacity"/></ControlLabel>
                    <FormControl
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        className="opacity-field"
                        fallbackValue={1}
                        value={layer.opacity}
                        onChange={(value) => onChange({ opacity: value })}
                    />
                </FormGroup>}
                {isClippingSupported && <div className="ms-map-views-layer-clipping">
                    <FormGroup
                        controlId={`map-views-layer-clipping-source-${layer.id}`}
                    >
                        <ControlLabel><Message msgId="mapViews.clippingSourceLayer"/></ControlLabel>
                        <Select
                            isLoading={loading}
                            value={clippingLayerResource}
                            options={vectorLayers}
                            onChange={(option) => handleUpdateLayer({ layer: option?.layer })}
                        />
                    </FormGroup>
                    <FormGroup
                        controlId={`map-views-layer-clipping-feature-id-${layer.id}`}
                    >
                        <ControlLabel><Message msgId="mapViews.clippingFeature"/></ControlLabel>
                        <Select
                            value={layer.clippingPolygonFeatureId ? { value: layer.clippingPolygonFeatureId, label: layer.clippingPolygonFeatureId } : undefined}
                            disabled={!layer.clippingLayerResourceId}
                            options={formatClippingFeatures(clippingFeatures)?.map((feature) => ({ value: feature.id, label: feature.id, feature }))}
                            onChange={(option) => onChange({ clippingPolygonFeatureId: option?.feature?.id })}
                        />
                    </FormGroup>
                    <FormGroup controlId={`map-views-layer-clipping-inverse-${layer.id}`}>
                        <Checkbox
                            checked={!!layer.clippingPolygonUnion}
                            disabled={!layer.clippingPolygonFeatureId || loading}
                            onChange={() => onChange({ clippingPolygonUnion: !layer.clippingPolygonUnion })}>
                            <Message msgId="mapViews.clippingInverse"/>
                        </Checkbox>
                    </FormGroup>
                    {loading && <div className="ms-map-views-loading-mask"/>}
                </div>}
            </div>}
        </li>
    );
}

export default LayerOverridesNode;
