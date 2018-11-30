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
const { Grid, Row, Col } = require('react-bootstrap');
const ColorSelector = require('./ColorSelector');

const Slider = require('react-nouislider');
const Select = require('react-select');
const numberLocalizer = require('react-widgets/lib/localizers/simple-number');
numberLocalizer();
require('react-widgets/lib/less/react-widgets.less');
// const Message = require('../I18N/Message');
const { isNil, join } = require('lodash');
const tinycolor = require("tinycolor2");
const SwitchPanel = require('../misc/switch/SwitchPanel');
const OpacitySlider = require('../TOC/fragments/OpacitySlider');

class StylePolygon extends React.Component {
    static propTypes = {
        shapeStyle: PropTypes.object,
        width: PropTypes.number,
        setStyleParameter: PropTypes.func,
        switchPanelProps: PropTypes.object,
        getConfig: PropTypes.func
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        shapeStyle: {},
        setStyleParameter: () => { },
        switchPanelProps: {},
        getConfig: () => {}
    };

    state = {
        selectedMark: {
            label: 'Square',
            value: 'square',
            path: 'M10,10 L90,10 L90,90 L10,90Z'
        },
        pointType: 'symbol',
        marker: {
            value: 'square-cyan',
            label: 'cyan square',
            thumbnailStyle: {
                backgroundImage: "url(/dist/MapStore2/web/client/components/mapcontrols/annotations/img/markers_default.png)",
                backgroundPositionX: -182,
                backgroundPositionY: -46,
                cursor: "pointer",
                height: "46px",
                width: "36px"
            },
            icon: 'comment'
        }
    }

    renderMarkers = (markers, prefix = '') => {
        return markers.map((marker) => {
            if (marker.markers) {
                return (<div className={"mapstore-annotations-info-viewer-marker-group mapstore-annotations-info-viewer-marker-" + prefix + marker.name}>
                    {this.renderMarkers(marker.markers, marker.name + '-')}
                </div>);
            }
            return (
                <div onClick={() => {}}
                    className={"mapstore-annotations-info-viewer-marker mapstore-annotations-info-viewer-marker-" + prefix + marker.name +
                        (this.isCurrentStyle(marker) ? " mapstore-annotations-info-viewer-marker-selected" : "")} style={marker.thumbnailStyle} />);
        });
    };

    render() {

        const styleType = !!this.props.shapeStyle.MultiPoint ? "MultiPoint" : "Point";
        const otherStyleType = !this.props.shapeStyle.MultiPoint ? "MultiPoint" : "Point";

        const style = {
            color: '#333333',
            weight: 5,
            opacity: 1,
            strokeOpacity: 1,
            fillColor: '#dddddd',
            fillOpacity: 1,
            lineDash: [1, 0],
            ...(this.props.shapeStyle[styleType] || this.props.shapeStyle)
        };

        const styleRenderer = (option) => (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', paddingRight: 25 }}>
                <svg style={{ height: 25, width: '100%' }} viewBox="0 0 300 25"><path
                    stroke={'#333333'}
                    strokeWidth={5}
                    strokeDasharray={option.value}
                    d="M0 12.5, 300 12.5" /></svg>
            </div>);

        const iconRenderer = (option) => {
            return (<div style={{ display: 'flex', alignItems: 'center' }}><svg style={{ height: 25, width: 25 }} viewBox="0 0 100 100"><path
                stroke={'#333333'}
                fill={'none'}
                strokeWidth={5}
                d={option.path} /></svg><span style={{ flex: 1, paddingLeft: 4 }}> {option.label}</span></div>);
        };

        const glyphRenderer = (option) => (<div><span className={"fa fa-" + option.value} style={{padding: '0 10px'}}/><span> {option.label}</span></div>);

        return (<Grid fluid style={{ width: '100%' }} className="ms-style">
            {this.state.pointType === 'marker' && <SwitchPanel
                title="Point Style"
                expanded
                locked
                {...this.props.switchPanelProps}>
                <hr />
                <Row>
                    <Col xs={6}>
                        <strong>Type</strong>
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                        <Select
                            clearable={false}
                            options={[{
                                label: 'Marker',
                                value: 'marker'
                            }, {
                                label: 'Symbol',
                                value: 'symbol'
                            }]}
                            clearable={false}
                            value={this.state.pointType || 'symbol'}
                            onChange={({value}) => this.setState({ pointType: value})}
                        />
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col xs={6}><strong>Icon</strong></Col>
                    <Col xs={6} style={{ position: 'static' }}>
                    <Select
                        options={this.props.getConfig().glyphs.map(g => ({
                            label: g,
                            value: g
                        }))}
                        clearable={false}
                        optionRenderer={glyphRenderer}
                        valueRenderer={glyphRenderer}
                        value={'comment'}
                        onChange={({value}) => this.setState({ marker: {...this.state.marker, icon: value}})}/>
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col xs={12} style={{display: 'flex', justifyItems: 'center'}}>
                    <div style={{margin: 'auto'}}>
                        {this.renderMarkers(this.props.getConfig().markers)}
                    </div>
                    </Col>
                </Row>
                </SwitchPanel>}
            {this.state.pointType === 'symbol' && <SwitchPanel
                title="Point Style"
                expanded
                locked
                {...this.props.switchPanelProps}>
                <hr />
                <Row>
                    <Col xs={6}>
                        {/*<Message msgId="draw.fill"/>*/}
                        <strong>Type</strong>
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                        <Select
                            options={[{
                                label: 'Marker',
                                value: 'marker'
                            }, {
                                label: 'Symbol',
                                value: 'symbol'
                            }]}
                            clearable={false}
                            value={this.state.pointType || 'symbol'}
                            onChange={({value}) => this.setState({ pointType: value})}
                        />
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col xs={12}>
                        <div className="ms-marker-preview" style={{ display: 'flex', width: '100%', height: 104 }}>
                            <svg style={{ height: 104, width: 104, margin: 'auto' }} viewBox="0 0 100 100"><path
                                stroke={style.color}
                                strokeWidth={style.weight}
                                strokeOpacity={style.opacity}
                                fill={style.fillColor}
                                fillOpacity={style.fillOpacity}
                                strokeDasharray={style.lineDash}
                                d={this.state.selectedMark.path} />
                            </svg>
                        </div>
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col xs={12}>
                        <strong>Layout</strong>
                    </Col>
                </Row>
                <Row>
                    <Col xs={6}>
                        {/*<Message msgId="draw.fill"/>*/}
                        Shape
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                        <Select
                            options={[{
                                label: 'Square',
                                value: 'square',
                                path: 'M10,10 L90,10 L90,90 L10,90Z'
                            }, {
                                label: 'Triangle',
                                value: 'triangle',
                                path: 'M50,10 L90,90 L10,90Z'
                            }, {
                                label: 'Star',
                                value: 'star',
                                path: 'M 50.000,70.000 L76.450,86.406 L69.021,56.180 L92.798,36.094 L61.756,33.820 L50.000,5.000 L38.244,33.820 L7.202,36.094 L30.979,56.180 L23.550,86.406 L50.000,70.000Z'
                            }]}
                            clearable={false}
                            optionRenderer={iconRenderer}
                            valueRenderer={iconRenderer}
                            value={this.state.selectedMark.value}
                            onChange={selectedMark => this.setState({ selectedMark })}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col xs={6}>
                        {/*<Message msgId="draw.strokeWidth"/>*/}
                        Size
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                        <div className="mapstore-slider with-tooltip">
                            <Slider tooltips step={1}
                                start={[style.size || 32]}
                                format={{
                                    from: value => Math.round(value),
                                    to: value => Math.round(value) + ' px'
                                }}
                                range={{ min: 1, max: 128 }}
                                onChange={(values) => {
                                    const size = parseInt(values[0].replace(' px', ''), 10);
                                    const newStyle = assign({}, this.props.shapeStyle, {
                                        [styleType]: assign({}, style, { size }),
                                        [otherStyleType]: assign({}, style, { size })
                                    });
                                    this.props.setStyleParameter(newStyle);
                                }}
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
                    <Col xs={6} style={{ position: 'static' }}>
                        <ColorSelector key="poly-fill" color={this.addOpacityToColor(tinycolor(style.fillColor).toRgb(), style.fillOpacity)} width={this.props.width} onChangeColor={c => {
                            if (!isNil(c)) {
                                const fillColor = tinycolor(c).toHexString();
                                const fillOpacity = c.a;
                                const newStyle = assign({}, this.props.shapeStyle, {
                                    [styleType]: assign({}, style, { fillColor, fillOpacity }),
                                    [otherStyleType]: assign({}, style, { fillColor, fillOpacity })
                                });
                                this.props.setStyleParameter(newStyle);
                            }
                        }} />
                    </Col>
                </Row>
                <Row>
                    <Col xs={6}>
                        Opacity
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                    <OpacitySlider
                                    opacity={style.fillOpacity}
                                    onChange={(fillOpacity) => {
                                        const newStyle = assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {fillOpacity}),
                                            [otherStyleType]: assign({}, style, {fillOpacity})
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
                    <Col xs={6} style={{ position: 'static' }}>
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
                            value={join(style.lineDash, ', ')}
                            onChange={({ value }) => {
                                const lineDash = value.split(', ');
                                this.props.setStyleParameter(assign({}, this.props.shapeStyle, {
                                    [styleType]: assign({}, style, { lineDash }),
                                    [otherStyleType]: assign({}, style, { lineDash })
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
                    <Col xs={6} style={{ position: 'static' }}>
                        <ColorSelector color={this.addOpacityToColor(tinycolor(style.color).toRgb(), style.opacity)} width={this.props.width} onChangeColor={c => {
                            if (!isNil(c)) {
                                const color = tinycolor(c).toHexString();
                                const opacity = c.a;
                                const newStyle = assign({}, this.props.shapeStyle, {
                                    [styleType]: assign({}, style, { color, opacity }),
                                    [otherStyleType]: assign({}, style, { color, opacity })
                                });
                                this.props.setStyleParameter(newStyle);
                            }
                        }} />
                    </Col>
                </Row>
                <Row>
                    <Col xs={6}>
                        Opacity
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                        <div className="mapstore-slider with-tooltip">
                            <OpacitySlider
                                    opacity={style.opacity}
                                    onChange={(opacity) => {
                                        const newStyle = assign({}, this.props.shapeStyle, {
                                            [styleType]: assign({}, style, {opacity}),
                                            [otherStyleType]: assign({}, style, {opacity})
                                        });
                                        this.props.setStyleParameter(newStyle);
                                    }}/>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={6}>
                        {/*<Message msgId="draw.strokeWidth"/>*/}
                        Width
                            </Col>
                    <Col xs={6} style={{ position: 'static' }}>
                        <div className="mapstore-slider with-tooltip">
                            <Slider tooltips step={1}
                                start={[style.weight || 5]}
                                format={{
                                    from: value => Math.round(value),
                                    to: value => Math.round(value) + ' px'
                                }}
                                range={{ min: 1, max: 15 }}
                                onChange={(values) => {
                                    const weight = parseInt(values[0].replace(' px', ''), 10);
                                    const newStyle = assign({}, this.props.shapeStyle, {
                                        [styleType]: assign({}, style, { weight }),
                                        [otherStyleType]: assign({}, style, { weight })
                                    });
                                    this.props.setStyleParameter(newStyle);
                                }}
                            />
                        </div>
                    </Col>
                </Row>
            </SwitchPanel>}
        </Grid>);
    }
    addOpacityToColor = (color, opacity) => {
        return assign({}, color, {
            a: opacity
        });
    }

    isCurrentStyle = (m) => {
        return this.props.getConfig().markersConfig.matches(this.props.shapeStyle.MultiPoint || this.props.shapeStyle, m.style);
    };
}

module.exports = StylePolygon;
