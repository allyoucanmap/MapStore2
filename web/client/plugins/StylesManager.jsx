/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import BorderLayout from '../components/layout/BorderLayout';
import Filter from '../components/misc/Filter';
import { Grid } from 'react-bootstrap';
/*
import Container from '../components/misc/Container';

import Toolbar from '../components/misc/toolbar/Toolbar';
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

import SideGrid from '../components/misc/cardgrids/SideGrid';


class StylesManager extends Component {
    static propTypes = {
        styles: PropTypes.array
    };

    static defaultProps = {
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
                        "title": "Mapbox Style",
                        "version": "8",
                        "specification": "https://docs.mapbox.com/mapbox-gl-js/style-spec/",
                        "native": true,
                        "tilingScheme": "GoogleMapsCompatible",
                        "link": {
                            "href": "https://example.org/catalog/1.0/styles/night?f=mapbox",
                            "rel": "stylesheet",
                            "type": "application/vnd.mapbox.style+json"
                        }
                    },
                    {
                        "title": "OGC SLD",
                        "version": "1.0",
                        "native": false,
                        "link": {
                            "href": "https://example.org/catalog/1.0/styles/night?f=sld10",
                            "rel": "stylesheet",
                            "type": "application/vnd.ogc.sld+xml;version=1.0"
                        }
                    }
                ],
                "layers": [
                    {
                        "id": "vegetationsrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "https://services.interactive-instruments.de/vtp/daraa/collections/vegetationsrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "hydrographycrv",
                        "type": "line",
                        "sampleData": {
                            "href": "https://services.interactive-instruments.de/vtp/daraa/collections/hydrographycrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        },
                        "attributes": [
                            {
                                "id": "f_code",
                                "type": "string"
                            }
                        ]
                    }
                ]
            },
            {
                "id": "topo",
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
                        "title": "Mapbox Style",
                        "version": "8",
                        "specification": "https://docs.mapbox.com/mapbox-gl-js/style-spec/",
                        "native": true,
                        "tilingScheme": "GoogleMapsCompatible",
                        "link": {
                            "href": "https://example.org/catalog/1.0/styles/night?f=mapbox",
                            "rel": "stylesheet",
                            "type": "application/vnd.mapbox.style+json"
                        }
                    },
                    {
                        "title": "OGC SLD",
                        "version": "1.0",
                        "native": false,
                        "link": {
                            "href": "https://example.org/catalog/1.0/styles/night?f=sld10",
                            "rel": "stylesheet",
                            "type": "application/vnd.ogc.sld+xml;version=1.0"
                        }
                    }
                ],
"layers": [
    {
        "id": "satellite",
        "type": "raster",
        ...
    },
    {
        "id": "daraa_vtp",
        "type": "tileset",
        "layers": [
            ...
        ],
        "sampleData": {
            ...
        }
    },
    {
        "id": "overlay-features",
        "type": "polygon",
        ...
    },


                    {
                        "id": "vegetationsrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "https://services.interactive-instruments.de/vtp/daraa/collections/vegetationsrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    
                    {
                        "id": "hydrographycrv",
                        "type": "line",
                        "sampleData": {
                            "href": "https://services.interactive-instruments.de/vtp/daraa/collections/hydrographycrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        },
                        "attributes": [
                            {
                                "id": "f_code",
                                "type": "string"
                            }
                        ]
                    }
                ]
            }
        ]
    };

    state = {};

    render() {
        return (
            <div
                className="ms-styles-manager"
                style={{
                    position: 'absolute',
                    width: '50%',
                    height: '100%',
                    top: 0,
                    paddingTop: 60,
                    marginLeft: '25%'
                }}>
                <BorderLayout
                    header={
                        <div
                            style={{
                                margin: 8,
                                paddingBottom: 8,
                                borderBottom: '1px solid #ddd'
                            }}>
                            <Filter
                                filterPlaceholder="Filter styles..."/>
                        </div>
                    }>
                    <SideGrid
                        cardComponent={({ id, title, description, pointOfContact }) => {
                            return (
                                <div
                                    key={id}
                                    style={{
                                        margin: 4,
                                        padding: 8,
                                        border: '1px solid #ddd'
                                    }}>
                                    <div style={{ display: 'flex' }}>
                                        <div>
                                            <div style={{ width: 64, height: 64, backgroundColor: '#ddd', marginRight: 8, marginTop: 8 }}></div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4><strong>{title}</strong></h4>
                                            <p>{description}</p>
                                            <p>
                                                <div><small>id: {id}</small></div>
                                                <div><small>point of contact: {pointOfContact}</small></div>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                        items={
                            this.props.styles
                                .map(({ id, title, description, pointOfContact }) => {
                                    return {
                                        id,
                                        title,
                                        description,
                                        caption: id,
                                        pointOfContact
                                    };
                                })
                        } />
                </BorderLayout>
            </div>
        );

    }
}

export const StylesManagerPlugin = StylesManager;
export const reducers = {};
