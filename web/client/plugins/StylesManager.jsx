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
import BorderLayout from '../components/layout/BorderLayout';
import Filter from '../components/misc/Filter';
import axios from 'axios';

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

import * as smEpics from '../epics/stylesmanager';

const ogcInitMapAction = (config) => ({
    type: 'OGC:INIT_MAP',
    config
});


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
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/styles/Night_MBS?f=application%2Fvnd.geoserver.mbstyle%2Bjson",
                            "rel": "stylesheet",
                            "type": "application/vnd.mapbox.style+json"
                        }
                    },
                    {
                        "title": "Night_MBS",
                        "version": "1.0",
                        "native": false,
                        "link": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/styles/Night_MBS?f=application%2Fvnd.ogc.sld%2Bxml",
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
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/AgricultureSrf/items?f=json&limit=100",
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
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/VegetationSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "SettlementSrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/SettlementSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "MilitarySrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/MilitarySrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "CultureSrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/CultureSrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "HydrographyCrv",
                        "type": "line",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/HydrographyCrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "HydrographySrf",
                        "type": "polygon",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/HydrographySrf/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "TransportationGroundCrv",
                        "type": "line",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/TransportationGroundCrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "UtilityInfrastructureCrv",
                        "type": "point",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/UtilityInfrastructureCrv/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "CulturePnt",
                        "type": "point",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/CulturePnt/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "StructurePnt",
                        "type": "point",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/StructurePnt/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    },
                    {
                        "id": "UtilityInfrastructurePnt",
                        "type": "point",
                        "sampleData": {
                            "href": "http://localhost:8080/geoserver/vtp/wfs3/collections/UtilityInfrastructurePnt/items?f=json&limit=100",
                            "rel": "data",
                            "type": "application/geo+json"
                        }
                    }
                ]
            }
        ]
    };

    state = {
        service: 'http://localhost:8080/geoserver/vtp/wfs3'
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
                    header={
                        <div
                            style={{
                                margin: 8,
                                paddingBottom: 8,
                                borderBottom: '1px solid #ddd',
                                width: '50%',
                                marginLeft: '25%'
                            }}>
                            {/*<h2 contentEditable>{this.state.service}</h2>*/}
                            <Filter
                                filterPlaceholder="Filter styles..."/>
                        </div>
                    }>
                    <div
                        style={{
                            position: 'absolute',
                            width: '50%',
                            marginLeft: '25%'
                        }}>
                        <SideGrid
                            cardComponent={(style) => {
                                const { id, title, description, pointOfContact, onClick } = style || {};
                                return (
                                    <div
                                        key={id}
                                        style={{
                                            margin: 4,
                                            padding: 8,
                                            border: '1px solid #ddd'
                                        }}
                                        onClick={onClick}>
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
                                    .map((styleMetadata) => {
                                        const { id, title, description, pointOfContact } = styleMetadata || {};
                                        return {
                                            id,
                                            title,
                                            description,
                                            caption: id,
                                            pointOfContact,
                                            onClick: () => this.parseStyle(styleMetadata)
                                        };
                                    })
                            } />
                    </div>
                </BorderLayout>
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
            .map(({ sampleData }) => {
                const layerUrl = sampleData && sampleData.href && sampleData.href.split('items')[0];
                return layerUrl;
            })
            .filter(val => val);
        axios.all(
            [ ...stylesUrls, ...layersUrls]
                .map(
                    (url) => axios.get(url)
                        .then(({ data }) => data )
                        .catch(() => null )
                )
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
