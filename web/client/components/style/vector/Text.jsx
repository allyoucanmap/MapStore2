/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const PropTypes = require('prop-types');
const React = require('react');
const {Row, Col, FormControl} = require('react-bootstrap');
const Combobox = require('react-widgets').Combobox;
const numberLocalizer = require('react-widgets/lib/localizers/simple-number');
// not sure this is needed, TODO check!
numberLocalizer();

const Select = require('react-select').default;

const Message = require('../../I18N/Message');
const LocaleUtils = require('../../../utils/LocaleUtils');
const {createFont} = require('../../../utils/AnnotationsUtils');
const StyleField = require('./StyleField').default;

/**
 * Styler for the stroke properties of a vector style
*/
class Text extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        onChange: PropTypes.func,
        addOpacityToColor: PropTypes.func,
        width: PropTypes.number,
        uomValues: PropTypes.array,
        alignValues: PropTypes.array,
        fontStyleValues: PropTypes.array,
        fontWeightValues: PropTypes.array,
        fontFamilyValues: PropTypes.array,
        shapeStyle: PropTypes.object
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        style: {},
        onChange: () => {},
        uomValues: [{value: "px"}, {value: "em"}],
        fontWeightValues: [{value: "normal"}, {value: "bold"}],
        alignValues: [{value: "start", label: "left"}, {value: "center", label: "center"}, {value: "end", label: "right"}],
        fontStyleValues: [{value: "normal"}, {value: "italic"}],
        fontFamilyValues: [{value: "Arial"}, {value: "Helvetica"}, {value: "sans-serif"}, {value: "Courier"}],
        shapeStyle: {}
    };

    state = {
        fontFamily: "Arial"
    };

    render() {
        const messages = {
            emptyList: LocaleUtils.getMessageById(this.context.messages, "queryform.attributefilter.autocomplete.emptyList"),
            open: LocaleUtils.getMessageById(this.context.messages, "queryform.attributefilter.autocomplete.open"),
            emptyFilter: LocaleUtils.getMessageById(this.context.messages, "queryform.attributefilter.autocomplete.emptyFilter")
        };
        const {style} = this.props;
        return (<div>
            <div>
                <strong><Message msgId="draw.text"/></strong>
            </div>
            <StyleField
                label={<Message msgId="draw.font.textAlign"/>}>
                <Select
                    value={style.textAlign || "center"}
                    clearable={false}
                    options={this.props.alignValues.map(({ value }) => ({ value, label: value }))}
                    onChange={(e) => {
                        let textAlign = e.value ? e.value : e;
                        if (this.props.alignValues.map(f => f.value).indexOf(textAlign) === -1) {
                            textAlign = "center";
                        }
                        this.props.onChange(style.id, {textAlign});
                    }}
                />
            </StyleField>
            <div>
                <strong><Message msgId="draw.fontTitle"/></strong>
            </div>
            <StyleField
                label={<Message msgId="draw.font.family"/>}>
                <Select
                    value={this.state.fontFamily || "Arial"}
                    options={this.props.fontFamilyValues.map(({ value }) => ({ value, label: value }))}
                    clearable={false}
                    onChange={(e) => {
                        let fontFamily = e.value ? e.value : e;
                        if (fontFamily === "") {
                            fontFamily = "Arial";
                        }
                        this.setState({fontFamily});
                        const font = createFont({...style, fontFamily});
                        this.props.onChange(style.id, {fontFamily, font});
                    }}
                />
            </StyleField>
            <StyleField
                label={<Message msgId="draw.font.size"/>}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl
                        value={style.fontSize || 14}
                        placeholder=""
                        onChange={(e) => {
                            const fontSize = e.target.value || 14;
                            const font = createFont({...style, fontSize});
                            this.props.onChange(style.id, {fontSize, font});
                        }}
                        type="number"
                        style={{ flex: 1, minWidth: 60, height: 34, marginRight: 4 }}/>
                    <Select
                        value={style.fontSizeUom || "px"}
                        clearable={false}
                        options={this.props.uomValues.map(({ value }) => ({ value, label: value }))}
                        style={{
                            width: 60
                        }}
                        onChange={(e) => {
                            let fontSizeUom = e.value ? e.value : e;
                            if (this.props.uomValues.map(f => f.value).indexOf(fontSizeUom) === -1) {
                                fontSizeUom = "px";
                            }
                            const font = createFont({...style, fontSizeUom});
                            this.props.onChange(style.id, {fontSizeUom, font});
                        }}
                    />
                </div>
                
            </StyleField>
            <StyleField
                label={<Message msgId="draw.font.style"/>}>
                <Select
                    value={style.fontStyle || "normal"}
                    clearable={false}
                    options={this.props.fontStyleValues.map(({ value }) => ({ value, label: value }))}
                    onChange={(e) => {
                        let fontStyle = e.value ? e.value : e;
                        if (this.props.fontStyleValues.map(f => f.value).indexOf(fontStyle) === -1) {
                            fontStyle = style.fontStyle;
                        }
                        const font = createFont({...style, fontStyle});
                        this.props.onChange(style.id, {fontStyle, font});
                    }}
                />
            </StyleField>
            <StyleField
                label={<Message msgId="draw.font.weight"/>}>
                <Select
                    value={style.fontWeight || "normal"}
                    clearable={false}
                    options={this.props.fontWeightValues.map(({ value }) => ({ value, label: value }))}
                    onChange={(e) => {
                        let fontWeight = e.value ? e.value : e;
                        if (this.props.fontWeightValues.map(f => f.value).indexOf(fontWeight) === -1) {
                            fontWeight = style.fontWeight;
                        }
                        const font = createFont({...style, fontWeight});
                        this.props.onChange(style.id, {fontWeight, font});
                    }}
                />
            </StyleField>
            
        </div>);
    }
}

module.exports = Text;
