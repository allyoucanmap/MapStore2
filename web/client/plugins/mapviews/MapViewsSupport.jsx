/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, Suspense, lazy, useState, useCallback, useEffect } from 'react';
import {
    ButtonGroup,
    Button,
    Glyphicon,
    Checkbox,
    ButtonToolbar,
    FormControl as FormControlRB,
    FormGroup,
    InputGroup,
    ControlLabel
} from 'react-bootstrap';
import uuid from 'uuid';
import max from 'lodash/max';
import DragDropItem from './DragDropItem';
import { getTitle } from '../../utils/TOCUtils';
import Select from 'react-select';
import withDebounceOnCallback from '../../components/misc/enhancers/withDebounceOnCallback';
import localizedProps from '../../components/misc/enhancers/localizedProps';
import SelectInfiniteScroll from './SelectInfiniteScroll';
import { textSearch, getLayerFromRecord } from '../../api/catalog/WFS';
import { getFeature } from '../../api/WFS';
import { METERS_PER_UNIT } from '../../utils/MapUtils';
function FormControlOnChange(props) {
    return <FormControlRB { ...props } onChange={(event) => props.onChange(event.target.value)} />;
}

const FormControl = withDebounceOnCallback('onChange', 'value')(
    localizedProps('placeholder')(FormControlOnChange)
);

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

function ViewLayerCatalog({
    id,
    layer,
    loadOptions,
    onChangeLayer
}) {
    function handleChangeLayer(option) {
        onChangeLayer(option?.record ? { ...getLayerFromRecord(option.record), id: uuid() } : null);
    }
    const value = layer ? { value: layer.name, label: layer.title } : undefined;
    return (
        <>
            <FormGroup
                controlId={id}
                key={id}
                style={{
                    zIndex: 20,
                    position: 'relative',
                    width: '100%'
                }}
            >
                <ControlLabel>Layer</ControlLabel>
                <SelectInfiniteScroll
                    value={value}
                    loadOptions={loadOptions}
                    onChange={handleChangeLayer}
                />
            </FormGroup>
        </>
    );
}

function Section({
    title,
    children,
    expanded: defaultExpanded
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, position: 'sticky', top: 0, background: '#ffffff', zIndex: 10 }}>
                <Button
                    className="square-button-md no-border"
                    onClick={() => setExpanded(!expanded)}
                    style={{ borderRadius: '50%', marginRight: 4 }}
                >
                    <Glyphicon glyph={expanded ? "chevron-down" : "chevron-right"}/>
                </Button>
                <div style={{ flex: 1, fontSize: 16 }}>
                    {title}
                </div>
            </div>
            {expanded ? <div style={{ paddingLeft: 34 }}>{children}</div> : null}
        </>
    );
}

const loadWFSOptions = (service) => ({
    q,
    page,
    pageSize
}) => {
    const startPosition = ((page - 1) * pageSize) + 1;
    return textSearch(service?.url, startPosition, pageSize, q)
        .then(({
            numberOfRecordsMatched,
            records
        }) => {
            const numberOfRecordRequested = startPosition + pageSize;
            return {
                isNextPageAvailable: numberOfRecordRequested < numberOfRecordsMatched,
                results: records.map((record) => ({
                    ...record,
                    selectOption: {
                        value: record.name,
                        label: record.title,
                        record
                    }
                }))
            };
        });
};

const getResourcesById = (id, resources) => {
    return resources.find(resource => resource.id === id);
};

const getFeatureFromBbox = (bbox, offset = 0) => {
    const [ minx, miny, maxx, maxy ] = bbox;
    const offsetDeg = offset / METERS_PER_UNIT.degrees;
    const oMinx = minx - offsetDeg;
    const oMiny = miny - offsetDeg;
    const oMaxx = maxx + offsetDeg;
    const oMaxy = maxy + offsetDeg;
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [oMinx, oMiny],
                    [oMinx, oMaxy],
                    [oMaxx, oMaxy],
                    [oMaxx, oMiny],
                    [oMinx, oMiny]
                ]
            ]

        },
        properties: {}
    };
};

const createInverseMaskFromPolygonFeatureCollection = (collection, { offset = 0 } = {}) => {
    return Promise.all([
        import('@turf/difference'),
        import('@turf/bbox')
    ])
        .then(([modDifference, modBbox]) => {
            const turfDifference = modDifference.default;
            const turfBbox = modBbox.default;
            const bbox = turfBbox(collection);
            const bboxPolygon = getFeatureFromBbox(bbox, offset);
            const features = [
                bboxPolygon,
                ...collection.features
                    .filter(({ geometry }) => geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon')
            ];
            const difference = features.length > 1
                ? features.reduce((previous, current) => turfDifference(previous, current))
                : bboxPolygon;
            return {
                type: 'FeatureCollection',
                features: [difference]
            };
        });
};

function ViewSettings({
    view,
    api,
    layers = [],
    onChange,
    onUpdateResource = () => {},
    onCaptureView,
    locale,
    services = {},
    selectedService,
    resources = []
}) {

    const { getViewCoordinates, computeViewCoordinates } = api;
    const { origin, target } = getViewCoordinates(view);

    function handleChange(options) {
        onChange({ ...view, ...options });
    }

    function handleLayerChange(layerId, options) {
        const viewLayer = view?.layers?.find(vLayer => vLayer.id === layerId);
        const viewLayers = viewLayer
            ? (view?.layers || [])
                .map((vLayer) => vLayer.id === layerId ? ({ ...viewLayer, ...options }) : vLayer)
            : [...(view?.layers || []), { id: layerId, ...options }];
        onChange({
            ...view,
            layers: viewLayers
        });
    }

    function handleCoordinatesUpdate(updatedValues) {
        const updatedCoordinates = computeViewCoordinates(view, { origin, target, ...updatedValues });
        handleChange(updatedCoordinates);
    }

    function getWFSLayerKey(layer, { inverse, offset }) {
        return `${layer.url};${layer.name};inverse:${inverse};offset:${offset}`;
    }

    function handleChangeWFSLayer(record, callback, { inverse = false, offset = 0 } = {}) {
        const layerWFS = record ? getLayerFromRecord(record) : null;
        const resourceId = getWFSLayerKey(layerWFS, { inverse, offset });
        const resource = resources.find(res => res.id === resourceId);
        if (!resource) {
            getFeature(layerWFS.url, layerWFS.name, {
                outputFormat: 'application/json',
                srsname: 'EPSG:4326'
            })
                .then(({ data: collection }) => inverse
                    ? createInverseMaskFromPolygonFeatureCollection(collection, { offset })
                    : collection
                )
                .then((collection) => {
                    onUpdateResource(resourceId, {
                        type: 'wfs',
                        name: layerWFS.name,
                        title: layerWFS.title,
                        url: layerWFS.url,
                        collection
                    });
                    callback(resourceId);
                });
        } else {
            callback(resourceId);
        }
    }

    const maskLayer = getResourcesById(view?.mask?.layer, resources);
    const terrainClippingLayerSource = getResourcesById(view?.terrain?.clippingLayerSource, resources)?.data;
    const terrainClippingFeatures = terrainClippingLayerSource?.collection?.features?.filter(({ geometry }) => geometry?.type === 'Polygon');
    const terrainClippingPolygon = view?.terrain?.clippingPolygon;

    return (
        <div style={{ padding: '0 4px 4px 4px', width: '100%', maxHeight: 400, overflow: 'auto' }}>
            <form>
                <Section
                    title="General"
                >
                    <div style={{ marginBottom: 8 }}>Camera position</div>
                    <div style={{ display: 'flex' }} >
                        <FormGroup controlId="camera-position-lng" >
                            <ControlLabel>Longitude</ControlLabel>
                            <FormControl
                                type="number"
                                value={origin?.longitude}
                                onChange={(val) => handleCoordinatesUpdate({ origin: { ...origin, longitude: parseFloat(val) } })}
                            />
                        </FormGroup>
                        <FormGroup controlId="camera-position-lat">
                            <ControlLabel>Latitude</ControlLabel>
                            <FormControl
                                type="number"
                                value={origin?.latitude}
                                onChange={(val) => handleCoordinatesUpdate({ origin: { ...origin, latitude: parseFloat(val) } })}
                            />
                        </FormGroup>
                        <FormGroup controlId="camera-position-height" >
                            <ControlLabel>Height</ControlLabel>
                            <FormControl
                                type="number"
                                value={origin?.height}
                                onChange={(val) => handleCoordinatesUpdate({ origin: { ...origin, height: parseFloat(val) } })}
                            />
                        </FormGroup>
                    </div>
                    {target && <>
                        <div style={{ marginBottom: 8 }}>Target position</div>
                        <div style={{ display: 'flex' }}>
                            <FormGroup controlId="target-position-lng">
                                <ControlLabel>Longitude</ControlLabel>
                                <FormControl
                                    type="number"
                                    value={target?.longitude}
                                    onChange={(val) => handleCoordinatesUpdate({ target: { ...target, longitude: parseFloat(val) } })}
                                />
                            </FormGroup>
                            <FormGroup controlId="target-position-lat">
                                <ControlLabel>Latitude</ControlLabel>
                                <FormControl
                                    type="number"
                                    value={target?.latitude}
                                    onChange={(val) => handleCoordinatesUpdate({ target: { ...target, latitude: parseFloat(val) } })}
                                />
                            </FormGroup>
                            <FormGroup controlId="target-position-height">
                                <ControlLabel>Height</ControlLabel>
                                <FormControl
                                    type="number"
                                    value={target?.height}
                                    onChange={(val) => handleCoordinatesUpdate({ target: { ...target, height: parseFloat(val) } })}
                                />
                            </FormGroup>
                        </div>
                    </>}
                    <FormGroup controlId="camera-fly-to">
                        <Checkbox checked={!!view.flyTo} onChange={() => handleChange({ flyTo: !view.flyTo })}>
                            Fly to animation
                        </Checkbox>
                    </FormGroup>
                    <FormGroup controlId="capture-view">
                        <Button bsSize="sm" bsStyle="primary" onClick={() => onCaptureView(view)}>Capture this view</Button>
                    </FormGroup>
                </Section>
                <Section
                    title="Mask"
                >
                    <FormGroup
                        controlId="mask-layer"
                        style={{
                            position: 'relative',
                            zIndex: 20
                        }}
                    >
                        <ControlLabel>Layer</ControlLabel>
                        <SelectInfiniteScroll
                            value={maskLayer ? { value: maskLayer?.data?.name, label: maskLayer?.data?.title } : undefined}
                            loadOptions={loadWFSOptions(services[selectedService])}
                            onChange={(option) => {
                                if (!option?.record) {
                                    return handleChange({ mask: { ...view?.mask, layer: undefined } });
                                }
                                return handleChangeWFSLayer(
                                    option.record,
                                    resourceId => handleChange({ mask: { ...view?.mask, layer: resourceId } }),
                                    {
                                        inverse: !!view?.mask?.inverse,
                                        offset: view?.mask?.inverse ? view?.mask?.offset : 0
                                    }
                                );
                            }}
                        />
                    </FormGroup>
                    <FormGroup controlId="enable-mask">
                        <Checkbox
                            checked={!!view?.mask?.enabled}
                            onChange={() => handleChange({ mask: { ...view?.mask, enabled: !view?.mask?.enabled } })}
                        >
                            Enable mask
                        </Checkbox>
                    </FormGroup>
                    <FormGroup controlId="inverse-mask">
                        <Checkbox
                            checked={!!view?.mask?.inverse}
                            disabled={!maskLayer}
                            onChange={() => {
                                const newValue = !view?.mask?.inverse;
                                handleChange({ mask: { ...view?.mask, inverse: newValue } });
                                handleChangeWFSLayer(
                                    maskLayer.data,
                                    (resourceId) => handleChange({ mask: { ...view?.mask, layer: resourceId, inverse: newValue } }),
                                    {
                                        inverse: newValue,
                                        offset: view?.mask?.inverse ? view?.mask?.offset : 0
                                    }
                                );
                            }}>
                            Invert mask
                        </Checkbox>
                    </FormGroup>
                    <FormGroup controlId="inverse-mask-offset" style={{ display: 'flex', alignItems: 'center' }}>
                        <ControlLabel>Offset (m){' '}</ControlLabel>
                        <FormControl
                            style={{ width: 150 }}
                            disabled={!maskLayer}
                            type="number"
                            value={view?.mask?.offset ?? 0}
                            onChange={(val) => handleChangeWFSLayer(
                                maskLayer.data,
                                (resourceId) => handleChange({ mask: { ...view?.mask, offset: parseFloat(val), layer: resourceId } }),
                                {
                                    inverse: !!view?.mask?.inverse,
                                    offset: view?.mask?.inverse ? val : 0
                                }
                            )}/>
                    </FormGroup>
                </Section>
                <Section
                    title="Globe translucency"
                >
                    <FormGroup controlId="enable-translucency">
                        <Checkbox checked={!!view?.globeTranslucency?.enabled} onChange={() => handleChange({ globeTranslucency: { ...view?.globeTranslucency, enabled: !view?.globeTranslucency?.enabled } })}>
                            Enable translucency
                        </Checkbox>
                    </FormGroup>
                    <FormGroup controlId="translucency-fade-by-distance">
                        <Checkbox checked={!!view?.globeTranslucency?.fadeByDistance} onChange={() => handleChange({ globeTranslucency: { ...view?.globeTranslucency, fadeByDistance: !view?.globeTranslucency?.fadeByDistance } })}>
                            Fade by distance
                        </Checkbox>
                    </FormGroup>
                </Section>
                <Section
                    title="Layers overrides"
                >
                    <ul style={{ width: '100%', padding: 0, margin: 0, listStyle: 'none' }}>
                        <li
                            style={{
                                border: '1px solid #ddd',
                                padding: 8,
                                marginBottom: 4
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>Terrain</div>
                            </div>
                            <div style={{ paddingTop: 8 }}>
                                <>
                                    <FormGroup
                                        controlId={`terrain-clipping-layer`}
                                        style={{
                                            position: 'relative',
                                            zIndex: 20
                                        }}
                                    >
                                        <ControlLabel>Clipping Layers Source</ControlLabel>
                                        <SelectInfiniteScroll
                                            value={terrainClippingLayerSource ? { value: terrainClippingLayerSource?.name, label: terrainClippingLayerSource?.title } : undefined}
                                            loadOptions={loadWFSOptions(services[selectedService])}
                                            onChange={(option) => {
                                                if (!option?.record) {
                                                    return handleChange({ terrain: { ...view?.terrain, clippingLayerSource: undefined, clippingPolygon: undefined  } });
                                                }
                                                return handleChangeWFSLayer(
                                                    option.record,
                                                    resourceId => handleChange({ terrain: { ...view?.terrain, clippingLayerSource: resourceId } })
                                                );
                                            }}
                                        />
                                    </FormGroup>
                                    <FormGroup
                                        controlId={`terrain-clipping-feature`}
                                    >
                                        <ControlLabel>Clipping Feature</ControlLabel>
                                        <Select
                                            value={terrainClippingPolygon ? { value: terrainClippingPolygon, label: terrainClippingPolygon } : undefined}
                                            disabled={!terrainClippingLayerSource}
                                            options={terrainClippingFeatures?.map((feature) => ({ value: feature.id, label: feature.id, feature }))}
                                            onChange={(option) => handleChange({ terrain: { ...view?.terrain, clippingPolygon: option?.feature?.id } })}
                                        />
                                    </FormGroup>
                                    <FormGroup controlId={`terrain-inverse-clipping`}>
                                        <Checkbox
                                            checked={!!view?.terrain?.clippingPolygonUnion}
                                            onChange={() => handleChange({ terrain: { ...view?.terrain, clippingPolygonUnion: !view?.terrain?.clippingPolygonUnion } })}>
                                            Inverse clipping
                                        </Checkbox>
                                    </FormGroup>
                                </>
                            </div>
                        </li>
                        {mergeViewLayers(layers, view?.layers).map((layer) => {

                            const clippingLayerSource = resources.find(({ id }) => id === layer.clippingLayerSource)?.data;
                            const clippingFeatures = clippingLayerSource?.collection?.features?.filter(({ geometry }) => geometry?.type === 'Polygon');
                            const clippingPolygon = layer.clippingPolygon;

                            return (
                                <li
                                    key={`${view.id}-${layer.id}`}
                                    style={{
                                        border: '1px solid #ddd',
                                        padding: 8,
                                        marginBottom: 4,
                                        ...(layer.changed && { borderLeft: '4px solid #398439' })
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>{getTitle(layer.title, locale)}</div>
                                        <ButtonGroup>
                                            <Button
                                                className="square-button-md no-border"
                                                onClick={() => handleLayerChange(layer.id, { visibility: !layer.visibility })}
                                            >
                                                <Glyphicon glyph={layer.visibility ? 'eye-open' : 'eye-close'}/>
                                            </Button>
                                        </ButtonGroup>
                                    </div>
                                    <div style={{ paddingTop: 8 }}>
                                        {layer.type === '3dtiles' && <>
                                            <FormGroup
                                                controlId={`${layer.id}-clipping-layer`}
                                                style={{
                                                    position: 'relative',
                                                    zIndex: 20
                                                }}
                                            >
                                                <ControlLabel>Clipping Layers Source</ControlLabel>
                                                <SelectInfiniteScroll
                                                    value={clippingLayerSource ? { value: clippingLayerSource?.name, label: clippingLayerSource?.title } : undefined}
                                                    loadOptions={loadWFSOptions(services[selectedService])}
                                                    onChange={(option) => {
                                                        if (!option?.record) {
                                                            return handleLayerChange(layer.id, { clippingLayerSource: undefined, clippingPolygon: undefined });
                                                        }
                                                        return handleChangeWFSLayer(
                                                            option.record,
                                                            resourceId => handleLayerChange(layer.id, { clippingLayerSource: resourceId })
                                                        );
                                                    }}
                                                />
                                            </FormGroup>
                                            <FormGroup
                                                controlId={`${layer.id}-clipping-feature`}
                                            >
                                                <ControlLabel>Clipping Feature</ControlLabel>
                                                <Select
                                                    value={clippingPolygon ? { value: clippingPolygon, label: clippingPolygon } : undefined}
                                                    disabled={!layer.clippingLayerSource}
                                                    options={clippingFeatures?.map((feature) => ({ value: feature.id, label: feature.id, feature }))}
                                                    onChange={(option) => handleLayerChange(layer.id, { clippingPolygon: option?.feature?.id })}
                                                />
                                            </FormGroup>
                                            <FormGroup controlId={`${layer.id}-inverse-clipping`}>
                                                <Checkbox
                                                    checked={!!layer.clippingPolygonUnion}
                                                    disabled={!layer.clippingPolygon}
                                                    onChange={() => handleLayerChange(layer.id, { clippingPolygonUnion: !layer.clippingPolygonUnion })}>
                                                    Inverse clipping
                                                </Checkbox>
                                            </FormGroup>
                                        </>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Section>
            </form>
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
    onUpdateResources = () => {},
    onUpdateServices = () => {},
    views: viewsProp = [],
    selectedId,
    defaultTitle = 'Map View',
    layers,
    locale,
    resources: resourcesProp = [],
    services,
    selectedService,
    defaultServices,
    defaultSelectedService,
    ...props
}) {

    const [ views, setViews ] = useState(viewsProp);
    const [ resources, setResources ] = useState(resourcesProp);
    const [ expanded, setExpanded ] = useState('');
    const [ showViewsGeometries, setShowViewsGeometries ] = useState(false);

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
        if (!services && views.length === 0) {
            onUpdateServices(defaultSelectedService);
        }
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

    function handleChangeOnSelected(properties) {
        const newViews = views.map((view) => view.id === selected.id ? ({
            ...view,
            ...properties
        }) : view);
        setViews(newViews);
        onUpdateViews(newViews);
    }

    function handleUpdateResource(id, data) {
        const hasResource = !!resources.find(res => res.id === id);
        const newResources = hasResource
            ? resources.map((res) => res.id === id ? { id, data } : res)
            : [...resources, { id, data }];
        setResources(newResources);
        onUpdateResources(newResources);
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
                    selectedId={selectedId}
                    views={views}
                    apiRef={apiRef}
                    showViewsGeometries={showViewsGeometries}
                    resources={resources}
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
                    width: 400,
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
                    <div style={{ position: 'relative', flex: 1 }}>
                        {expanded === 'settings' ? (
                            <FormControl  value={selected?.title} onChange={val => handleChangeOnSelected({ title: val })} />
                        ) : selected?.title}
                    </div>
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
                    {expanded === 'list' &&
                    <div style={{ position: 'relative', width: '100%'}}>
                        <div style={{ padding: '0 4px' }}>
                            <Checkbox checked={showViewsGeometries} onChange={() => setShowViewsGeometries(!showViewsGeometries)}>
                                Show views geometries
                            </Checkbox>
                        </div>
                        <ViewsList
                            views={views}
                            onSelect={handleSelectView}
                            onMove={handleMove}
                            onMoveEnd={handleMoveEnd}
                            onRemove={handleRemoveView}
                        />
                    </div>
                    }
                    {expanded === 'settings' &&
                        <ViewSettings
                            view={selected}
                            api={api.current}
                            onChange={handleUpdateView}
                            onCaptureView={handleCaptureView}
                            layers={layers}
                            locale={locale}
                            services={services}
                            selectedService={selectedService}
                            resources={resources}
                            onUpdateResource={handleUpdateResource}
                        />
                    }
                </div>
            </div>
        </>
    );
}

export default MapViewSupport;
