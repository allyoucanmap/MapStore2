/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isArray, isFunction, head, castArray } from 'lodash';
import SLDParser from "geostyler-sld-parser";
import OpenLayersParser from "geostyler-openlayers-parser";

const olParser = new OpenLayersParser();
const sldParser = new SLDParser();

const splitSLDStyle = function(styleSheet, returnArray) {

    const splitB = styleSheet
        .split(/\<\w+:NamedLayer\>|\<\/\w+:NamedLayer\>|\<NamedLayer\>|\<\/NamedLayer\>/);

    const namedLayerWrapper = (body) => {
        const prefix = styleSheet.match(/\<(.*):NamedLayer\>/);
        if (prefix && prefix[1]) {
            return `<${prefix[1]}:NamedLayer>${body}</${prefix[1]}:NamedLayer>`;
        }
        return `<NamedLayer>${body}</NamedLayer>`;
    };

    const splitStyleBody = splitB
        .filter((namedLayer) => namedLayer.indexOf('Name') !== -1 && namedLayer.indexOf('StyledLayerDescriptor') === -1);

    const sldWrapper = splitB
        .filter((val, idx) => idx === 0 || idx === splitB.length - 1);

    const styleObj = splitStyleBody.reduce((acc, splitStyle) => {
        const idx = head(splitStyle.replace(/\s/g, '')
            .split(/\<\w+:Name\>|\<\/\w+:Name\>|\<Name\>|\<\/Name\>/)
            .filter((val => val)));
        const [ start, end ] = sldWrapper;
        return {
            ...acc,
            [idx]: returnArray ?
                [ namedLayerWrapper(splitStyle), start, end ]
                : start + namedLayerWrapper(splitStyle) + end
        };
    }, {});

    return styleObj;
};

export const readStyle = function(styleSheet, format) {
    if (format === 'sld') {
        const splitStyle = splitSLDStyle(styleSheet) || {};
        return Promise.all(
            Object.keys(splitStyle).map((name) => {
                return sldParser.readStyle(splitStyle[name])
                .then((style) => ({ ...style }))
                .catch(() => ({ rules: [], name }));
            })
        );
    }
};

export const writeStyle = function(style, format) {
    const styles = castArray(style);
    if (format === 'sld') {
        return Promise.all(
            styles.map((_style) => {
                return sldParser.writeStyle(_style)
                .then((stylesheet) => ({ name: _style.name, stylesheet: splitSLDStyle(stylesheet, true)}))
                .catch(() => ({ name: _style.name, stylesheet: null }));
            })
        )
        .then((stylesheets) => {

            const [styleDescriptorStart, styleDescriptorEnd] = head(stylesheets
                .filter((value) => value && value.name && value.stylesheet && value.stylesheet[value.name] && value.stylesheet[value.name][1])
                .map((value) => [value.stylesheet[value.name][1], value.stylesheet[value.name][2]]));

            const namedLayersStyles = stylesheets.reduce((acc, value) => {
                const stylesnamedLayersStyle = value && value.name && value.stylesheet && value.stylesheet[value.name] && value.stylesheet[value.name][0];
                if (stylesnamedLayersStyle) {
                    return acc + stylesnamedLayersStyle;
                }
                return acc;
            }, '');

            return styleDescriptorStart + namedLayersStyles + styleDescriptorEnd;
        });
    }
    if (format === 'ol') {
        return Promise.all(
            styles.map((_style) => {
                return olParser.writeStyle(_style)
                .then((olStyle) => olStyle)
                .catch(() => null);
            })
        )
        .then((olStyles) =>
            (...args) => olStyles
                .filter(olStyle => olStyle)
                .reduce((acc, olStyle) => {
                    if (isFunction(olStyle)) {
                        const olStyleObjects = olStyle(...args);
                        return [
                            ...acc,
                            ...(isArray(olStyleObjects) ? olStyleObjects : [olStyleObjects])
                        ];
                    }
                    return [ ...acc, olStyle ];
                }, [])
        );
    }
};
