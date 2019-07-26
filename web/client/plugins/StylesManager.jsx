/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import JSONTree from 'react-json-tree';
import BorderLayout from '../components/layout/BorderLayout';
// import Filter from '../components/misc/Filter';
import axios from 'axios';
import { getLayerFromId } from '../api/WFS3';
import { FormGroup, InputGroup, Glyphicon, FormControl } from 'react-bootstrap';
import { head, isObject } from 'lodash';
import Loader from '../components/misc/Loader';
import Toolbar from '../components/misc/toolbar/Toolbar';
import ResizableModal from '../components/misc/ResizableModal';

const theme = {
    scheme: 'monokai',
    author: 'wimer hazenberg (http://www.monokai.nl)',
    base00: '#000000',
    base01: '#383830',
    base02: '#49483e',
    base03: '#75715e',
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: '#f92672',
    base09: '#fd971f',
    base0A: '#f4bf75',
    base0B: '#a6e22e',
    base0C: '#a1efe4',
    base0D: '#66d9ef',
    base0E: '#ae81ff',
    base0F: '#cc6633'
};

/*
import Container from '../components/misc/Container';


import SLDParser from "geostyler-sld-parser";
import SideGrid from '../components/misc/cardgrids/SideGrid';
import SwitchButton from '../components/misc/switch/SwitchButton';
import ColorSelector from '../components/style/ColorSelector';
import tinycolor from 'tinycolor2';
import Slider from '../components/misc/Slider';
import { Glyphicon } from 'react-bootstrap';
import Editor from '../components/styleeditor/Editor';
import Loader from '../components/misc/Loader';
*/

// import SideGrid from '../components/misc/cardgrids/SideGrid';

import * as smEpics from '../epics/stylesmanager';

const ogcInitMapAction = (config) => ({
    type: 'OGC:INIT_MAP',
    config
});


class SearchInput extends Component {

    static propTypes = {
        service: PropTypes.string,
        onChange: PropTypes.func,
        loading: PropTypes.bool
    };

    state = {
        service: ''
    };

    componentWillMount() {
        this.setState({
            service: this.props.service
        });
    }

    render() {
        const { onChange = () => {}, loading } = this.props;
        const { service = '' } = this.state;
        return (
            <div
                style={{
                    padding: 8,
                    borderBottom: '1px solid #ddd',
                    width: '100%'
                }}>
                <div style={{ width: '50%', margin: 'auto' }}>
                    <FormGroup
                        controlId="service"
                        key="service">
                        <InputGroup>
                            <FormControl
                                value={service}
                                type="text"
                                placeholder="Enter style service..."
                                onChange={(event) => this.setState({ service: event.target.value })}/>
                            <InputGroup.Addon
                                className="btn"
                                onClick={() => loading ? () => {} : onChange(service)}>
                                {loading && <Loader size={19}/> || <Glyphicon glyph="search"/>}
                            </InputGroup.Addon>
                        </InputGroup>
                    </FormGroup>
                    {/*<Filter filterPlaceholder="Filter styles..."/>*/}
                </div>
            </div>
        );
    }
}

class StyleList extends Component {

    static propTypes = {
        onSelect: PropTypes.func,
        onInfo: PropTypes.func,
        styles: PropTypes.array
    };

    render() {
        const { onSelect = () => {}, styles = [], onInfo = () => {} } = this.props;
        return (
            <div
                style={{
                    position: 'absolute',
                    width: '100%',
                    display: 'flex',
                    flexWrap: 'wrap'
                }}>
                {styles.map((styleMetadata) => {
                    const { id, title, description, pointOfContact, error } = styleMetadata || {};
                    return (
                        <div
                            key={id}
                            style={{
                                padding: 8,
                                width: '25%'
                            }}>
                            <div
                                className="shadow-soft"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid #ddd',
                                    padding: 8,
                                    wordBreak: 'break-word'
                                }}
                                onClick={() => onSelect(styleMetadata)}>
                                <Toolbar
                                    btnDefaultProps={{
                                        className: 'square-button-md no-border'
                                    }}
                                    buttons={[
                                        {
                                            glyph: 'info-sign',
                                            tooltip: 'Show all style metadata',
                                            onClick: (event) => {
                                                event.stopPropagation();
                                                const { links, ...selected } = styleMetadata;
                                                onInfo(selected);
                                            }
                                        }
                                    ]}/>
                                <div style={{ backgroundColor: '#ddd', height: 200 }}>

                                </div>
                                <h4>{error && <Glyphicon glyph="exclamation-mark" className="text-danger"/>}{title || id}</h4>
                                <p>{description}</p>
                                <p>
                                    {pointOfContact && <div><small>by {pointOfContact}</small></div>}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}

class StylesManager extends Component {
    static propTypes = {
        onInit: PropTypes.func,
        styles: PropTypes.array
    };

    static defaultProps = {
        onInit: () => {},
        styles: [
            {
                "id": "night",
                "title": "Topographic night style",
                "description": "This topographic basemap style is designed to be \nused in situations with low ambient light. \n\nThe style supports datasets based on the TDS 6.1\nspecification.",
                "keywords": [
                    "basemap",
                    "TDS",
                    "TDS 6.1",
                    "OGC API"
                ],
                "pointOfContact": "John Doe",
                "accessConstraints": "unclassified",
                "dates": {
                    "creation": "2019-01-01T10:05:00Z",
                    "publication": "2019-01-01T11:05:00Z",
                    "revision": "2019-02-01T11:05:00Z",
                    "validTill": "2019-02-01T11:05:00Z",
                    "receivedOn": "2019-02-01T11:05:00Z"
                },
                "scope": "style",
                "version": "1.0.0",
                "stylesheets": [
                    {
                        "title": "Night_MBS",
                        "version": "8",
                        "specification": "https://docs.mapbox.com/mapbox-gl-js/style-spec/",
                        "native": true,
                        "tilingScheme": "GoogleMapsCompatible",
                        "link": {
                            "href": "/geoserver/vtp/wfs3/styles/Night_MBS?f=application%2Fvnd.geoserver.mbstyle%2Bjson",
                            "rel": "stylesheet",
                            "type": "application/vnd.mapbox.style+json"
                        }
                    },
                    {
                        "title": "Night_MBS",
                        "version": "1.0",
                        "native": false,
                        "link": {
                            "href": "/geoserver/vtp/wfs3/styles/Night_MBS?f=application%2Fvnd.ogc.sld%2Bxml",
                            "rel": "stylesheet",
                            "type": "application/vnd.ogc.sld+xml;version=1.0"
                        }
                    }
                ],
                "layers": [
                    {
                        "id": "AgricultureSrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/AgricultureSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        },
                        "attributes": [
                            {
                                "id": "F_CODE",
                                "type": "string"
                            }
                        ]
                    },
                    {
                        "id": "VegetationSrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/VegetationSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "SettlementSrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/SettlementSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "MilitarySrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/MilitarySrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "CultureSrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/CultureSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "HydrographyCrv",
                        "type": "line",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/HydrographyCrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "HydrographySrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/HydrographySrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "TransportationGroundCrv",
                        "type": "line",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/TransportationGroundCrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "UtilityInfrastructureCrv",
                        "type": "point",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/UtilityInfrastructureCrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "CulturePnt",
                        "type": "point",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/CulturePnt/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "StructurePnt",
                        "type": "point",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/StructurePnt/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "UtilityInfrastructurePnt",
                        "type": "point",
                        "sampleData": {
                            "href": "/geoserver/vtp/wfs3/collections/UtilityInfrastructurePnt/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    }
                ]
            },
            {
                "id": "omt-test",
                "title": "Test",
                "description": "...",
                "keywords": [
                    "basemap",
                    "OMT",
                    "OGC API"
                ],
                "pointOfContact": "John Doe",
                "accessConstraints": "unclassified",
                "dates": {
                    "creation": "2019-01-01T10:05:00Z",
                    "publication": "2019-01-01T11:05:00Z",
                    "revision": "2019-02-01T11:05:00Z",
                    "validTill": "2019-02-01T11:05:00Z",
                    "receivedOn": "2019-02-01T11:05:00Z"
                },
                "scope": "style",
                "version": "1.0.0",
                "stylesheets": [
                    {
                        "title": "omt-test",
                        "version": "1.0",
                        "native": true,
                        "link": {
                            "href": "/geoserver/openmaptiles/wfs3/styles/omt-test?f=application%2Fvnd.ogc.sld%2Bxml",
                            "rel": "stylesheet",
                            "type": "application/vnd.ogc.sld+xml;version=1.0"
                        }
                    }
                ],
                "layers": [
                    {
                        "id": "layer_water_z5",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/openmaptiles/wfs3/collections/layer_water_z5/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "layer_boundary_z5",
                        "type": "polygon",
                        "sampleData": {
                            "href": "/geoserver/openmaptiles/wfs3/collections/layer_boundary_z5/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    }
                ]
            }
        ]
    };

    state = {
        service: '/geoserver/ogc/styles',
        styles: [],
        loading: false
    };

    render() {
        return (
            <div
                className="ms-styles-manager"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    paddingTop: 60
                }}>
                <BorderLayout
                    header={<SearchInput
                        loading={this.state.loading}
                        service={this.state.service}
                        onChange={(service) => {
                            this.setState({
                                loading: true,
                                error: false
                            });
                            axios.get(service)
                                .then(({ data }) => {
                                    const { links = [] } = data;
                                    const apiUrl = head(links
                                        .filter(({ rel, type }) => rel === 'service' && type === 'application/json')
                                        .map(({ href }) => href));
                                    const conformanceUrl = head(links
                                        .filter(({ rel, type }) => rel === 'conformance' && type === 'application/json')
                                        .map(({ href }) => href));
                                    const dataUrl = head(links
                                        .filter(({ rel, type }) => rel === 'data' && type === 'application/json')
                                        .map(({ href }) => href));
                                    return [ apiUrl, conformanceUrl, dataUrl ];
                                })
                                .then((urls) => {
                                    return axios.all(urls.map(url =>
                                        axios.get(url)
                                            .then(({ data }) => data)
                                            .catch(() => null)
                                        )
                                    );
                                })
                                .then((res = []) => {
                                    const { styles } = res[2] || {};
                                    return styles ? styles : [];
                                })
                                .then((styles) => {
                                    return axios.all(
                                        styles.map((style) => {
                                            const describeBy = head(style.links
                                                .filter(({ rel, type }) => rel === 'describeBy' && type === 'application/json')
                                                .map(({ href }) => href));
                                            return describeBy
                                                ? axios.get(describeBy)
                                                    .then(({ data }) => ({ ...style, ...data }))
                                                    .catch(() => ({ ...style, error: true }))
                                                : null;
                                        }).filter(val => val)
                                    );
                                })
                                .then((styles) => {
                                    this.setState({
                                        styles,
                                        loading: false
                                    });
                                })
                                .catch(({ data }) => {
                                    this.setState({
                                        styles: [],
                                        loading: false,
                                        error: isObject(data) && data.description || 'Connection error'
                                    });
                                });
                        }}/>
                    }>
                    {this.state.error ? <div className="text-danger text-center" style={{ padding: 8 }}><Glyphicon glyph="exclamation-mark"/> {this.state.error}</div> : <StyleList
                        styles={[...this.props.styles, ...this.state.styles]}
                        onInfo={(styleMetadata) => this.setState({ selected: styleMetadata })}
                        onSelect={(styleMetadata) => {
                            this.parseStyle(styleMetadata);
                        }}/>}
                </BorderLayout>
                <ResizableModal
                    fade
                    fitContent
                    show={this.state.selected}
                    title={<span><Glyphicon glyph="info-sign"/> {this.state.selected && (this.state.selected.title || this.state.selected.id)}</span>}
                    onClose={() => this.setState({ selected: null })}>
                    <div style={{ padding: 8 }}>
                        {this.state.selected && <JSONTree
                            invertTheme
                            theme={theme}
                            data={this.state.selected}
                            hideRoot/>}
                    </div>
                </ResizableModal>
            </div>
        );
    }

    parseStyle = (styleMetadata) => {
        const { layers = [], stylesheets = [] } = styleMetadata || {};
        const stylesUrls = stylesheets
            .map(({ link }) => {
                return link && link.href;
            })
            .filter(val => val);
        const layersUrls = layers
            .map(({ id, sampleData }) => {
                const layerUrl = sampleData && sampleData.href && sampleData.href;
                return {
                    id,
                    layerUrl
                };
            })
            .filter(val => val);
        axios.all(
            [
                ...stylesUrls
                .map(
                    (url) => axios.get(url)
                        .then(({ data }) => data )
                        .catch(() => null )
                ),
                ...layersUrls.map(({ layerUrl, id }) =>
                    getLayerFromId(layerUrl, id)
                )
            ]
        )
        .then((response) => {
            this.props.onInit({
                styleMetadata,
                layers: response.filter((res, idx) => idx >= stylesUrls.length),
                styles: response.filter((res, idx) => idx < stylesUrls.length)
                    .map((styleBody, idx) => ({
                        ...stylesheets[idx],
                        styleBody
                    }))
            });
        });
    }
}

export const StylesManagerPlugin = connect(() => ({}), { onInit: ogcInitMapAction })(StylesManager);
export const reducers = {};
export const epics = smEpics;
