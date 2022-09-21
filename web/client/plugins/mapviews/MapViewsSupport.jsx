/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { ButtonGroup, Button, Glyphicon, Checkbox, ButtonToolbar } from 'react-bootstrap';
import uuid from 'uuid';
import max from 'lodash/max';
import DragDropItem from './DragDropItem';
import { getTitle } from '../../utils/TOCUtils';

const mapViewSupports = {
    // leaflet: lazy(() => import(/* webpackChunkName: 'supports/leafletMapView' */ '../../components/map/leaflet/MapViewSupport')),
    // openlayers: lazy(() => import(/* webpackChunkName: 'supports/olMapView' */ '../../components/map/openlayers/MapViewSupport')),
    cesium: lazy(() => import(/* webpackChunkName: 'supports/cesiumMapView' */ '../../components/map/cesium/MapViewSupport'))
};

function mergeViewLayers(layers, viewLayers = []) {
    if (viewLayers.length === 0) {
        return layers || [];
    }
    return (layers || []).map((layer) => {
        const viewLayer = viewLayers.find(vLayer => vLayer.id === layer.id);
        if (viewLayer) {
            return { ...layer, ...viewLayer, changed: true };
        }
        return layer;
    });
}

function ViewSettings({
    value,
    layers = [],
    onChange,
    onCaptureView,
    locale
}) {

    function handleChange(options) {
        onChange({ ...value, ...options });
    }

    function handleLayerChange(layerId, options) {
        const viewLayer = value?.layers?.find(vLayer => vLayer.id === layerId);
        const viewLayers = viewLayer
            ? (value?.layers || [])
                .map((vLayer) => vLayer.id === layerId ? ({ ...viewLayer, ...options }) : vLayer)
            : [...(value?.layers || []), { id: layerId, ...options }];
        onChange({
            ...value,
            layers: viewLayers
        });
    }

    return (
        <div style={{ padding: 4, width: '100%' }}>
            <Button bsSize="sm" onClick={() => onCaptureView(value)}>Capture this view</Button>
            <Checkbox checked={!!value.flyTo} onChange={() => handleChange({ flyTo: !value.flyTo })}>
                Fly to animation
            </Checkbox>
            <ul style={{ width: '100%', padding: 0, margin: 0, listStyle: 'none' }}>
                {mergeViewLayers(layers, value?.layers).map((layer) => {
                    return (
                        <li
                            key={`${value.id}-${layer.id}`}
                            style={{
                                border: '1px solid #ddd',
                                padding: 8,
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: 4,
                                ...(layer.changed && { borderLeft: '4px solid #398439' })
                            }}
                        >
                            <div style={{ flex: 1 }}>{getTitle(layer.title, locale)}</div>
                            <ButtonGroup>
                                <Button
                                    className="square-button-md no-border"
                                    onClick={() => handleLayerChange(layer.id, { visibility: !layer.visibility })}
                                >
                                    <Glyphicon glyph={layer.visibility ? 'eye-open' : 'eye-close'}/>
                                </Button>
                            </ButtonGroup>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function ViewsList({
    views,
    onSelect,
    onRemove,
    onMove,
    onMoveEnd
}) {
    return (
        <div style={{ padding: 4, width: '100%' }}>
            <ul style={{ width: '100%', padding: 0, margin: 0, listStyle: 'none' }}>
                {views.map((view, idx) => (
                    <DragDropItem
                        key={view.id}
                        id={view.id}
                        containerId="Views"
                        index={idx}
                        title={view.title}
                        onSelect={() => onSelect(view)}
                        onRemove={() => onRemove(view)}
                        onMove={onMove}
                        onMoveEnd={onMoveEnd}
                    />
                ))}
            </ul>
        </div>
    );
}

function MapViewSupport({
    mapType,
    onSelectView = () => {},
    onUpdateViews = () => {},
    views: viewsProp = [],
    selectedId,
    defaultTitle = 'Map View',
    layers,
    locale,
    ...props
}) {

    const [ views, setViews ] = useState(viewsProp);
    const [ expanded, setExpanded ] = useState('');

    const selected = views?.find(view => view.id === selectedId);
    const currentIndex = views.indexOf(selected);

    const [ initApi, setInitApi ] = useState(false);
    const api = useRef();
    function apiRef(newApi) {
        api.current = newApi;
        if (!initApi) {
            setInitApi(true);
        }
    }

    function handleCreateView() {
        const maxCount = views.length > 0
            ? max(
                views
                    .map(view => {
                        const titleRegex = new RegExp(`${defaultTitle} \\(([0-9]+)\\)`);
                        const match = (view.title || '').match(titleRegex)?.[1];
                        return match ? parseFloat(match) : undefined;
                    })
                    .filter(value => value !== undefined)
            )
            : 0;
        const newView = {
            ...api.current.getView(),
            title: `${defaultTitle} (${maxCount + 1})`,
            id: uuid()
        };
        const newViews = [...views, newView];
        setViews(newViews);
        onSelectView(newView.id);
        onUpdateViews(newViews);
    }

    function handleRemoveView(view) {
        const newViews = views.filter((vw) => vw.id !== view.id);
        setViews(newViews);
        onUpdateViews(newViews);
    }

    function handleSelectView(view) {
        if (view && api?.current?.setView) {
            api.current.setView(view);
        }
        onSelectView(view.id);
    }

    function handleUpdateView(newView) {
        const newViews = views.map((view) => view.id === newView.id ? newView : view);
        setViews(newViews);
        onUpdateViews(newViews);
    }
    function handleCaptureView(newView) {
        const newViews = views.map((view) => view.id === newView.id ? ({
            ...newView,
            ...api.current.getView()
        }) : view);
        setViews(newViews);
        onUpdateViews(newViews);
    }

    const handleMove = useCallback((dragIndex, hoverIndex) => {
        setViews((prevViews) => {
            let newViews = [...prevViews];
            newViews.splice(dragIndex, 1);
            newViews.splice(hoverIndex, 0, prevViews[dragIndex]);
            return newViews;
        });
    }, []);

    function handleMoveEnd() {
        onUpdateViews(views);
    }

    function handleStepMove(delta) {
        if (views[currentIndex + delta]) {
            handleSelectView(views[currentIndex + delta]);
        }
    }

    // set the initial view
    // only once on mount
    const init = useRef(false);
    useEffect(() => {
        if (initApi && !init.current) {
            init.current = true;
            if (selected) {
                api.current.setView({
                    ...selected,
                    // remove fly animation to the initial view
                    flyTo: false
                });
            }
        }
    }, [initApi]);

    const Support = mapViewSupports[mapType];

    if (!Support) {
        return null;
    }

    return (
        <>
            <Suspense fallback={<div/>}>
                <Support
                    {...props}
                    apiRef={apiRef}
                />
            </Suspense>
            <div
                id="map-views"
                className="shadow"
                style={{
                    position: 'absolute',
                    zIndex: 1000,
                    margin: '0 5px',
                    top: 0,
                    left: 40,
                    width: 300,
                    background: '#fff'
                }}>
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 4
                    }}
                >
                    <div style={{ position: 'relative', flex: 1 }}>{selected?.title}</div>
                    <ButtonToolbar>
                        <ButtonGroup>
                            <Button
                                bsStyle="primary"
                                className="square-button-md"
                                active={expanded === 'list'}
                                onClick={() => setExpanded(expanded !== 'list' ? 'list' : '')}
                            >
                                <Glyphicon glyph="list" />
                            </Button>
                            <Button
                                bsStyle="primary"
                                className="square-button-md"
                                active={expanded === 'settings'}
                                disabled={!selected}
                                onClick={() => setExpanded(expanded !== 'settings' ? 'settings' : '')}
                            >
                                <Glyphicon glyph="wrench"/>
                            </Button>
                        </ButtonGroup>
                        <ButtonGroup>
                            <Button
                                bsStyle="primary"
                                className="square-button-md"
                                onClick={handleCreateView}
                            >
                                <Glyphicon glyph="plus"/>
                            </Button>
                            <Button
                                bsStyle="primary"
                                className="square-button-md"
                                onClick={() => handleStepMove(-1)}
                                disabled={!views[currentIndex - 1]}
                            >
                                <Glyphicon glyph="step-backward"/>
                            </Button>
                            <Button
                                bsStyle="primary"
                                className="square-button-md"
                                onClick={() => handleStepMove(1)}
                                disabled={!views[currentIndex + 1]}
                            >
                                <Glyphicon glyph="step-forward"/>
                            </Button>
                        </ButtonGroup>
                    </ButtonToolbar>
                </div>
                <div style={{ display: 'flex' }}>
                    {expanded === 'list' && <ViewsList
                        views={views}
                        onSelect={handleSelectView}
                        onMove={handleMove}
                        onMoveEnd={handleMoveEnd}
                        onRemove={handleRemoveView}
                    />}
                    {expanded === 'settings' && <ViewSettings
                        value={selected}
                        onChange={handleUpdateView}
                        onCaptureView={handleCaptureView}
                        layers={layers}
                        locale={locale}
                    />}
                </div>
            </div>
        </>
    );
}

export default MapViewSupport;
