/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { SketchPicker } = require('react-color');
const tinycolor = require('tinycolor2');

module.exports = [
    {
        type: 'color',
        active: token => token.type === 'atom' && tinycolor(token.string).isValid(),
        style: token => ({backgroundColor: token.string}),
        Widget: ({token, value, onChange = () => {}}) => (
            <SketchPicker
                color={{ hex: value || token.string }}
                onChange={color => onChange(color.hex)} />
        )
    }
];
