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
const {isNil, isEqual} = require('lodash');
const tinycolor = require("tinycolor2");
const Slider = require('react-nouislider');

// number localizer?
const numberLocalizer = require('react-widgets/lib/localizers/simple-number');
// not sure this is needed, TODO check!
numberLocalizer();
const Message = require('../../I18N/Message');
const OpacitySlider = require('../../TOC/fragments/OpacitySlider');
const ColorSelector = require('../ColorSelector').default;
const DashArray = require('./DashArray');
const {addOpacityToColor} = require('../../../utils/VectorStyleUtils');
const StyleField = require('./StyleField').default;


/**
 * Styler for the stroke properties of a vector style
*/
class Stroke extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        lineDashOptions: PropTypes.array,
        onChange: PropTypes.func,
        width: PropTypes.number,
        constraints: PropTypes.object
    };

    static defaultProps = {
        style: {},
        constraints: {
            maxWidth: 15,
            minWidth: 1
        },
        onChange: () => {}
    };

    shouldComponentUpdate(nextProps) {
        return !isEqual(this.props.style, nextProps.style)
         || !isEqual(this.props.lineDashOptions, nextProps.lineDashOptions);
    }
    render() {
        const {style} = this.props;
        return (<div>
            <div>
                <strong><Message msgId="draw.stroke"/></strong>
            </div>
            <StyleField
                label={<Message msgId="draw.lineDash"/>}>
                <DashArray
                    options={this.props.lineDashOptions}
                    dashArray={style.dashArray}
                    onChange={(dashArray) => {
                        this.props.onChange(style.id, {dashArray});
                    }}
                />
            </StyleField>
            <StyleField
                label={<Message msgId="draw.color"/>}>
                <ColorSelector color={addOpacityToColor(tinycolor(style.color).toRgb(), style.opacity)} width={this.props.width}
                    onChangeColor={c => {
                        if (!isNil(c)) {
                            const color = tinycolor(c).toHexString();
                            const opacity = c.a;
                            this.props.onChange(style.id, {color, opacity});
                        }
                    }}/>
            </StyleField>
            <StyleField
                label={<Message msgId="draw.opacity"/>}>
                <OpacitySlider
                    opacity={isNil(style.opacity) ? 0.2 : style.opacity}
                    onChange={(opacity) => {
                        this.props.onChange(style.id, {opacity});
                    }}/>
            </StyleField>
            <StyleField
                label={<Message msgId="draw.width"/>}>
                <div className="mapstore-slider with-tooltip">
                    <Slider
                        tooltips
                        step={1}
                        start={[style.weight || style.width || 1]}
                        format={{
                            from: value => Math.round(value),
                            to: value => Math.round(value) + ' px'
                        }}
                        range={{
                            min: isNil(this.props.constraints && this.props.constraints.minWidth) ? 1 : this.props.constraints.maxWidth,
                            max: this.props.constraints && this.props.constraints.maxWidth || 15
                        }}
                        onChange={(values) => {
                            const weight = parseInt(values[0].replace(' px', ''), 10);
                            this.props.onChange(style.id, {weight});
                        }}
                    />
                </div>
            </StyleField>
        </div>);
    }
}

module.exports = Stroke;
