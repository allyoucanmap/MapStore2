/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const PropTypes = require('prop-types');
const React = require('react');
const {Row, Col} = require('react-bootstrap');
const Select = require('react-select').default;

const Message = require('../../../I18N/Message');
const Filter = require('../../../misc/Filter');
const StyleField = require('../StyleField').default;
const PropertyPicker = require('../../PropertyPicker').default;
/**
 * Styler for the gliph, color and shape
*/
class MarkerGlyph extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        markersOptions: PropTypes.object,
        onChange: PropTypes.func,
        width: PropTypes.number
    };

    static defaultProps = {
        style: {},
        onChange: () => {}
    };
    /*
    renderMarkers = (markers, prefix = '') => {
        return markers.map((marker) => {
            if (marker.markers) {
                console.log(marker.markers);
                return (<div className={"mapstore-annotations-info-viewer-marker-group mapstore-annotations-info-viewer-marker-" + prefix + marker.name}>
                    {this.renderMarkers(marker.markers, marker.name + '-')}
                </div>);
            }
            return (
                <div onClick={() => this.selectStyle(marker)}
                    className={"mapstore-annotations-info-viewer-marker mapstore-annotations-info-viewer-marker-" + prefix + marker.name +
                        (this.isCurrentStyle(marker) ? " mapstore-annotations-info-viewer-marker-selected" : "")} style={marker.thumbnailStyle} />);
        });
    };*/

    renderMarkers = (markers, prefix = '') => {
        return markers.map((marker) => {
            if (marker.markers) {
                return this.renderMarkers(marker.markers, marker.name + '-');
            }
            return (
                <div
                    onClick={() => this.selectStyle(marker)}
                    style={{
                        ...marker.thumbnailStyle,
                        ...(this.isCurrentStyle(marker) && {border: '2px solid #1bd2f5'})
                    }}
                />);
        });
    };

    render() {
        const glyphRenderer = (option) => (<div><span className={"fa fa-" + option.value} style={{padding: '0 10px'}}/><span> {option.label}</span></div>);
        const selectedMarker = this.props.markersOptions.markers.reduce((acc, { markers }) => [...acc, ...markers], []).find((marker) => this.isCurrentStyle(marker)) || {};

        return (
            <div>
                {/* <StyleField
                    label={<Message msgId="draw.marker.icon"/>}>
                    <Select
                        options={this.props.markersOptions.glyphs.map(g => ({
                            label: g,
                            value: g
                        }))}
                        clearable={false}
                        optionRenderer={glyphRenderer}
                        valueRenderer={glyphRenderer}
                        value={this.props.style.iconGlyph || 'comment'}
                        onChange={(option) => {
                            const iconGlyph = option && option.value || "";
                            this.props.onChange(this.props.style.id, {iconGlyph});
                        }}/>
                </StyleField>*/}

                <StyleField
                    label={<Message msgId="draw.marker.icon"/>}>
                    <PropertyPicker
                        triggerNode={
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                    cursor: 'pointer',
                                    margin: 'auto'
                                }}>
                                <i className={`fa fa-${this.props.style.iconGlyph}`}></i>
                            </div>
                        }>
                        <div
                            style={{
                                width: 256,
                                height: 256,
                                overflow: 'auto',
                                position: 'relative',
                                backgroundColor: '#ffffff'
                            }}>
                            <div style={{ position: 'sticky', top: 0 }}>
                                <Filter filterPlaceholder="Filter icons..."/>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center'
                            }}>
                                {this.props.markersOptions.glyphs.map(glyph => {
                                    return (
                                        <div
                                            style={{
                                                width: 32,
                                                height: 32,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 20,
                                                cursor: 'pointer',
                                                ...(glyph === this.props.style.iconGlyph && {border: '2px solid #1bd2f5'})
                                            }}
                                            onClick={() => {
                                                this.props.onChange(this.props.style.id, { iconGlyph: glyph });
                                            }}>
                                            <i className={`fa fa-${glyph}`}></i>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </PropertyPicker>
                </StyleField>

                <StyleField
                    label="Shape">
                    <PropertyPicker
                        triggerNode={<div style={{
                            ...selectedMarker.thumbnailStyle,
                            margin: 'auto' }}></div>}>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                width: 256,
                                height: 256,
                                overflow: 'auto'
                            }}>
                            {this.renderMarkers(this.props.markersOptions.markers)}
                        </div>
                    </PropertyPicker>
                </StyleField>
            </div>
        );
    }

    isCurrentStyle = (m) => {
        // TODO change this
        return this.props.markersOptions.markersConfig.matches(this.props.style, m.style);
    }

    currentStyle = (markers) => {
        /* return markers.map((marker) => {
            if (marker.markers) {
                return this.renderMarkers(marker.markers, marker.name + '-');
            }
            return this.isCurrentStyle(marker);
        });*/
    }

    selectStyle = (marker) => {
        return this.props.onChange(this.props.style.id, {...this.props.markersOptions.markersConfig.getStyle(marker.style)});
    };
}

module.exports = MarkerGlyph;
