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
const {isNil} = require('lodash');
const tinycolor = require("tinycolor2");

// number localizer?
const numberLocalizer = require('react-widgets/lib/localizers/simple-number');
// not sure this is needed, TODO check!
numberLocalizer();

const Message = require('../../I18N/Message');
const OpacitySlider = require('../../TOC/fragments/OpacitySlider');
const ColorSelector = require('../ColorSelector').default;
const {addOpacityToColor} = require('../../../utils/VectorStyleUtils');
const StyleField = require('./StyleField').default;

/**
 * Styler for the stroke properties of a vector style
*/
class Fill extends React.Component {
    static propTypes = {
        style: PropTypes.object,
        onChange: PropTypes.func,
        width: PropTypes.number
    };

    static defaultProps = {
        style: {},
        onChange: () => {}
    };

    render() {
        const {style} = this.props;
        return (
            <div>
                <div>
                    <strong><Message msgId="draw.fill"/></strong>
                </div>

                <StyleField
                    label={<Message msgId="draw.color"/>}>
                    <ColorSelector color={addOpacityToColor(tinycolor(style.fillColor).toRgb(), style.fillOpacity)} width={this.props.width}
                        onChangeColor={c => {
                            if (!isNil(c)) {
                                const fillColor = tinycolor(c).toHexString();
                                const fillOpacity = c.a;
                                this.props.onChange(style.id, {fillColor, fillOpacity});
                            }
                        }}/>
                </StyleField>

                <StyleField
                    label={<Message msgId="draw.opacity"/>}>
                    <OpacitySlider
                        opacity={style.fillOpacity}
                        onChange={(fillOpacity) => {
                            this.props.onChange(style.id, {fillOpacity});
                        }}/>
                </StyleField>
            </div>
        );
    }
}

module.exports = Fill;
