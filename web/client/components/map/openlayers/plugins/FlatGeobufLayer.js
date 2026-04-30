/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import isEqual from 'lodash/isEqual';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { transformExtent as olTransformExtent } from 'ol/proj';
import Layers from '../../../../utils/openlayers/Layers';
import {bbox as bboxStrategy } from 'ol/loadingstrategy.js';
import { getStyle } from '../VectorStyle';
import { applyDefaultStyleToVectorLayer } from '../../../../utils/StyleUtils';
import {
    FGB_LAYER_TYPE,
    getFlatGeobufOl
} from '../../../../api/FlatGeobuf';
import { getRequestConfigurationByUrl } from '../../../../utils/SecurityUtils';
import { updateUrlParams } from '../../../../utils/URLUtils';

// Map flatgeobuf header geometry type ids to the names expected by
// applyDefaultStyleToVectorLayer / createDefaultStyle.
const FGB_GEOMETRY_TYPE_BY_ID = {
    1: 'Point',
    2: 'LineString',
    3: 'Polygon',
    4: 'MultiPoint',
    5: 'MultiLineString',
    6: 'MultiPolygon',
    7: 'GeometryCollection'
};

const FGB_INFERRED_GEOMETRY_TYPE_KEY = '_fgbInferredGeometryType';

const getGeometryTypeFromOptions = (options) => {
    if (options?.geometryType) {
        return options.geometryType;
    }
    const id = options?.metadata?.geometryType;
    return typeof id === 'number' ? FGB_GEOMETRY_TYPE_BY_ID[id] : undefined;
};

const getFlatGeobufStyle = (layer, options, map) => {
    const geometryType = getGeometryTypeFromOptions(options)
        || layer?.get?.(FGB_INFERRED_GEOMETRY_TYPE_KEY);
    return getStyle(
        applyDefaultStyleToVectorLayer({
            ...options,
            geometryType,
            features: [],
            asPromise: true
        })
    )
        .then((style) => {
            if (style) {
                if (style.__geoStylerStyle) {
                    style({ map, features: [] })
                        .then((olStyle) => {
                            layer.setStyle(olStyle);
                        });
                } else {
                    layer.setStyle(style);
                }
            }
        });
};

// Yield to the event loop every N features so the OpenLayers renderer gets a
// requestAnimationFrame slot to paint progress. flatgeobuf batches features
// within ~256KB into a single HTTP range request, so without this yielding the
// for-await runs entirely in microtasks and the layer only paints once the
// whole batch has been added.
const FEATURE_YIELD_BATCH = 200;
const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

const FGB_DATA_PROJECTION = 'EPSG:4326';

const createLoader = (source, options, onGeometryType) => async(extent, resolution, projection, success, failure) => {
    try {
        const flatgeobuf = await getFlatGeobufOl();
        const { headers, params } = getRequestConfigurationByUrl(options.url, options?.security?.sourceId);
        const secureUrl = updateUrlParams(options.url, params);

        const featureProjCode = projection.getCode();
        const dataExtent = featureProjCode !== FGB_DATA_PROJECTION
            ? olTransformExtent(extent, featureProjCode, FGB_DATA_PROJECTION)
            : extent;
        const rect = {
            minX: dataExtent[0],
            minY: dataExtent[1],
            maxX: dataExtent[2],
            maxY: dataExtent[3]
        };

        let geometryReported = false;
        const reportGeometryType = (geometryType) => {
            if (geometryReported || !geometryType) {
                return;
            }
            geometryReported = true;
            onGeometryType?.(geometryType);
        };
        const handleHeader = (headerMeta) => {
            // The FGB header can declare Unknown (0) for heterogeneous datasets.
            // Only trust it when it maps to a concrete geometry name.
            const id = headerMeta?.geometryType;
            const fromHeader = typeof id === 'number' ? FGB_GEOMETRY_TYPE_BY_ID[id] : undefined;
            if (fromHeader) {
                reportGeometryType(fromHeader);
            }
        };

        const loaded = [];
        let counter = 0;
        const iterator = flatgeobuf.deserialize(
            secureUrl,
            rect,
            handleHeader,
            false,     // nocache
            headers,
            false,     // renderFeature
            FGB_DATA_PROJECTION,
            featureProjCode
        );
        for await (const feature of iterator) {
            source.addFeature(feature);
            loaded.push(feature);
            counter += 1;
            // Fallback when the header didn't declare a concrete type: sniff
            // the first feature with a geometry. OL Feature.getGeometry().getType()
            // returns the same names applyDefaultStyleToVectorLayer expects.
            if (!geometryReported) {
                const fromFeature = feature.getGeometry?.()?.getType?.();
                if (fromFeature) {
                    reportGeometryType(fromFeature);
                }
            }
            if (counter % FEATURE_YIELD_BATCH === 0) {
                await yieldToEventLoop();
            }
        }
        success?.(loaded);
    } catch (e) {
        failure?.();
    }
};

const updateStyle = (layer, options, map) => getFlatGeobufStyle(layer, options, map);

const createLayer = (options, map) => {

    const strategy = bboxStrategy;

    const source = new VectorSource({
        strategy
    });

    let layer;

    // Called by the loader with a concrete geometry type, sourced from the FGB
    // header when available, otherwise sniffed from the first loaded feature.
    // Used to recover styling when the layer config didn't carry the geometry
    // type (e.g., the layer was created outside the catalog metadata flow).
    const onGeometryTypeDetected = (geometryType) => {
        console.log(geometryType);
        if (!layer || !geometryType) {
            return;
        }
        // Config wins — don't overwrite an explicit caller-provided type.
        if (getGeometryTypeFromOptions(options)) {
            return;
        }
        if (layer.get(FGB_INFERRED_GEOMETRY_TYPE_KEY) === geometryType) {
            return;
        }
        layer.set(FGB_INFERRED_GEOMETRY_TYPE_KEY, geometryType);
        updateStyle(layer, options, map);
    };

    source.setLoader(createLoader(source, options, onGeometryTypeDetected));

    layer = new VectorLayer({
        msId: options.id,
        source: source,
        visible: options.visibility !== false,
        zIndex: options.zIndex,
        opacity: options.opacity,
        minResolution: options.minResolution,
        maxResolution: options.maxResolution
    });

    updateStyle(layer, options, map);

    return layer;
};

Layers.registerType(FGB_LAYER_TYPE, {
    create: createLayer,
    update: (layer, newOptions, oldOptions, map) => {

        const isStyleChanged = !isEqual(oldOptions.style, newOptions.style);
        const isStyleNameChanged = oldOptions.styleName !== newOptions.styleName;
        if (
            isStyleChanged ||
            isStyleNameChanged
        ) {
            updateStyle(layer, newOptions, map);
        }

        return null;
    }
});
