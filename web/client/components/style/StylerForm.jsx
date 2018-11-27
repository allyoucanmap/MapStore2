

/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const PropTypes = require('prop-types');
const React = require('react');
const {Grid, Row, Col} = require('react-bootstrap');
const assign = require('object-assign');
const ColorSelector = require('./ColorSelector');
const StyleCanvas = require('./StyleCanvas');
const Slider = require('react-nouislider');
const numberLocalizer = require('react-widgets/lib/localizers/simple-number');
numberLocalizer();
require('react-widgets/lib/less/react-widgets.less');
// const Message = require('../I18N/Message');
const {isNil, join} = require('lodash');
const tinycolor = require("tinycolor2");
const SwitchPanel = require('../misc/switch/SwitchPanel');
const Select = require('react-select');
const MarkerStyler = require('./MarkerStyler');

const Fields = {
    color: ({
        color,
        opacity,
        onChange = () => {}
    }) => (
        <ColorSelector
            color={{...tinycolor(color).toRgb(), a: opacity}}
            onChangeColor={c => {
                if (!isNil(c)) {
                    const col = tinycolor(c).toHexString();
                    const op = c.a;
                    onChange(({
                        color: col,
                        opacity: op
                    }));
                }
            }}/>
    ),
    select: ({
        renderer,
        value,
        options = [],
        onChange = () => {}
    }) => (
        <Select
            options={options}
            clearable={false}
            optionRenderer={renderer}
            valueRenderer={renderer}
            value={value}
            onChange={({value: selected}) => {
                onChange(selected);
            }}/>
    ),
    opacity: ({
        opacity,
        value,
        options = [],
        onChange = () => {}
    }) => (
        <div className="mapstore-slider with-tooltip">
            <Slider
                tooltips
                start={[value]}
                range={{min: 0, max: 1}}
                onChange={(values) => {
                    const opacity = parseFloat(values[0]);
                    this.props.setStyleParameter(newStyle);
                }}
            />
        </div>
    ),
    size: () => (
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
                        [styleType]: assign({}, style, {weight}),
                        [otherStyleType]: assign({}, style, {weight})
                    });
                    this.props.setStyleParameter(newStyle);
                }}
            />
        </div>
    )
};

const StyleSection = ({
    title = 'Stroke',
    form = [
        {
            title: 'Style',
            type: 'select',
            options: [{
                value: '1, 0'
            }, {
                value: '10, 50, 20'
            }, {
                value: '30, 20'
            }],
            key: 'lineDash'
        },
        {
            title: 'Color',
            type: 'color',
        }
    ]
}) => (
    <div>
        <Row>
            <Col xs={12}>
                <strong>{title}</strong>
            </Col>
        </Row>
        {form.map(({title, type}) => {
            const Field = Fields[type];
            return Field ? (
                <Row>
                    <Col xs={6}>
                        {title}
                    </Col>
                    <Col xs={6}>
                        <Field />
                    </Col>
                </Row>
            ) : null;
        })}
    </div>
);
