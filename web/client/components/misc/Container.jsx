/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 'react-resizable';
import Draggable from 'react-draggable';

class Container extends React.Component {
    static propTypes = {
        layout: PropTypes.bool
    };

    static defaultProps = {
        layout: false
    };

    state = {
        width: 300,
        height: 400
    };

    onResize = (event, { size }) => {
        this.setState({
            width: size.width,
            height: size.height
        });
    };

    render() {
        return this.props.layout
            ? <div style={{ position: 'absolute', width: '100%', height: '100%' }}>{this.props.children}</div>
            : (
                <Draggable
                    axis="both"
                    handle=".ms-handle"
                    defaultPosition={{x: 0, y: 0}}
                    position={null}
                    scale={1}>
                    <Resizable
                        height={this.state.height}
                        width={this.state.width}
                        onResize={this.onResize}>
                        <div
                            className="shadow-soft"
                            style={{
                                position: 'absolute',
                                top: 'calc(50% - 150px)',
                                left: 'calc(50% - 200px)',
                                width: this.state.width,
                                height: this.state.height,
                                backgroundColor: '#fff',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                            <div className="ms-handle" style={{
                                backgroundColor: '#000',
                                height: 10
                            }}></div>
                            <div style={{ flex: 1 }}>
                                {this.props.children}
                            </div>
                        </div>
                    </Resizable>
                </Draggable>
            );
    }
}

export default Container;
