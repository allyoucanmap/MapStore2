/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';
import Draggable from 'react-draggable';
import { FormGroup, FormControl, Glyphicon } from 'react-bootstrap';
import Toolbar from '../components/misc/toolbar/Toolbar';
import axios from '../libs/ajax';
import { addLayer } from '../actions/layers';

const parseCollection = function(collection) {
    const [minx, miny, maxx, maxy] = get(collection, 'extent.spatial') || [];
    const links = get(collection, 'links') || [];
    const url = links
        .filter(({ rel, type }) => rel === 'tiles' && type === 'application/vnd.mapbox-vector-tile')
        .map(({ href }) => href)[0];
    const availableStyles = links
        .filter(({ rel, type }) => rel === 'styles' && type === 'application/json')
        .map(({ href }) => href)[0];
    return {
        type: 'wfs3',
        name: collection.name,
        title: collection.title,
        url,
        availableStyles,
        bbox: {
            minx,
            miny,
            maxx,
            maxy,
            crs: 'EPSG:4326'
        }
    };
};

class Collections extends React.Component {
    static propTypes = {
        addLayer: PropTypes.func
    };

    static defaultProps = {
        addLayer: () => { }
    };

    state = {
        url: '',
        service: 'wfs3'
    };

    render() {
        return this.state.hide ? null : (
            <Draggable
                axis="both"
                handle=".handle"
                defaultPosition={{ x: 0, y: 0 }}
                position={null}
                grid={[25, 25]}
                scale={1}>
                <div
                    className="shadow-far"
                    style={{
                        backgroundColor: '#fff',
                        position: 'absolute',
                        top: 'calc(50% - 32px)',
                        left: 'calc(50% - 256px)',
                        padding: 16,
                        width: 512,
                        height: 64,
                        display: 'flex'
                    }}>
                    <div
                        className="handle"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            paddingRight: 8
                        }}>
                        <Glyphicon glyph="move" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <FormGroup style={{ margin: 0 }}>
                            <FormControl
                                type="text"
                                disabled={this.state.loading}
                                value={this.state.url}
                                onChange={(event) =>
                                    this.setState({
                                        url: event.target.value
                                    })
                                } />
                        </FormGroup>
                    </div>
                    <Toolbar
                        btnGroupProps={{
                            style: {
                                alignSelf: 'center',
                                paddingLeft: 8
                            }
                        }}
                        btnDefaultProps={{
                            className: 'square-button-md',
                            bsStyle: 'primary'
                        }}
                        buttons={[
                            {
                                glyph: 'plus',
                                loading: this.state.loading,
                                onClick: () => this.addService()
                            }
                        ]} />
                </div>
            </Draggable>
        );
    }

    addService = () => {
        this.setState({ loading: true });
        axios.get(this.state.url)
            .then(({ data }) => {
                if (this.state.service === 'wfs3') {
                    const apiHref = (get(data, 'links') || [])
                        .filter((link) =>
                            link.rel === 'service'
                            && link.type === 'application/json')
                        .map(({ href }) => href)[0];
                    return axios.get(apiHref)
                        .then(({ data: apiData }) => {
                            const requestPaths = {
                                '/collections': true,
                                '/styles': true
                            };
                            const paths = Object.keys(apiData.paths || {})
                                .filter(key => requestPaths[key]);
                            return axios.all(
                                paths.map(path =>
                                    axios.get(`${this.state.url}${path}`)
                                        .then(({ data: resData }) => resData)
                                        .catch(() => null)
                                )
                            )
                                .then((responses) => {

                                    const availableStyles = (get(responses, '[1].styles') || []).filter(({ links }) => {

                                        return links.filter((link) => link.type.indexOf('mbstyle') !== -1)[0];
                                    });
                                    const collections = (get(responses, '[0].collections') || []).map(collection => parseCollection(collection));

                                    this.props.addLayer({
                                        type: 'collection',
                                        service: 'wfs3',
                                        title: 'WFS3 Collection',
                                        name: this.state.url,
                                        availableStyles,
                                        collections,
                                        visibility: true,
                                        url: this.state.url,
                                        paths: apiData.paths
                                    });

                                    this.setState({ loading: false, hide: true });
                                });
                        })
                        .catch(() => this.setState({ loading: false }));
                }
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };
}

export const CollectionsPlugin = connect(() => ({}), { addLayer })(Collections);
export const reducers = {};
