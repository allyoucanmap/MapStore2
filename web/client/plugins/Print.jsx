/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import './print/print.css';

import head from 'lodash/head';
import castArray from "lodash/castArray";
import isNil from "lodash/isNil";
import PropTypes from 'prop-types';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { PanelGroup, Col, Glyphicon, Grid, Panel, Row, Tabs, Tab, FormGroup, FormControl, ControlLabel, Checkbox, InputGroup } from 'react-bootstrap';
import { connect, createPlugin } from '../utils/PluginsUtils';
import { createSelector } from 'reselect';

import { setControlProperty, toggleControl } from '../actions/controls';
import { configurePrintMap, printError, printSubmit, printSubmitting, addPrintParameter } from '../actions/print';
import Message from '../components/I18N/Message';
import Dialog from '../components/misc/Dialog';
import printReducers from '../reducers/print';
import printEpics from '../epics/print';
import { printSpecificationSelector } from "../selectors/print";
import { layersSelector, rawGroupsSelector } from '../selectors/layers';
import { currentLocaleSelector } from '../selectors/locale';
import { mapSelector, scalesSelector } from '../selectors/map';
import { mapTypeSelector } from '../selectors/maptype';
import { normalizeSRS, convertDegreesToRadian } from '../utils/CoordinatesUtils';
import { getMessageById } from '../utils/LocaleUtils';
import { defaultGetZoomForExtent, getResolutions, mapUpdated, dpi2dpu, DEFAULT_SCREEN_DPI, getScales, reprojectZoom } from '../utils/MapUtils';
import { getDerivedLayersVisibility, isInsideResolutionsLimits } from '../utils/LayersUtils';
import { has, includes, over, transform } from 'lodash';
import {additionalLayersSelector} from "../selectors/additionallayers";
import { MapLibraries } from '../utils/MapTypeUtils';
import FlexBox from '../components/layout/FlexBox';
import Text from '../components/layout/Text';
import Button from '../components/layout/Button';
import { getResolutionMultiplier } from '../utils/PrintUtils';
import PortalComp from '../components/misc/Portal';
import PaginationCustom from './ResourcesCatalog/components/PaginationCustom';
import Select from 'react-select';
import TOC, { ControlledTOC } from './TOC/components/TOC';
import BaseMap from '../components/map/BaseMap';
import mapType from '../components/map/enhancers/mapType';
import { getPointResolution } from 'ol/proj';
import Attribution from 'ol/control/Attribution';
const Map = mapType(BaseMap);
Map.displayName = 'Map';

import './Print.css';

/**
 * Print plugin. This plugin allows to print current map view. **note**: this plugin requires the  **printing module** to work.
 * Please look at mapstore documentation about how to add and configure the printing module in your installation.
 *
 * It also works as a container for other plugins, usable to customize the UI of the parameters dialog.
 *
 * The UI supports different targets for adding new plugins:
 *  - `left-panel` (controls/widgets to be added to the left column, before the accordion)
 *  - `left-panel-accordion` (controls/widgets to be added to the left column, as subpanels of the accordion)
 *  - `right-panel` (controls/widgets to be added to the right column, before the buttons bar)
 *  - `buttons` (controls/widgets to be added to the right column, in the buttons bar)
 *  - `preview-panel` (controls/widgets to be added to the printed pdf preview panel)
 *
 * In addition it is also possibile to use specific targets that override a standard widget, to replace it
 * with a custom one. They are (in order, from left to right and top to bottom in the UI):
 *  - `name` (`left-panel`, `position`: `1`)
 *  - `description` (`left-panel`, `position`: `2`)
 *  - `outputFormat` (`left-panel`, `position`: `3`)
 *  - `projection` (`left-panel`, `position`: `4`)
 *  - `layout` (`left-panel-accordion`, `position`: `1`)
 *  - `legend-options` (`left-panel-accordion`, `position`: `2`)
 *  - `resolution` (`right-panel`, `position`: `1`)
 *  - `map-preview` (`right-panel`, `position`: `2`)
 *  - `default-background-ignore` (`right-panel`, `position`: `3`)
 *  - `submit` (`buttons`, `position`: `1`)
 *  - `print-preview` (`preview-panel`, `position`: `1`)
 *
 * To remove a widget, you have to include a Null plugin with the desired target.
 * You can use the position to sort existing and custom items.
 *
 * Standard widgets can be configured by providing an options object as a configuration property
 * of this (Print) plugin. The options object of a widget is named `<widget_id>Options`
 * (e.g. `outputFormatOptions`).
 *
 * You can customize Print plugin by creating one custom plugin (or more) that modifies the existing
 * components with your own ones. You can configure this plugin in `localConfig.json` as usual.
 *
 * It delegates to a printingService the creation of the final print. The default printingService
 * implements a mapfish-print v2 compatible workflow. It is possible to override the printingService to
 * use, via a specific property (printingService).
 *
 * It is also possible to customize the payload of the spec sent to the mapfish-print engine, by
 * adding new transformers to the default chain.
 *
 * Each transformer is a function that can add / replace / remove fragments from the JSON payload.
 *
 * @class Print
 * @memberof plugins
 * @static
 *
 * @prop {boolean} cfg.useFixedScales if true, the printing scale is constrained to the nearest scale of the ones configured
 * in the `config.yml` file, if false the current scale is used
 * Note: If `disableScaleLocking` in `config.yml` is false, `useFixedScales` must be true to avoid errors due to disallowed scales.
 * @prop {boolean} cfg.editScale if true, the scale input field in the print preview panel will be editable allowing users to
 * freely enter a desired scale value. This allows the print service to accept custom scale values rather than only those from
 * its capabilities in case it is configured in the `config.yml` file.
 * If false, the default behavior is to take a scale within the capabilities scales.
 * <br>
 * if useFixedScales = true and editScale = true --> the editScale setting will override the fixed scales
 * **Important Note:** This functionality relies on `disableScaleLocking` being `true` in the `config.yml` file.
 * If `disableScaleLocking` in `config.yml` is `false` (meaning the backend requires fixed scales),
 * then `editScale` **must be `false`** to prevent scale-not-allowed errors.
 * <br>
 * @prop {object} cfg.overrideOptions overrides print options, this will override options created from current state of map
 * @prop {boolean} cfg.overrideOptions.geodetic prints in geodetic mode: in geodetic mode scale calculation is more precise on
 * printed maps, but the preview is not accurate
 * @prop {string} cfg.overrideOptions.outputFilename name of output file
 * @prop {object} cfg.mapPreviewOptions options for the map preview tool
 * @prop {string[]} cfg.ignoreLayers list of layer types to ignore in preview and when printing, default ["google"]
 * @prop {boolean} cfg.mapPreviewOptions.enableScalebox if true a combobox to select the printing scale is shown over the preview
 * this is particularly useful if useFixedScales is also true, to show the real printing scales
 * @prop {boolean} cfg.mapPreviewOptions.enableRefresh true by default, if false the preview is not updated if the user pans or zooms the main map
 * @prop {object} cfg.outputFormatOptions options for the output formats
 * @prop {object[]} cfg.outputFormatOptions.allowedFormats array of allowed formats, e.g. [{"name": "PDF", "value": "pdf"}]
 * @prop {object} cfg.projectionOptions options for the projections
 * @prop {string[]} cfg.excludeLayersFromLegend list of layer names e.g. ["workspace:layerName"] to exclude from printed document
 * @prop {object} cfg.mergeableParams object to pass to mapfish-print v2 to merge params, example here https://github.com/mapfish/mapfish-print-v2/blob/main/docs/protocol.rst#printpdf
 * @prop {object[]} cfg.projectionOptions.projections array of available projections, e.g. [{"name": "EPSG:3857", "value": "EPSG:3857"}]
 * @prop {object} cfg.overlayLayersOptions options for overlay layers
 * @prop {boolean} cfg.overlayLayersOptions.enabled if true a checkbox will be shown to exclude or include overlay layers to the print
 *
 * @example
 * // printing in geodetic mode
 * {
 *   "name": "Print",
 *   "cfg": {
 *       "overrideOptions": {
 *          "geodetic": true
 *       }
 *    }
 * }
 *
 * @example
 * // Using a list of fixed scales with scale selector
 * {
 *   "name": "Print",
 *   "cfg": {
 *       "ignoreLayers": ["google"],
 *       "useFixedScales": true,
 *       "mapPreviewOptions": {
 *          "enableScalebox": true
 *       }
 *    }
 * }
 *
 * @example
 * // Default behavior (scale editing enabled, no fixed scales)
 * // Assumes disableScaleLocking = true in config.yml
 * {
 *   "name": "Print",
 *   "cfg": {
 *     "useFixedScales": false,
 *     "editScale": true
 *   }
 * }
 *
 * @example
 * // Configuration when disableScaleLocking = false in config.yml
 * {
 *   "name": "Print",
 *   "cfg": {
 *     "useFixedScales": true,
 *     "editScale": false
 *   }
 * }
 *
 * @example
 * // Priority override: editScale overrides useFixedScales when both are true
 * // (only valid when disableScaleLocking = true in config.yml)
 * {
 *   "name": "Print",
 *   "cfg": {
 *     "useFixedScales": true,
 *     "editScale": true
 *   }
 * }
 *
 *
 * @example
 * // restrict allowed output formats
 * {
 *   "name": "Print",
 *   "cfg": {
 *       "outputFormatOptions": {
 *          "allowedFormats": [{"name": "PDF", "value": "pdf"}, {"name": "PNG", "value": "png"}]
 *       }
 *    }
 * }
 *
 * @example
 * // enable custom projections for printing
 * "projectionDefs": [{
 *    "code": "EPSG:23032",
 *    "def": "+proj=utm +zone=32 +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +units=m +no_defs",
 *    "extent": [-1206118.71, 4021309.92, 1295389.0, 8051813.28],
 *    "worldExtent": [-9.56, 34.88, 31.59, 71.21]
 * }]
 * ...
 * {
 *   "name": "Print",
 *   "cfg": {
 *       "projectionOptions": {
 *          "projections": [{"name": "UTM32N", "value": "EPSG:23032"}, {"name": "EPSG:3857", "value": "EPSG:3857"}, {"name": "EPSG:4326", "value": "EPSG:4326"}]
 *       }
 *    }
 * }
 *
 * @example
 * // customize the printing UI via plugin(s)
 * import React from "react";
 * import {createPlugin} from "../../utils/PluginsUtils";
 * import { connect } from "react-redux";
 *
 * const MyCustomPanel = () => <div>Hello, I am a custom component</div>;
 *
 * const MyCustomLayout = ({sheet}) => <div>Hello, I am a custom layout, the sheet is {sheet}</div>;
 * const MyConnectedCustomLayout = connect((state) => ({sheet: state.print?.spec.sheet}))(MyCustomLayout);
 *
 * export default createPlugin('PrintCustomizations', {
 *     component: () => null,
 *     containers: {
 *         Print: [
 *             // this entry add a panel between title and description
 *             {
 *                 target: "left-panel",
 *                 position: 1.5,
 *                 component: MyCustomPanel
 *             },
 *             // this entry replaces the layout panel
 *             {
 *                 target: "layout",
 *                 component: MyConnectedCustomLayout,
 *                 title: "MyLayout"
 *             },
 *             // To remove one component, simply create a component that returns null.
 *             {
 *                 target: "map-preview",
 *                 component: () => null
 *             }
 *         ]
 *     }
 * });
 * @example
 * // adds a transformer to the printingService chain
 * import {addTransformer} from "@js/utils/PrintUtils";
 *
 * addTransformer("mytranform", (state, spec) => Promise.resolve({
 *      ...spec,
 *      custom: "some value"
 * }));
 */

function overrideItem(item, overrides = []) {
    const replacement = overrides.find(i => i.target === item.id);
    return replacement ?? item;
}

const EmptyComponent = () => {
    return null;
};

function handleRemoved(item) {
    return item.plugin ? item : {
        ...item,
        plugin: EmptyComponent
    };
}

function mergeItems(standard, overrides) {
    return standard
        .map(item => overrideItem(item, overrides))
        .map(handleRemoved);
}

function filterLayer(layer = {}) {
    // Skip layer with error and type cog
    return !layer.loadingError && layer.type !== "cog";
}

const INCHES_TO_CM = 2.54;
const computeValue = (value, scale, dpi) => {
    return (value * scale * dpi) / INCHES_TO_CM;
};

const parseBoxProps = (props) => {
    return {
        ...props,
        x: computeValue(props.x, props.scale, props.dpi),
        y: computeValue(props.y, props.scale, props.dpi),
        width: computeValue(props.width, props.scale, props.dpi),
        height: computeValue(props.height, props.scale, props.dpi),
        fontSize: computeValue(props.fontSize, props.scale, props.dpi)
    };
};
const Box = forwardRef((props, ref) => {
    const {
        x,
        y,
        width,
        height,
        style,
        className,
        children,
        edit,
        fontSize
    } = parseBoxProps(props);
    const [hover, setHover] = useState(false);
    return (
        <div ref={ref} className={className} style={{ ...style, position: 'absolute', top: y, left: x, width, height, fontSize, ...(edit ? { border: '1px dashed #ddd' } : {}) }} onPointerLeave={() => setHover(false)} onPointerOver={() => setHover(true)}>
            {children}
            {edit && hover ? <>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '1px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, 0)', width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translate(-50%, 0)', width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translate(0, -50%)', width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
                <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translate(0, -50%)', width: '0.5rem', height: '0.5rem', border: '2px solid #6298fa' }}></div>
            </> : null}
        </div>
    );
});

const Paper = forwardRef(({
    x,
    y,
    width,
    height,
    dpi,
    scale,
    children
}, ref) => {
    return (
        <Box ref={ref} x={x} y={y} width={width} height={height} className="shadow-soft" style={{ background: '#fff' }} dpi={dpi} scale={scale} >
            {children}
        </Box>
    );
});

const SetResolutions = ({
    map,
    dpi = 96,
    scale: scaleProp
}) => {
    useEffect(() => {
        if (map) {
            console.log(map.getView());
            console.log([50000, 25000].map((scale) => {
                return scale /
                    getPointResolution(
                        map.getView().getProjection(),
                        dpi / 25.4,
                        map.getView().getCenter()
                    );
            }));
            setTimeout(() => {
                map.getView().setResolution((50000000 / 100) /
                    getPointResolution(
                        map.getView().getProjection(),
                        dpi / (INCHES_TO_CM) /* scaleProp */,
                        [0, 0]// map.getView().getCenter() // comparing with QGIS it seems using 0,0
                    ));
            }, 1000);
            const controls = map && map.getControls && map.getControls();
            if (controls && controls.forEach && map && map.removeControl) {
                controls.forEach((control) => {
                    if (control instanceof Attribution) {
                        map.removeControl(control);
                    }
                });
            }
            
        }
    }, [map, dpi, scaleProp]);
    return null;
};

import arrow from '../../../java/printing/resources/geoserver/print/Arrow_North_CFCF.svg';
import chart1 from './print-01.png'
import chart2 from './print-02.png'
import chart3 from './print-03.png'
import print from './print.json'
const RulerX = ({
    x,
    scale,
    dpi,
    margin
}) => {
    const node = useRef();
    const [size, setSize] = useState();
    useEffect(() => {
        const { width } = node.current.getBoundingClientRect();
        const widthInCm = ((width / dpi) * INCHES_TO_CM) / scale;
        const oneCm = ((1 * dpi) / INCHES_TO_CM) * scale;
        setSize([Math.round(widthInCm), oneCm]);
        // console.log(width, widthInCm, dpi * INCHES_TO_CM, oneCm);
    }, [dpi, scale, margin]);
    return (
        <>
            <FlexBox ref={node} className="_relative _fill" style={{ gap: size?.[1], overflow: 'hidden', marginLeft: size?.[1] + 16 }}>
                {[...Array(size?.[0] || 0).keys()].map((idx) => {
                    return (<div style={{ position: 'relative', height: '100%', width: 0 }}>
                        <div style={{ position: 'absolute', background: '#ddd', height: '100%', width: 1, transform: 'translateX(-50%)' }}></div>
                        <div style={{ position: 'absolute', bottom: 0, marginLeft: '0.2rem', fontSize: '0.5rem' }}>{idx}</div>
                    </div>);
                })}
            </FlexBox>
            <div style={{ pointerEvents: 'none', marginLeft: 16, height: '100%', width: 1, position: 'absolute', top: 0, left: x, background: 'red', userSelect: 'none' }}></div>
        </>
    );
};

const RulerY = ({
    y,
    scale,
    dpi,
    margin
}) => {
    const node = useRef();
    const [size, setSize] = useState();
    useEffect(() => {
        const { height } = node.current.getBoundingClientRect();
        const widthInCm = ((height / dpi) * INCHES_TO_CM) / scale;
        const oneCm = ((1 * dpi) / INCHES_TO_CM) * scale;
        setSize([Math.round(widthInCm), oneCm]);
        // console.log(width, widthInCm, dpi * INCHES_TO_CM, oneCm);
    }, [dpi, scale, margin]);
    return (
        <>
            <FlexBox ref={node} column className="_relative _fill" style={{ gap: size?.[1], overflow: 'hidden', marginTop: size?.[1] }}>
                {[...Array(size?.[0] || 0).keys()].map((idx) => {
                    return (<div style={{ position: 'relative', background: '#ddd', width: '100%', height: 0 }}>
                        <div style={{ position: 'absolute', background: '#ddd', width: '100%', height: 1, transform: 'translateY(-50%)' }}></div>
                        <div style={{ position: 'absolute', right: 0, marginRight: '0.2rem', transform: 'rotate(-90deg)', fontSize: '0.5rem' }}>{idx}</div>
                    </div>);
                })}
            </FlexBox>
            <div style={{ pointerEvents: 'none', width: '100%', height: 1, position: 'absolute', left: 0, top: y, background: 'red', userSelect: 'none' }}></div>
        </>
    );
};

const Table = ({
    geojson
}) => {
    const propertiesKey = Object.keys(geojson?.features?.[0]?.properties || {});
    return (
        <table className="table-print">
            <tr>
                {propertiesKey.map(key => <th key={key}>{key}</th>)}
            </tr>
            {(geojson?.features || []).map((feature, idx) => {
                return (
                    <tr key={idx}>
                        {propertiesKey.map(key => <td key={key}>{feature.properties[key]}</td>)}
                    </tr>
                );
            })}
        </table>
    );
};

const Legend = ({
    layers
}) => {
    return (
        <ul className="legend-print">
            {layers.map((layer, idx) => (
                <li key={idx}>
                    <div>{layer.title}</div>
                    <img src={layer.legendUrl} />
                </li>
            ))}
        </ul>
    );
};

const Print = ({
    type = 'map'
}) => {
    const [scale, setScale] = useState(0.8);
    const [view, setView] = useState();
     const [open, setOpen] = useState();
    const dpi = 96;
    const itm = {
        map: [
            { id: "1", title: 'Image', visibility: true, x: 0.5, y: 0.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: '/dist/web/client/product/assets/img/logo.png' },
            { id: "2", title: 'Map', editable: true, visibility: true, x: 0.5, y: 3, width: 28.7, height: 16, fontSize: 0.4, type: 'map', src: '' },
            ...(view === 'template' ? [{ id: "5", title: 'Resource', visibility: true, x: 0.5, y: 3, width: 28.7, height: 16, fontSize: 0.4, type: 'resource' }] : []),
            { id: "3", title: 'Title', editable: true, visibility: true, x: 3, y: 1, width: 5, height: 1.2, fontSize: 0.8, type: 'text', value: 'My map' },
            { id: "4", title: 'North Arrow', visibility: true, x: 26.7, y: 16, width: 2, height: 2, fontSize: 0.4, type: 'image', src: arrow },
           
        ],
        dashboard: [
            { id: "1", title: 'Image', visibility: true, x: 0.6, y: 0.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: '/dist/web/client/product/assets/img/logo.png' },
            { id: "2", title: 'Map', visibility: true, x: 0.5, y: 4, width: 9.5, height: 9, fontSize: 0.4, type: 'map', src: '' },
            { id: "25", title: 'Text', visibility: true, x: 0.5, y: 3, width: 9.5, height: 1, fontSize: 0.4, type: 'text', value: 'States Map' },
            { id: "3", title: 'Text', visibility: true, x: 3, y: 1, width: 7, height: 1.2, fontSize: 0.8, type: 'text', value: 'My Dashboard' },
            { id: "4", title: 'North Arrow', visibility: true, x: 8, y: 10, width: 2, height: 2, fontSize: 0.4, type: 'image', src: arrow },
            { id: "5", title: 'Image', visibility: true, x: 0.5, y: 14, width: 9.5, height: 5, fontSize: 0.4, type: 'image', src: chart1 },
            { id: "55", title: 'Text', visibility: true, x: 0.5, y: 13.25, width: 9.5, height: 0.75, fontSize: 0.4, type: 'text', value: 'US Surface' },
            { id: "6", title: 'Image', visibility: true, x: 10, y: 14, width: 9.5, height: 5, fontSize: 0.4, type: 'image', src: chart2 },
            { id: "65", title: 'Text', visibility: true, x: 10, y: 13.25, width: 9.5, height: 0.75, fontSize: 0.4, type: 'text', value: 'US People' },
            { id: "7", title: 'Image', visibility: true, x: 19.5, y: 11, width: 9.5, height: 5, fontSize: 0.4, type: 'image', src: chart3 },
            { id: "75", title: 'Text', visibility: true, x: 19.5, y: 10.25, width: 9.5, height: 0.75, fontSize: 0.4, type: 'text', value: 'Workers/Unemploy/Gender' },
            { id: "8", title: 'Text', visibility: true, x: 19.5, y: 17, width: 4.75, height: 2, fontSize: 1.5, type: 'text', value: '~23M' },
            { id: "85", title: 'Text', visibility: true, x: 19.5, y: 16.25, width: 4.75, height: 0.75, fontSize: 0.4, type: 'text', value: 'Families' },
            { id: "9", title: 'Text', visibility: true, x: 19.5 + 4.75, y: 17, width: 4.75, height: 2, fontSize: 1.5, type: 'text', value: '~3.7M' },
            { id: "95", title: 'Text', visibility: true, x: 19.5 + 4.75, y: 16.25, width: 4.75, height: 0.75, fontSize: 0.4, type: 'text', value: 'Land Km' },
            { id: "11", title: 'Table', visibility: true, x: 10, y: 4, width: 9.5, height: 9, fontSize: 0.195, type: 'table', geojson: print },
            { id: "115", title: 'Text', visibility: true, x: 10, y: 3, width: 9.5, height: 1, fontSize: 0.4, type: 'text', value: 'States Table' },
            { id: "12", title: 'Text', visibility: true, x: 19.5, y: 4, width: 4.75, height: 6, fontSize: 0.25, type: 'text', value: '<p>Sample dashboard to show all widgets and connection.</p><p>It contains:</p><ul><li>Sample chart widget</li><li>Sample counter widget</li><li>Map and Legend widget</li><li>Table widget <strong style="color: rgb(255, 153, 0);">with filter enabled</strong></li><li>Text widget (this one)</li></ul><p>All the widget are connected to browse data also according the filter specified in the table.</p>' },
            { id: "13", title: 'Legend', visibility: true, x: 19.5 + 4.75, y: 4, width: 4.75, fontSize: 0.25, height: 6, type: 'legend', layers: [{ title: 'States of US', legendUrl: 'https://gs-stable.geosolutionsgroup.com/geoserver/wms?LEGEND_OPTIONS=forceLabels%3Aon&SLD_VERSION=1.1.0&authkey=784e257f-da27-4ea3-9d95-5b90d18f920c&format=image%2Fpng&height=12&layer=gs%3Aus_states&request=GetLegendGraphic&service=WMS&style=&version=1.3.0&width=12' }] }
        ].map((entry) => ['1', '3'].includes(entry.id) ? entry : ({ ...entry, x: entry.x + 0.1, width: entry.width - 0.2 })),
        geostory_2: [
            { id: "1", title: 'Image', visibility: true, x: 0.6, y: 0.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: '/dist/web/client/product/assets/img/logo.png' },
            // { id: "2", title: 'Map', visibility: true, x: 0.5, y: 4, width: 9.5, height: 9, fontSize: 0.4, type: 'map', src: '' },
            { id: "25", title: 'Text', visibility: true, x: 4.35, y: 3, width: 21, height: 4, fontSize: 0.4, type: 'text', value: 'This is a list of the highest astronomical observatories in the world, considering only ground-based observatories and ordered by elevation above mean sea level. The main list includes only permanent observatories with facilities constructed at a fixed location, followed by a supplementary list for temporary observatories such as transportable telescopes or instrument packages. For large observatories with numerous telescopes at a single location, only a single entry is included listing the main elevation of the observatory or of the highest operational instrument if that information is available.' },
            { id: "3", title: 'Text', visibility: true, x: 3, y: 1, width: 7, height: 1.2, fontSize: 0.8, type: 'text', value: 'My GeoStory' },
            { id: "5", title: 'Image', visibility: true, x: 7.675, y: 7.5, width: 14.35, height: 9.5, fontSize: 0.4, type: 'image', src: 'https://demo.geo-solutions.it/mockups/mapstore2/geostory/assets/img/ALMA_Dwarfed_by_Mountain_Peaks.jpg' },
            { id: "3", title: 'Text', visibility: true, x: 7.675, y: 17.3, width: 14.35, height: 1.2, fontSize: 0.3, type: 'text', value: 'View showing several of the world\'s highest observatory sites in Chile, looking north across the Llano de Chajnantor and ALMA site, with the peaks of Cerro Toco (right center) and Cerro Chajnantor (right) rising above.' }, 
        ],
        geostory_3: [
            { id: "1", title: 'Image', visibility: true, x: 0.6, y: 0.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: '/dist/web/client/product/assets/img/logo.png' },
            { id: "2", title: 'Map', visibility: true, x: 0.5, y: 3, width: 28.7, height: 16, fontSize: 0.4, type: 'map', src: '' },
            { id: "3", title: 'Shape', visibility: true, x: 17.2, y: 3, width: 12, height: 16, fontSize: 0.3, type: 'shape', background: '#ffffffaa' },
            { id: "25", title: 'Text', visibility: true, x: 17.7, y: 3, width: 11, height: 1, fontSize: 0.6, type: 'text', value: 'Chacaltaya Astrophysical Observatory' },
            { id: "3", title: 'Text', visibility: true, x: 3, y: 1, width: 7, height: 1.2, fontSize: 0.8, type: 'text', value: 'My GeoStory' },
            { id: "5", title: 'Image', visibility: true, x: 17.7, y: 4.5, width: 11, height: 7.5, fontSize: 0.4, type: 'image', src: 'https://demo.geo-solutions.it/mockups/mapstore2/geostory/assets/img/Obsevatorio_Astrof%C3%ADsico_de_Chacaltaya.jpg' },
            { id: "3", title: 'Text', visibility: true, x: 17.7, y: 12.3, width: 11, height: 1.5, fontSize: 0.3, type: 'text', value: 'Particle detector at Chacaltaya Astrophysical Observatory, the highest permanent astronomical observatory in the world from the 1940s through 2009.' },
            { id: "4", title: 'North Arrow', visibility: true, x: 0.5, y: 16.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: arrow },
        ],
        geostory: [
            { id: "1", title: 'Image', visibility: true, x: 0.6, y: 0.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: '/dist/web/client/product/assets/img/logo.png' },
            { id: "2", title: 'Map', visibility: true, x: 12, y: 3, width: 17.2, height: 16, fontSize: 0.4, type: 'map', src: '' },
            // { id: "3", title: 'Shape', visibility: true, x: 0.5, y: 3, width: 12, height: 16, fontSize: 0.3, type: 'shape', background: '#ffffffaa' },
            { id: "25", title: 'Text', visibility: true, x: 0.5, y: 3, width: 11, height: 1, fontSize: 0.6, type: 'text', value: 'Indian Astronomical Observatory' },
            { id: "3", title: 'Text', visibility: true, x: 3, y: 1, width: 7, height: 1.2, fontSize: 0.8, type: 'text', value: 'My GeoStory' },
            { id: "5", title: 'Image', visibility: true, x: 0.5, y: 4.5, width: 11, height: 8.5, fontSize: 0.4, type: 'image', src: '	https://demo.geo-solutions.it/mockups/mapstore2/geostory/assets/img/Hanle_observatory.jpg' },
            { id: "3", title: 'Text', visibility: true, x: 0.5, y: 13.1, width: 11, height: 3, fontSize: 0.3, type: 'text', value: 'The Indian Astronomical Observatory (IAO), located in Hanle near Leh in Ladakh, India, has one of the world\'s highest located sites for optical, infrared and gamma-ray telescopes. It is operated by the Indian Institute of Astrophysics, Bangalore. It is currently the ninth (see List of highest astronomical observatories) highest optical telescope in the world, situated at an elevation of 4,500 meters (14,764 ft).' },
            { id: "4", title: 'North Arrow', visibility: true, x: 26.7, y: 16.5, width: 2, height: 2, fontSize: 0.4, type: 'image', src: arrow },
        ]
    };
    const [items, setItems] = useState(itm[type]);
    const paper = useRef();
    const canvas = useRef();
    const [position, setPosition] = useState([0, 0]);
    function handlePointerMove(event) {
        const canvasRect = canvas.current.getBoundingClientRect();
        const paperRect = paper.current.getBoundingClientRect();
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;
        const px = event.clientX - paperRect.left;
        const py = event.clientY - paperRect.top;
        setPosition([x, y, ((px / dpi) * INCHES_TO_CM) / scale, ((py / dpi) * INCHES_TO_CM) / scale]);
    }
    return (
        <FlexBox className="print _relative _fill" column>
            <FlexBox gap="sm" className="_padding-sm" centerChildrenVertically style={{ borderBottom: '1px solid #ddd' }}>
                <FlexBox.Fill flexBox centerChildrenVertically gap="sm" ><Glyphicon glyph="print"/> Print composer</FlexBox.Fill>
                <Button square borderTransparent>
                    <Glyphicon glyph="1-close" />
                </Button>
            </FlexBox>
            <FlexBox.Fill flexBox style={{ minHeight: 0 }}>
                <FlexBox column gap="xs" className="_padding-xs" style={{ borderRight: '1px solid #ddd' }}>
                    <Button square variant={open ? "success" : undefined} onClick={ ()=> setOpen(!open)}>
                        <Glyphicon glyph="menu-hamburger" />
                    </Button>
                    <Button square variant={view === 'template' ? 'success' : undefined}>
                        <Glyphicon glyph="box" />
                    </Button>
                    <Button square>
                        <Glyphicon glyph="refresh" />
                    </Button>
                    {view === 'template' ? <>
                        <div style={{ borderBottom: '1px solid #ddd' }}></div>
                        <Button square>
                            <Glyphicon glyph="1-map" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="font" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="picture" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="list" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="1-compass" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="scale-bar" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="features-grid" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="stats" />
                        </Button>
                        <Button square>
                            <Glyphicon glyph="counter" />
                        </Button>
                    </> : null}
                </FlexBox>
                {open ? <FlexBox column style={{ width: 200, borderRight: '1px solid #ddd' }} className="_padding-sm">
                    <div>Page 01</div>
                    <ControlledTOC
                        tree={items}
                        style={{ paddingLeft: 0, paddingRight: 0 }}
                        selectedNodes={[{ id: '2' }]}
                        config={{
                            sortable: view === 'template'
                        }}
                        nodeItems={[ { Component: ({ defaultLayerNodeComponent, ...props }) => {
                            const Cmp = defaultLayerNodeComponent;
                            const icons = {
                                map: '1-map',
                                text: 'font',
                                'North Arrow': '1-compass',
                                'image': "picture"
                            };
                            return (
                                <Cmp {...props} visibilityCheck={view === 'template' ? props.visibilityCheck : null} nodeIcon={<Glyphicon className="ms-node-icon" glyph={icons[props.node.title] || icons[props.node.type]} />}/>
                            );
                        }, name: 'Custom', selector: () => true }]}
                        nodeToolItems={[ { Component: () => <Glyphicon glyph="unlock" />, name: 'Lock' }]}
                    />
                </FlexBox> : null}
                <FlexBox.Fill flexBox  className="_relative" column>
                    <div style={{ height: 16, width: '100%', position: 'relative' }}>
                        <RulerX x={position[0]} scale={scale} dpi={dpi}/>
                    </div>
                    <FlexBox.Fill flexBox >
                        <div  style={{ width: 16, height: '100%', position: 'relative' }}>
                            <RulerY y={position[1]} scale={scale} dpi={dpi}/>
                        </div>
                        <FlexBox.Fill  className="ms-secondary-colors _relative" onPointerMove={handlePointerMove} style={{ overflow: 'auto' }} onWheel={(event) => {
                            setScale(Math.sign(event.deltaY) * -0.1 + scale);
                        }}>
                            <div ref={canvas} className="_absolute _fill">
                                {/* <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                                    <div className="shadow-soft"
                                        style={{ width: '29.7cm', height: '21cm', background: '#fff', transform: `translate(1cm, 1cm)`, transformOrigin: 'top left' }}>
                                    </div>
                                </div> */}
                                <Paper ref={paper} x={1} y={1} width={29.7} height={21} dpi={dpi} scale={scale}>
                                    {items.map((entry) => {
                                        return (
                                            <Box {...entry} dpi={dpi} scale={scale} edit={view === 'template'} style={{ overflow: 'hidden'}} >
                                                {entry.type === 'map'
                                                    ?
                                                    <Map
                                                        mapType="openlayers"
                                                        map={{
                                                            registerHooks: false,
                                                            projection: 'EPSG:3857',
                                                            center: {
                                                                x: -101.124,
                                                                y: 39.865,
                                                                crs: 'EPSG:4326'
                                                            }
                                                        }}
                                                        styleMap={{
                                                            position: 'absolute',
                                                            width: (entry.width * dpi) / INCHES_TO_CM,
                                                            height: (entry.height * dpi) / INCHES_TO_CM,
                                                            transform: `scale(${scale})`,
                                                            transformOrigin: 'top left'
                                                        }}
                                                        layers={[{
                                                            "format": "image/jpeg",
                                                            "group": "background",
                                                            "name": "osm:osm",
                                                            "opacity": 1,
                                                            "title": "OSM Bright",
                                                            "thumbURL": "product/assets/img/osm-bright.jpg",
                                                            "type": "wms",
                                                            "url": [
                                                                "https://maps1.geosolutionsgroup.com/geoserver/wms",
                                                                "https://maps2.geosolutionsgroup.com/geoserver/wms",
                                                                "https://maps3.geosolutionsgroup.com/geoserver/wms",
                                                                "https://maps4.geosolutionsgroup.com/geoserver/wms",
                                                                "https://maps5.geosolutionsgroup.com/geoserver/wms",
                                                                "https://maps6.geosolutionsgroup.com/geoserver/wms"
                                                            ],
                                                            "tileSize": 512,
                                                            "visibility": true,
                                                            "singleTile": false,
                                                            "credits": {
                                                                "title": "OSM Bright | Rendering <a href=\"https://www.geo-solutions.it/\">GeoSolutions</a> | Data © <a href=\"http://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"http://www.openstreetmap.org/copyright\">ODbL</a>"
                                                            }
                                                        }, {
                                                            "id": "gs:us_states__15",
                                                            "format": "image/vnd.jpeg-png8",
                                                            "search": {
                                                                "url": "https://gs-stable.geo-solutions.it/geoserver/wfs",
                                                                "type": "wfs"
                                                            },
                                                            "name": "gs:us_states",
                                                            "opacity": 1,
                                                            "description": "gfnhgfhgfhgfh",
                                                            "style": "pophade",
                                                            "title": "States of US",
                                                            "tiled": true,
                                                            "type": "wms",
                                                            "url": "https://gs-stable.geo-solutions.it/geoserver/wms",
                                                            "bbox": {
                                                                "crs": "EPSG:4326",
                                                                "bounds": {
                                                                    "minx": "-124.73142200000001",
                                                                    "miny": "24.955967",
                                                                    "maxx": "-66.969849",
                                                                    "maxy": "49.371735"
                                                                }
                                                            },
                                                            "visibility": true,
                                                            "singleTile": false,
                                                            "allowedSRS": {
                                                                "EPSG:3857": true,
                                                                "EPSG:900913": true,
                                                                "EPSG:4326": true
                                                            },
                                                            "dimensions": [],
                                                            "hideLoading": false,
                                                            "handleClickOnLayer": false,
                                                            "featureInfo": {
                                                                "format": "TEMPLATE",
                                                                "template": "<p><strong>STATE_NAME - ${properties.STATE_NAME}</strong></p><p><strong>SUB_REGION - ${properties.SUB_REGION }</strong></p><p><strong>STATE_ABBR - ${properties.STATE_ABBR }</strong></p><p><strong>LAND_KM - ${properties.LAND_KM }</strong></p>"
                                                            },
                                                            "catalogURL": null,
                                                            "useForElevation": false,
                                                            "hidden": false,
                                                            "legendOptions": {
                                                                "legendWidth": 100,
                                                                "legendHeight": 50
                                                            },
                                                            "tileSize": 512,
                                                            "version": "1.3.0",
                                                            "expanded": true,
                                                            "enableInteractiveLegend": true,
                                                            "enableDynamicLegend": true,
                                                            "params": {},
                                                            "localizedLayerStyles": true,
                                                            "disableFeaturesEditing": true
                                                        }]}
                                                    >
                                                        <SetResolutions dpi={dpi} scale={scale}/>
                                                    </Map>
                                                    : entry.type === 'text'
                                                        ? <div dangerouslySetInnerHTML={{ __html: entry.value }}></div>
                                                        : entry.type === 'image'
                                                            ? <img style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }} src={entry.src} />
                                                            : entry.type === 'table'
                                                                ? <Table geojson={entry.geojson} />
                                                                : entry.type === 'legend'
                                                                    ? <Legend layers={entry.layers}/>
                                                                    : entry.type === 'shape'
                                                                        ? <div className="_relative _fill" style={{ background: entry.background }} />
                                                                        : entry.type === 'resource'
                                                                            ? <div className="_relative _fill" style={{ background: `repeating-linear-gradient(
    45deg,
    tomato 0px,
    tomato 1px,
    transparent 1px,
    transparent 9px
  )` }} />
                                                                            : null}
                                            </Box>
                                        );
                                    })}
                                </Paper>
                            </div>
                            {/* MOVE IN RULER <div style={{ pointerEvents: 'none', height: '100%', width: 1, position: 'absolute', top: 0, left: position[0], background: 'red', userSelect: 'none' }}></div>
                            <div style={{ pointerEvents: 'none', width: '100%', height: 1, position: 'absolute', left: 0, top: position[1], background: 'red', userSelect: 'none' }}></div> */}
                        </FlexBox.Fill>
                    </FlexBox.Fill>
                    <FlexBox gap="xs" className="_padding-xs ms-main-colors" style={{ borderTop: '1px solid #ddd', zIndex: 0 }}>
                        {view === 'template' ? <Button size="sm">
                            Add new page
                        </Button> : null}
                        {type === 'geostory' ? <PaginationCustom
                            items={10}
                            activePage={2}
                            // onSelect={(value) => {
                            //     // setPage(value - 1);
                            // }}
                        /> : null}
                        <FlexBox.Fill></FlexBox.Fill>
                        <FlexBox gap="md" centerChildrenVertically className="_padding-xs" style={{  fontSize: '0.75rem', border: '1px solid #ddd', zIndex: 0, borderRadius: 4 }}>
                            <span>x : {position[2]?.toFixed(3)} cm</span>
                            <span>y : {position[3]?.toFixed(3)} cm</span>
                        </FlexBox>
                        <FormGroup>
                            <InputGroup>
                                <FormControl style={{  fontSize: '0.75rem', maxWidth: '8ch', textAlign: 'right' }} value={Math.round(scale * 100)} type="number"/>
                                <InputGroup.Addon>{'%'}</InputGroup.Addon>
                            </InputGroup>
                        </FormGroup>
                    </FlexBox>
                </FlexBox.Fill>
                <FlexBox column style={{ borderLeft: '1px solid #ddd', minWidth: 400, zIndex: 0 }} className="_padding-sm ms-main-colors">
                    <Tabs style={{ flex: 1, minHeight: 0, minWidth: 0 }} bsStyle="pills" className="ms-tabs tabs-underline">
                        {view === 'template' ? <Tab eventKey="template" title={'Template'}>
                            <FlexBox column  gap="sm" className="_padding-tb-md"  style={{ fontSize: '0.75rem' }}>
                                <FormGroup>
                                    <ControlLabel>
                                        Title
                                    </ControlLabel>
                                    <FormControl value="A4 Landscape"/>
                                    {/* <InputGroup>
                                        <Select
                                            clearable={false}
                                            value={{ value: 'A4 Landscape', label: 'A4 Landscape' }}
                                            options={[
                                                { value: 'A4 Portrait', label: 'A4 Portrait' },
                                                { value: 'A4 Landscape', label: 'A4 Landscape' },
                                                { value: 'A3 Portrait', label: 'A3 Portrait' },
                                                { value: 'A3 Landscape', label: 'A3 Landscape' }
                                            ]}/>
                                        <InputGroup.Addon className="btn" onClick={() => {
                                            setView('template');
                                            setTimeout(() => {
                                                setItems(itm[type]);
                                            }, 5);
                                        }}>
                                            <Glyphicon glyph="cog" />
                                        </InputGroup.Addon>
                                    </InputGroup> */}
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>
                                        Dimensions
                                    </ControlLabel>
                                    <Select
                                        clearable={false}
                                        value={{ value: 'A4', label: 'A4' }}
                                        options={[
                                            { value: 'A5', label: 'A5' },
                                            { value: 'A4', label: 'A4' },
                                            { value: 'A3', label: 'A3' },
                                            { value: 'A2', label: 'A2' }
                                        ]}/>
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>
                                        Orientation
                                    </ControlLabel>
                                    <Select clearable={false} value={{ value: 'landscape', label: 'Landscape' }} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]}/>
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>
                                        Default output resolution
                                    </ControlLabel>
                                    <Select clearable={false} value={{ value: '96 dpi', label: '96 dpi' }} options={[{ value: '96 dpi', label: '96 dpi' }, { value: '150 dpi', label: '150 dpi' }, { value: '300 dpi', label: '300 dpi' }]}/>
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>
                                        Default output format
                                    </ControlLabel>
                                    <Select
                                        clearable={false}
                                        value={{ value: 'PDF', label: 'PDF' }}
                                        options={[
                                            { value: 'PDF', label: 'PDF' },
                                            { value: 'PNG', label: 'PNG' },
                                            { value: 'JPEG', label: 'JPEG' }
                                        ]}/>
                                </FormGroup>
                            </FlexBox>
                        </Tab>
                            : <Tab eventKey="layout" title={'Layout'}>
                                <FlexBox column  gap="sm" className="_padding-tb-md"  style={{ fontSize: '0.75rem' }}>
                                    <FormGroup>
                                        <ControlLabel>
                                            Template
                                        </ControlLabel>
                                        <InputGroup>
                                            <Select
                                                clearable={false}
                                                value={{ value: 'A4 Landscape', label: 'A4 Landscape' }}
                                                options={[
                                                    { value: 'A4 Portrait', label: 'A4 Portrait' },
                                                    { value: 'A4 Landscape', label: 'A4 Landscape' },
                                                    { value: 'A3 Portrait', label: 'A3 Portrait' },
                                                    { value: 'A3 Landscape', label: 'A3 Landscape' }
                                                ]}/>
                                            <InputGroup.Addon className="btn" onClick={() => {
                                                setView('template');
                                                setTimeout(() => {
                                                    setItems(itm[type]);
                                                }, 5);
                                            }}>
                                                <Glyphicon glyph="plus" />
                                            </InputGroup.Addon>
                                            <InputGroup.Addon className="btn" onClick={() => {
                                                setView('template');
                                                setTimeout(() => {
                                                    setItems(itm[type]);
                                                }, 5);
                                            }}>
                                                <Glyphicon glyph="pencil" />
                                            </InputGroup.Addon>
                                            <InputGroup.Addon className="btn" onClick={() => {
                                                setView('template');
                                                setTimeout(() => {
                                                    setItems(itm[type]);
                                                }, 5);
                                            }}>
                                                <Glyphicon glyph="trash" />
                                            </InputGroup.Addon>
                                        </InputGroup>
                                    </FormGroup>
                                    {/* <FormGroup>
                                        <ControlLabel>
                                            Dimensions
                                        </ControlLabel>
                                        <Select
                                            disabled
                                            clearable={false}
                                            value={{ value: 'A4', label: 'A4' }}
                                            options={[
                                                { value: 'A5', label: 'A5' },
                                                { value: 'A4', label: 'A4' },
                                                { value: 'A3', label: 'A3' },
                                                { value: 'A2', label: 'A2' }
                                            ]}/>
                                    </FormGroup>
                                    <FormGroup>
                                        <ControlLabel>
                                            Orientation
                                        </ControlLabel>
                                        <Select disabled clearable={false} value={{ value: 'landscape', label: 'Landscape' }} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]}/>
                                    </FormGroup> */}
                                    <FormGroup>
                                        <ControlLabel>
                                            Output resolution
                                        </ControlLabel>
                                        <Select clearable={false} value={{ value: '96 dpi', label: '96 dpi' }} options={[{ value: '96 dpi', label: '96 dpi' }, { value: '150 dpi', label: '150 dpi' }, { value: '300 dpi', label: '300 dpi' }]}/>
                                    </FormGroup>
                                    <FormGroup>
                                        <ControlLabel>
                                            Output format
                                        </ControlLabel>
                                        <Select
                                            clearable={false}
                                            value={{ value: 'PDF', label: 'PDF' }}
                                            options={[
                                                { value: 'PDF', label: 'PDF' },
                                                { value: 'PNG', label: 'PNG' },
                                                { value: 'JPEG', label: 'JPEG' }
                                            ]}/>
                                    </FormGroup>
                                </FlexBox>
                            </Tab>}
                        <Tab eventKey="selected" title={'Selected'}>
                            {/* <FlexBox.Fill style={{ overflow: 'auto' }}>
                                <ControlledTOC
                                    // [
                                        //     {
                                        //         id: 'g-01',
                                        //         type: 'group',
                                        //         title: 'Header',
                                        //         nodes: [],
                                        //         expanded: false
                                        //     },
                                        //     {
                                        //         id: 'g-02',
                                        //         type: 'group',
                                        //         title: 'Body',
                                        //         nodes: items,
                                        //         visibility: true
                                        //     },
                                        //     {
                                        //         id: 'g-03',
                                        //         type: 'group',
                                        //         title: 'Footer',
                                        //         nodes: [],
                                        //         expanded: false
                                        //     },
                                        // ]
                                    tree={
                                        items
                                    }
                                    style={{ paddingLeft: 0, paddingRight: 0 }}
                                    selectedNodes={[{ id: '2' }]}
                                    nodeToolItems={[ { Component: () => <Glyphicon glyph="unlock" />, name: 'Lock' }]}
                                />
                            </FlexBox.Fill> */}
                            {/* <div style={{ borderBottom: '1px solid #ddd' }}></div> */}
                            <FlexBox.Fill  className="_padding-tb-md"  style={{ overflow: 'auto' }}>
                                <FlexBox column  gap="sm">
                                    {/* <div className="ms-main-colors _padding-t-md" style={{ zIndex: 10, position: 'sticky', top: 0 }}>Selected object: <strong>{items[1].title}</strong></div> */}
                                    <FlexBox column  gap="sm" style={{ fontSize: '0.75rem' }}>
                                        <FormGroup>
                                            <ControlLabel>
                                                Title
                                            </ControlLabel>
                                            <FormControl value={'Map'} type="text"/>
                                        </FormGroup>
                                    </FlexBox>
                                    <div/>
                                    <div>Configuration</div>
                                    <FlexBox column  gap="sm" style={{ fontSize: '0.75rem' }}>
                                        <FormGroup>
                                            <ControlLabel>
                                                Scale
                                            </ControlLabel>
                                            <InputGroup>
                                                <InputGroup.Addon>{'1 : '}</InputGroup.Addon>
                                                <FormControl value={10000} type="number"/>
                                                <InputGroup.Addon>{'cm'}</InputGroup.Addon>
                                            </InputGroup>
                                        </FormGroup>
                                        <FormGroup>
                                            <ControlLabel>
                                                Rotation
                                            </ControlLabel>
                                            <InputGroup>
                                                <FormControl value={0}  type="number"/>
                                                <InputGroup.Addon>{'deg'}</InputGroup.Addon>
                                            </InputGroup>
                                        </FormGroup>
                                        <FormGroup>
                                            <ControlLabel>
                                                Projection
                                            </ControlLabel>
                                            <Select
                                                clearable={false}
                                                value={{ value: 'EPSG:3857', label: 'EPSG:3857' }}
                                                options={[
                                                    { value: 'EPSG:4326', label: 'EPSG:4326' },
                                                    { value: 'EPSG:3857', label: 'EPSG:3857' }
                                                ]}/>
                                        </FormGroup>
                                        <Checkbox>Show graticule</Checkbox>
                                    </FlexBox>
                                    <div/>
                                    <div>Position and dimension</div>
                                    <FlexBox column  gap="sm" style={{ fontSize: '0.75rem' }}>
                                        <FlexBox centerChildrenVertically>
                                            <FlexBox.Fill column flexBox gap="sm" >
                                                <FormGroup>
                                                    <InputGroup>
                                                        <InputGroup.Addon>{'X'}</InputGroup.Addon>
                                                        <FormControl value={items[1].x} type="number"/>
                                                        <InputGroup.Addon>{'cm'}</InputGroup.Addon>
                                                    </InputGroup>
                                                </FormGroup>
                                                <FormGroup>
                                                    <InputGroup>
                                                        <InputGroup.Addon>{'Y'}</InputGroup.Addon>
                                                        <FormControl value={items[1].y} type="number"/>
                                                        <InputGroup.Addon>{'cm'}</InputGroup.Addon>
                                                    </InputGroup>
                                                </FormGroup>
                                            </FlexBox.Fill>
                                            <div style={{ marginRight: '0.5rem', position: 'relative', width: '1rem', height: '2.5rem', borderBottomRightRadius: '0.5rem', borderTopRightRadius: '0.5rem', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd' }}>
                                                <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translate(50%, -50%)' }}><Glyphicon glyph="unlock" /></div>
                                            </div>
                                        </FlexBox>
                                        <FlexBox centerChildrenVertically>
                                            <FlexBox.Fill column flexBox gap="sm" >
                                                <FormGroup>
                                                    <InputGroup>
                                                        <InputGroup.Addon>{'Width'}</InputGroup.Addon>
                                                        <FormControl value={items[1].width} type="number"/>
                                                        <InputGroup.Addon>{'cm'}</InputGroup.Addon>
                                                    </InputGroup>
                                                </FormGroup>
                                                <FormGroup>
                                                    <InputGroup>
                                                        <InputGroup.Addon>{'Height'}</InputGroup.Addon>
                                                        <FormControl value={items[1].height} type="number"/>
                                                        <InputGroup.Addon>{'cm'}</InputGroup.Addon>
                                                    </InputGroup>
                                                </FormGroup>
                                            </FlexBox.Fill>
                                            <div style={{ marginRight: '0.5rem', position: 'relative', width: '1rem', height: '2.5rem', borderBottomRightRadius: '0.5rem', borderTopRightRadius: '0.5rem', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd' }}>
                                                <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translate(50%, -50%)' }}><Glyphicon glyph="unlock" /></div>
                                            </div>
                                        </FlexBox>
                                    </FlexBox>
                                </FlexBox>
                            </FlexBox.Fill>
                        </Tab>
                        {view !== 'template' ? <Tab eventKey="atlas" title={'Atlas'}>

                        </Tab> : null}
                    </Tabs>
                </FlexBox>
            </FlexBox.Fill>
            <FlexBox  style={{ borderTop: '1px solid #ddd' }} className="_padding-xs" gap="sm" centerChildrenVertically>
                {view === 'template' ?<div>
                    <span style={{ '--tag-color': '#ebbc35' }}className="ms-tag"><Glyphicon glyph="pencil" />{' '}Editing template: A4 Landscape</span>
                </div> : null}
                
                <FlexBox.Fill></FlexBox.Fill>
                
                {view === 'template' ?
                <>
                    <Button size="sm" >
                    Close
                </Button>
                    <Button size="sm" variant="primary">
                    Save
                </Button>
                </>
                
                : <Button size="sm" variant="primary">
                    Print
                </Button>}
            </FlexBox>
        </FlexBox>
    );
};

const PrintPlugin = (props) => {
    return (
        <PortalComp>
            <div style={{ width: '100%', height: '100%', position: 'absolute', padding: '4rem', pointerEvents: 'none' }}>
                <div className="ms-main-colors shadow" style={{ pointerEvents: 'auto', width: 'calc(100% - 8rem)', height: 'calc(100% - 8rem)', position: 'absolute' }}>
                    <Print {...props} />
                </div>
            </div>
        </PortalComp>
    );
};

export default createPlugin('Print', {
    component: PrintPlugin,
    containers: {
        SidebarMenu: {
            name: "print",
            position: 3,
            tooltip: "printbutton",
            text: <Message msgId="printbutton"/>,
            icon: <Glyphicon glyph="print"/>,
            action: toggleControl.bind(null, 'print', null),
            doNotHide: true,
            toggle: true,
            priority: 2
        }
    }
});

// export default {
//     PrintPlugin: Object.assign({
//         loadPlugin: (resolve) => {
//             Promise.all([
//                 import('./print/index'),
//                 import('../utils/PrintUtils')
//             ]).then(([printMod, utilsMod]) => {

//                 const {
//                     standardItems
//                 } = printMod.default;

//                 const {
//                     getDefaultPrintingService,
//                     getLayoutName,
//                     getPrintScales,
//                     getNearestZoom
//                 } = utilsMod;
//                 class Print extends React.Component {
//                     static propTypes = {
//                         map: PropTypes.object,
//                         layers: PropTypes.array,
//                         capabilities: PropTypes.object,
//                         printSpec: PropTypes.object,
//                         printSpecTemplate: PropTypes.object,
//                         withContainer: PropTypes.bool,
//                         withPanelAsContainer: PropTypes.bool,
//                         open: PropTypes.bool,
//                         pdfUrl: PropTypes.string,
//                         title: PropTypes.string,
//                         style: PropTypes.object,
//                         mapWidth: PropTypes.number,
//                         mapType: PropTypes.string,
//                         alternatives: PropTypes.array,
//                         toggleControl: PropTypes.func,
//                         onBeforePrint: PropTypes.func,
//                         setPage: PropTypes.func,
//                         onPrint: PropTypes.func,
//                         printError: PropTypes.func,
//                         configurePrintMap: PropTypes.func,
//                         getLayoutName: PropTypes.func,
//                         error: PropTypes.string,
//                         getZoomForExtent: PropTypes.func,
//                         minZoom: PropTypes.number,
//                         maxZoom: PropTypes.number,
//                         usePreview: PropTypes.bool,
//                         mapPreviewOptions: PropTypes.object,
//                         syncMapPreview: PropTypes.bool,
//                         useFixedScales: PropTypes.bool,
//                         scales: PropTypes.array,
//                         ignoreLayers: PropTypes.array,
//                         defaultBackground: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
//                         closeGlyph: PropTypes.string,
//                         submitConfig: PropTypes.object,
//                         previewOptions: PropTypes.object,
//                         currentLocale: PropTypes.string,
//                         overrideOptions: PropTypes.object,
//                         items: PropTypes.array,
//                         excludeLayersFromLegend: PropTypes.array,
//                         mergeableParams: PropTypes.object,
//                         addPrintParameter: PropTypes.func,
//                         printingService: PropTypes.object,
//                         printMap: PropTypes.object
//                     };

//                     static contextTypes = {
//                         messages: PropTypes.object,
//                         plugins: PropTypes.object,
//                         loadedPlugins: PropTypes.object
//                     };

//                     static defaultProps = {
//                         withContainer: true,
//                         withPanelAsContainer: false,
//                         title: 'print.paneltitle',
//                         toggleControl: () => {},
//                         onBeforePrint: () => {},
//                         setPage: () => {},
//                         onPrint: () => {},
//                         configurePrintMap: () => {},
//                         printSpecTemplate: {},
//                         excludeLayersFromLegend: [],
//                         getLayoutName: getLayoutName,
//                         getZoomForExtent: defaultGetZoomForExtent,
//                         pdfUrl: null,
//                         mapWidth: 370,
//                         mapType: MapLibraries.OPENLAYERS,
//                         minZoom: 1,
//                         maxZoom: 23,
//                         usePreview: true,
//                         mapPreviewOptions: {
//                             enableScalebox: false,
//                             enableRefresh: true
//                         },
//                         syncMapPreview: false,      // make it false to prevent map sync
//                         useFixedScales: false,
//                         scales: [],
//                         ignoreLayers: ["google"],
//                         defaultBackground: ["osm", "wms", "empty"],
//                         closeGlyph: "1-close",
//                         submitConfig: {
//                             buttonConfig: {
//                                 bsSize: "small",
//                                 bsStyle: "primary"
//                             },
//                             glyph: ""
//                         },
//                         previewOptions: {
//                             buttonStyle: "primary"
//                         },
//                         style: {},
//                         currentLocale: 'en-US',
//                         overrideOptions: {},
//                         items: [],
//                         printingService: getDefaultPrintingService(),
//                         printMap: {},
//                         editScale: false
//                     };
//                     constructor(props) {
//                         super(props);
//                         // Calling configurePrintMap here to replace calling in in UNSAFE_componentWillMount
//                         this.configurePrintMap();
//                         this.state = {
//                             activeAccordionPanel: 0
//                         };
//                     }

//                     UNSAFE_componentWillReceiveProps(nextProps) {
//                         const hasBeenOpened = nextProps.open && !this.props.open;
//                         const mapHasChanged = this.props.open && this.props.syncMapPreview && mapUpdated(this.props.map, nextProps.map);
//                         const specHasChanged = (
//                             nextProps.printSpec.defaultBackground !== this.props.printSpec.defaultBackground ||
//                                 nextProps.printSpec.additionalLayers !== this.props.printSpec.additionalLayers
//                         );
//                         if (hasBeenOpened || mapHasChanged || specHasChanged) {
//                             this.configurePrintMap(nextProps);
//                         }
//                     }

//                     getAlternativeBackground = (layers, defaultBackground, projection) => {
//                         const allowedBackground = head(castArray(defaultBackground).map(type => ({
//                             type
//                         })).filter(l => this.isAllowed(l, projection)));
//                         if (allowedBackground) {
//                             return head(layers.filter(l => l.type === allowedBackground.type));
//                         }
//                         return null;
//                     };

//                     getItems = (target) => {
//                         const filtered = this.props.items.filter(i => !target || i.target === target);
//                         const merged = mergeItems(standardItems[target], this.props.items)
//                             .map(item => ({
//                                 ...item,
//                                 target
//                             }));
//                         return [...merged, ...filtered]
//                             .sort((i1, i2) => (i1.position ?? 0) - (i2.position ?? 0));
//                     };
//                     getMapConfiguration = () => {
//                         const map = this.props.printingService.getMapConfiguration();
//                         return {
//                             ...map,
//                             layers: this.filterLayers(map.layers, this.props.useFixedScales && !this.props.editScale ? map.scaleZoom : map.zoom, map.projection)
//                         };
//                     };
//                     getMapSize = (layout) => {
//                         const currentLayout = layout || this.getLayout();
//                         return {
//                             width: this.props.mapWidth,
//                             height: currentLayout && currentLayout.map.height / currentLayout.map.width * this.props.mapWidth || 270
//                         };
//                     };
//                     getPreviewResolution = (zoom, projection) => {
//                         const dpu = dpi2dpu(DEFAULT_SCREEN_DPI, projection);
//                         const roundZoom = Math.round(zoom);
//                         const scale = this.props.useFixedScales && !this.props.editScale
//                             ? getPrintScales(this.props.capabilities)[roundZoom]
//                             : this.props.scales[roundZoom];
//                         return scale / dpu;
//                     };
//                     getLayout = (props) => {
//                         const { getLayoutName: getLayoutNameProp, printSpec, capabilities } = props || this.props;
//                         const layoutName = getLayoutNameProp(printSpec);
//                         return head(capabilities.layouts.filter((l) => l.name === layoutName));
//                     };

//                     renderWarning = (layout) => {
//                         if (!layout) {
//                             return <Row><Col xs={12}><div className="print-warning"><span><Message msgId="print.layoutWarning"/></span></div></Col></Row>;
//                         }
//                         return null;
//                     };
//                     renderItem = (item, opts) => {
//                         const {validations, ...options } = opts;
//                         const Comp = item.component ?? item.plugin;
//                         const {style, ...other} = this.props;
//                         const itemOptions = this.props[item.id + "Options"];
//                         return <Comp role="body" {...other} {...item.cfg} {...options} {...itemOptions} validation={validations?.[item.id ?? item.name]}/>;
//                     };
//                     renderItems = (target, options) => {
//                         return this.getItems(target)
//                             .map(item => this.renderItem(item, options));
//                     };
//                     renderAccordion = (target, options) => {
//                         const items = this.getItems(target);
//                         return (<PanelGroup accordion activeKey={this.state.activeAccordionPanel} onSelect={(key) => {
//                             this.setState({
//                                 activeAccordionPanel: key
//                             });
//                         }}>
//                             {items.map((item, pos) => (
//                                 <Panel header={getMessageById(this.context.messages, item.cfg?.title ?? item.title ?? "")} eventKey={pos} collapsible>
//                                     {this.renderItem(item, options)}
//                                 </Panel>
//                             ))}
//                         </PanelGroup>);
//                     };
//                     renderPrintPanel = () => {
//                         const layout = this.getLayout();
//                         const map = this.getMapConfiguration();
//                         const options = {
//                             layout,
//                             map,
//                             layoutName: this.props.getLayoutName(this.props.printSpec),
//                             mapSize: this.getMapSize(layout),
//                             resolutions: getResolutions(map?.projection),
//                             onRefresh: () => this.configurePrintMap(),
//                             notAllowedLayers: this.isBackgroundIgnored(this.props.layers, map?.projection),
//                             actionConfig: this.props.submitConfig,
//                             validations: this.props.printingService.validate(),
//                             rotation: !isNil(this.props.printSpec.rotation) ? convertDegreesToRadian(Number(this.props.printSpec.rotation)) : 0,
//                             actions: {
//                                 print: this.print,
//                                 addParameter: this.addParameter
//                             }
//                         };
//                         return (
//                             <Grid fluid role="body">
//                                 {this.renderError()}
//                                 {this.renderWarning(layout)}
//                                 <Row>
//                                     <Col xs={12} md={6}>
//                                         {this.renderItems("left-panel", options)}
//                                         {this.renderAccordion("left-panel-accordion", options)}
//                                     </Col>
//                                     <Col xs={12} md={6} style={{textAlign: "center"}}>
//                                         {this.renderItems("right-panel", options)}
//                                         {this.renderItems("buttons", options)}
//                                         {this.renderDownload()}
//                                     </Col>
//                                 </Row>
//                             </Grid>
//                         );
//                     };

//                     renderDownload = () => {
//                         if (this.props.pdfUrl && !this.props.usePreview) {
//                             return <iframe src={this.props.pdfUrl} style={{visibility: "hidden", display: "none"}}/>;
//                         }
//                         return null;
//                     };

//                     renderError = () => {
//                         if (this.props.error) {
//                             return <Row><Col xs={12}><div className="print-error"><span>{this.props.error}</span></div></Col></Row>;
//                         }
//                         return null;
//                     };

//                     renderPreviewPanel = () => {
//                         return this.renderItems("preview-panel", this.props.previewOptions);
//                     };

//                     renderBody = () => {
//                         if (this.props.pdfUrl && this.props.usePreview) {
//                             return this.renderPreviewPanel();
//                         }
//                         return this.renderPrintPanel();
//                     };

//                     render() {
//                         if ((this.props.capabilities || this.props.error) && this.props.open) {
//                             if (this.props.withContainer) {
//                                 if (this.props.withPanelAsContainer) {
//                                     return (<Panel className="mapstore-print-panel" header={<span><span className="print-panel-title"><Message msgId="print.paneltitle"/></span><span className="print-panel-close panel-close" onClick={this.props.toggleControl}></span></span>} style={this.props.style}>
//                                         {this.renderBody()}
//                                     </Panel>);
//                                 }
//                                 return (<Dialog start={{x: 0, y: 80}} id="mapstore-print-panel" style={{ zIndex: 1990, ...this.props.style}}>
//                                     <FlexBox role="header" centerChildrenVertically gap="sm">
//                                         <FlexBox.Fill component={Text} ellipsis fontSize="md" className="print-panel-title _padding-lr-sm">
//                                             <Message msgId="print.paneltitle"/>
//                                         </FlexBox.Fill>
//                                         <Button onClick={this.props.toggleControl} square borderTransparent className="print-panel-close">
//                                             {this.props.closeGlyph ? <Glyphicon glyph={this.props.closeGlyph}/> : <span>×</span>}
//                                         </Button>
//                                     </FlexBox>
//                                     {this.renderBody()}
//                                 </Dialog>);
//                             }
//                             return this.renderBody();
//                         }
//                         return null;
//                     }
//                     addParameter = (name, value) => {
//                         this.props.addPrintParameter("params." + name, value);
//                     };
//                     isCompatibleWithSRS = (projection, layer) => {
//                         return projection === "EPSG:3857" || includes([
//                             "wms",
//                             "wfs",
//                             "vector",
//                             "graticule",
//                             "empty",
//                             "arcgis"
//                         ], layer.type) || layer.type === "wmts" && has(layer.allowedSRS, projection);
//                     };
//                     isAllowed = (layer, projection) => {
//                         return this.props.ignoreLayers.indexOf(layer.type) === -1 &&
//                             this.isCompatibleWithSRS(normalizeSRS(projection), layer);
//                     };

//                     isBackgroundIgnored = (layers, projection) => {
//                         const background = head((layers || this.props.layers)
//                             .filter(layer => layer.group === "background" && layer.visibility && this.isAllowed(layer, projection)));
//                         return !background;
//                     };
//                     filterLayers = (layers, zoom, projection) => {
//                         const resolution = this.getPreviewResolution(zoom, projection);

//                         const filtered = layers.filter((layer) =>
//                             layer.visibility &&
//                             isInsideResolutionsLimits(layer, resolution) &&
//                             this.isAllowed(layer, projection)
//                         );
//                         if (this.isBackgroundIgnored(layers, projection) && this.props.defaultBackground && this.props.printSpec.defaultBackground) {
//                             const defaultBackground = this.getAlternativeBackground(layers, this.props.defaultBackground);
//                             if (defaultBackground) {
//                                 return [{
//                                     ...defaultBackground,
//                                     visibility: true
//                                 }, ...filtered];
//                             }
//                             return filtered;
//                         }
//                         return filtered;
//                     };
//                     getRatio = () => {
//                         let mapPrintLayout = this.getLayout();
//                         if (this.props?.mapWidth && mapPrintLayout) {
//                             return getResolutionMultiplier(mapPrintLayout?.map?.width || 0, this?.props?.mapWidth || 0, this.props.printRatio);
//                         }
//                         return 1;
//                     };
//                     configurePrintMap = (props) => {
//                         const {
//                             map: newMap,
//                             capabilities,
//                             configurePrintMap: configurePrintMapProp,
//                             useFixedScales,
//                             currentLocale,
//                             layers,
//                             printMap,
//                             printSpec,
//                             editScale
//                         } = props || this.props;
//                         if (newMap && newMap.bbox && capabilities) {
//                             const selectedPrintProjection = (printSpec && printSpec?.params?.projection) || (printSpec && printSpec?.projection) || (printMap && printMap.projection) || 'EPSG:3857';
//                             const printSrs = normalizeSRS(selectedPrintProjection);
//                             const mapProjection = newMap.projection;
//                             const mapSrs = normalizeSRS(mapProjection);
//                             const zoom = reprojectZoom(newMap.zoom, mapSrs, printSrs);
//                             const scales = getPrintScales(capabilities);
//                             const printMapScales = getScales(printSrs);
//                             const scaleZoom = getNearestZoom(zoom, scales, printMapScales);
//                             if (useFixedScales && !editScale) {
//                                 const scale = scales[scaleZoom];
//                                 configurePrintMapProp(newMap.center, zoom, scaleZoom, scale,
//                                     layers, newMap.projection, currentLocale, useFixedScales);
//                             } else {
//                                 const scale = printMapScales[zoom];
//                                 let resolutions = getResolutions(printSrs).map((resolution) => resolution * this.getRatio());
//                                 const reqScaleZoom = editScale ? zoom : scaleZoom;
//                                 configurePrintMapProp(newMap.center, zoom, reqScaleZoom, scale,
//                                     layers, newMap.projection, currentLocale, useFixedScales, {
//                                         editScale,
//                                         mapResolution: resolutions[zoom]
//                                     });
//                             }
//                         }
//                     };

//                     print = () => {
//                         this.props.setPage(0);
//                         this.props.onBeforePrint();
//                         this.props.printingService.print({
//                             excludeLayersFromLegend: this.props.excludeLayersFromLegend,
//                             mergeableParams: this.props.mergeableParams,
//                             layers: this.getMapConfiguration()?.layers,
//                             scales: this.props.useFixedScales && !this.props.editScale ? getPrintScales(this.props.capabilities) : undefined,
//                             bbox: this.props.map?.bbox
//                         })
//                             .then((spec) =>
//                                 this.props.onPrint(this.props.capabilities.createURL, { ...spec, ...this.props.overrideOptions })
//                             )
//                             .catch(e => {
//                                 this.props.printError("Error in printing:" + e.message);
//                             });
//                     };
//                 }

//                 const selector = createSelector([
//                     (state) => state.controls.print && state.controls.print.enabled || state.controls.toolbar && state.controls.toolbar.active === 'print',
//                     (state) => state.print && state.print.capabilities,
//                     printSpecificationSelector,
//                     (state) => state.print && state.print.pdfUrl,
//                     (state) => state.print && state.print.error,
//                     mapSelector,
//                     layersSelector,
//                     additionalLayersSelector,
//                     scalesSelector,
//                     (state) => state.browser && (!state.browser.ie || state.browser.ie11),
//                     currentLocaleSelector,
//                     mapTypeSelector,
//                     (state) => state.print.map,
//                     rawGroupsSelector
//                 ], (open, capabilities, printSpec, pdfUrl, error, map, layers, additionalLayers, scales, usePreview, currentLocale, mapType, printMap, groups) => ({
//                     open,
//                     capabilities,
//                     printSpec,
//                     pdfUrl,
//                     error,
//                     map,
//                     layers: [
//                         ...getDerivedLayersVisibility(layers, groups).filter(filterLayer),
//                         ...(printSpec?.additionalLayers ? additionalLayers.map(l => l.options).filter(
//                             l => {
//                                 const isVector = l.type === 'vector';
//                                 const hasFeatures = Array.isArray(l.features) && l.features.length > 0;
//                                 return !l.loadingError && (!isVector || (isVector && hasFeatures));
//                             }
//                         ) : [])
//                     ],
//                     scales,
//                     usePreview,
//                     currentLocale,
//                     mapType,
//                     printMap
//                 }));

//                 const PrintPlugin = connect(selector, {
//                     toggleControl: toggleControl.bind(null, 'print', null),
//                     onPrint: printSubmit,
//                     printError: printError,
//                     onBeforePrint: printSubmitting,
//                     setPage: setControlProperty.bind(null, 'print', 'currentPage'),
//                     configurePrintMap,
//                     addPrintParameter
//                 })(Print);
//                 resolve(PrintPlugin);
//             });
//         },
//         enabler: (state) => state.print && state.print.enabled || state.toolbar && state.toolbar.active === 'print'
//     },
//     {
//         disablePluginIf: "{state('mapType') === 'cesium' || !state('printEnabled')}",
//         Toolbar: {
//             name: 'print',
//             position: 7,
//             help: <Message msgId="helptexts.print"/>,
//             tooltip: "printbutton",
//             icon: <Glyphicon glyph="print"/>,
//             exclusive: true,
//             panel: true,
//             priority: 1
//         },
//         BurgerMenu: {
//             name: 'print',
//             position: 2,
//             tooltip: "printToolTip",
//             text: <Message msgId="printbutton"/>,
//             icon: <Glyphicon glyph="print"/>,
//             action: toggleControl.bind(null, 'print', null),
//             priority: 3,
//             doNotHide: true
//         },
//         SidebarMenu: {
//             name: "print",
//             position: 3,
//             tooltip: "printbutton",
//             text: <Message msgId="printbutton"/>,
//             icon: <Glyphicon glyph="print"/>,
//             action: toggleControl.bind(null, 'print', null),
//             doNotHide: true,
//             toggle: true,
//             priority: 2
//         }
//     }),
//     reducers: {print: printReducers},
//     epics: {...printEpics}
// };
