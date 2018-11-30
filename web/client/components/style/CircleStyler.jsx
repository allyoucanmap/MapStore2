/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const PropTypes = require('prop-types');
const React = require('react');
const assign = require('object-assign');
const {Grid, Row, Col} = require('react-bootstrap');
const ColorSelector = require('./ColorSelector');
const StyleCanvas = require('./StyleCanvas');
const Slider = require('react-nouislider');
const numberLocalizer = require('react-widgets/lib/localizers/simple-number');
numberLocalizer();
require('react-widgets/lib/less/react-widgets.less');
const {isNil, join} = require('lodash');
// const Message = require('../I18N/Message');
const tinycolor = require("tinycolor2");
const SwitchPanel = require('../misc/switch/SwitchPanel');
const Select = require('react-select');
const MarkerStyler = require('./MarkerStyler');
const OpacitySlider = require('../TOC/fragments/OpacitySlider');

class StylePolygon extends React.Component {
    static propTypes = {
        shapeStyle: PropTypes.object,
        width: PropTypes.number,
        setStyleParameter: PropTypes.func
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        shapeStyle: {},
        setStyleParameter: () => {}
    };

    state = {};

    render() {
        const styleType = "Circle";
        const style = this.props.shapeStyle[styleType] || this.props.shapeStyle; // in case of old version of style.

        const styleRenderer = (option) => (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingRight: 25 }}>
                <svg style={{ height: 25, width: '100%' }} viewBox="0 0 300 25"><path
                    stroke={'#333333'}
                    strokeWidth={5}
                    strokeDasharray={option.value}
                    d="M0 12.5, 300 12.5" /></svg>
            </div>);

        return (<span><Grid fluid style={{ width: '100%' }} className="ms-style">
                <SwitchPanel
                    title="Circle Style"
                    locked
                    expanded>
                    <Row>
                        <Col xs={12}>
                            <div className="ms-marker-preview" style={{display: 'flex', width: '100%', height: 104}}>
                                <StyleCanvas style={{ padding: 0, margin: "auto", display: "block"}}
                                    shapeStyle={assign({}, style, {
                                        color: this.addOpacityToColor(tinycolor(style.color).toRgb(), style.opacity),
                                        fill: this.addOpacityToColor(tinycolor(style.fillColor).toRgb(), style.fillOpacity),
                                        radius: 30
                                    })}
                                    geomType="Point"
                                />
                            </div>
                        </Col>
                    </Row>
                    <hr />
                <Row>
                    <Col xs={12}>
                        <strong>Fill</strong>
                    </Col>
                </Row>
                        <Row>
                            <Col xs={6}>
                                {/*<Message msgId="draw.fill"/>*/}
                                Color
                            </Col>
                            <Col xs={6} style={{position: 'static'}}>
                                <ColorSelector key="poly-fill" color={this.addOpacityToColor(tinycolor(style.fillColor).toRgb(), style.fillOpacity)} width={this.props.width} onChangeColor={c => {
                                    if (!isNil(c)) {
                                        const fillColor = tinycolor(c).toHexString();
                                        const fillOpacity = c.a;
                                        const newStyle = assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {fillColor, fillOpacity})
                                        });
                                        this.props.setStyleParameter(newStyle);
                                    }
                                }}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6}>
                                Opacity
                            </Col>
                            <Col xs={6} style={{position: 'static'}}>
                            <OpacitySlider
                                    opacity={style.fillOpacity}
                                    onChange={(fillOpacity) => {
                                        const newStyle = assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {fillOpacity})
                                        });
                                        this.props.setStyleParameter(newStyle);
                                    }}/>
                            </Col>
                        </Row>


                        <hr />
                <Row>
                    <Col xs={12}>
                        <strong>Stroke</strong>
                    </Col>
                </Row>
                        <Row>
                            <Col xs={6}>
                                {/*<Message msgId="draw.fill"/>*/}
                                Style
                            </Col>
                            <Col xs={6} style={{position: 'static'}}>
                                <Select
                                    options={[{
                                        value: '1, 0'
                                    }, {
                                        value: '10, 50, 20'
                                    }, {
                                        value: '30, 20'
                                    }]}
                                    menuPlacement="top"
                                    clearable={false}
                                    optionRenderer={styleRenderer}
                                    valueRenderer={styleRenderer}
                                    value={join(style.lineDash, ', ') || '1, 0'}
                                    onChange={({value}) => {
                                        const lineDash = value.split(', ');
                                        this.props.setStyleParameter(assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {lineDash})
                                        }));
                                    }}
                                    />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6}>
                                {/*<Message msgId="draw.stroke"/>*/}
                                Color
                            </Col>
                            <Col xs={6} style={{position: 'static'}}>
                                <ColorSelector color={this.addOpacityToColor(tinycolor(style.color).toRgb(), style.opacity)} width={this.props.width} onChangeColor={c => {
                                    if (!isNil(c)) {
                                        const color = tinycolor(c).toHexString();
                                        const opacity = c.a;
                                        const newStyle = assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {color, opacity})
                                        });
                                        this.props.setStyleParameter(newStyle);
                                    }
                                }}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6}>
                                Opacity
                            </Col>
                            <Col xs={6} style={{position: 'static'}}>
                            <OpacitySlider
                                    opacity={style.opacity}
                                    onChange={(opacity) => {
                                        const newStyle = assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {opacity})
                                        });
                                        this.props.setStyleParameter(newStyle);
                                    }}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6}>
                                {/*<Message msgId="draw.strokeWidth"/>*/}
                                Width
                            </Col>
                            <Col xs={6} style={{position: 'static'}}>
                                <div className="mapstore-slider with-tooltip">
                                    <Slider tooltips step={1}
                                        start={[style.weight]}
                                        format={{
                                            from: value => Math.round(value),
                                            to: value => Math.round(value) + ' px'
                                        }}
                                        range={{min: 1, max: 15}}
                                        onChange={(values) => {
                                            const weight = parseInt(values[0].replace(' px', ''), 10);
                                            const newStyle = assign({}, this.props.shapeStyle, {
                                                [styleType]: assign({}, style, {weight})
                                            });
                                            this.props.setStyleParameter(newStyle);
                                        }}
                                    />
                                    </div>
                            </Col>
                        </Row>
                    </SwitchPanel>
                </Grid>
                <MarkerStyler
                    {...this.props}
                    switchPanelProps={
                        {
                            title: 'Center Style',
                            expanded: this.state.centerPoint,
                            onSwitch: () => this.setState({centerPoint: !this.state.centerPoint}),
                            locked: false
                        }
                    }/>
            </span>);
    }
    addOpacityToColor = (color, opacity) => {
        return assign({}, color, {
            a: opacity
        });
    }
}

module.exports = StylePolygon;
