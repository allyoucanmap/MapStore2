/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isString from 'lodash/isString';
import tinycolor  from 'tinycolor2';

const DEFAULT_POINT_SIZE = 1;

function filterToExpression(filter) {
    const [operator, ...args] = filter;
    if (['||', '&&'].includes(operator)) {
        return `(${args.map((filterArray) => filterToExpression(filterArray)).join(` ${operator} `)})`;
    }
    const [ property, value ] = args;
    const isValidProperty = `!(\${${property}} === undefined || \${${property}} === null || isNaN(\${${property}}))`;
    return `(${isValidProperty} && \${${property}} ${operator} ${value})`;
}

function formatFilter(filter) {
    if (!filter) {
        return true;
    }
    return filterToExpression(filter);
}

function parseFilter() {
    return null;
}

function getStyleJSONFromRules({ rules = [] } = {}) {
    const isPointCloud = rules.find(({ symbolizers }) => symbolizers[0].kind === 'Mark');
    const colorConditions = rules
        .map(({ filter, symbolizers }) => {
            return [formatFilter(filter),
                isPointCloud && (symbolizers[0].fillOpacity || 0) === 0
                    ? `\${COLOR}`
                    : `color('${symbolizers[0].color}', ${symbolizers[0].fillOpacity})`
            ];
        });
    const validBaseColor = colorConditions.find(([expression]) => expression === true);
    const showParam = !validBaseColor && {
        show: colorConditions.filter(condition => condition !== true).map(([expression]) => expression).join(' || ')
    };
    const pointSizeConditions = rules.map(({ filter, symbolizers }) => {
        return [formatFilter(filter), symbolizers[0].radius || DEFAULT_POINT_SIZE];
    });
    return {
        ...showParam,
        color: {
            conditions: !validBaseColor
                ? [...colorConditions, [true, 'color(\'#ffffff\', 1)']]
                : colorConditions
        },
        ...(isPointCloud && {
            pointSize: {
                conditions: !validBaseColor
                    ? [...pointSizeConditions, [true, DEFAULT_POINT_SIZE]]
                    : pointSizeConditions
            }
        })
    };
}

function parseColorValue(value) {
    if (/rgb\(|rgba\(|hsl\(|hsla\(/.test(value)) {
        const color = tinycolor(value);
        return {
            color: color.toHexString(),
            fillOpacity: color.getAlpha()
        };
    }
    if (/color\(/.test(value)) {
        const [color, opacity] = value.replace(/color\(|\)/g, '').split(',');
        return {
            color: color.replace(/\'/g, ''),
            fillOpacity: parseFloat(opacity !== undefined ? opacity : 1)
        };
    }
    // fallback color
    return {
        color: '#ffffff',
        fillOpacity: 1
    };
}

function getGeoStylerStyleFromStyleObj({ color, pointSize } = {}) {

    const rules = isString(color)
        ? [{
            filter: undefined,
            name: '',
            symbolizers: [{
                kind: pointSize ? 'Mark' : 'Fill',
                ...parseColorValue(color)
            }]
        }]
        : color?.conditions?.map(([filter, value]) => {
            const filterValue = parseFilter(filter);
            return {
                filter: filterValue ? filterValue : undefined,
                name: '',
                symbolizers: [{
                    kind: pointSize ? 'Mark' : 'Fill',
                    ...parseColorValue(value)
                }]
            };
        });
    return {
        name: '3D Tile Style',
        rules
    };
}

class Tileset3DParser {
    readStyle(styleJSON) {
        return new Promise((resolve, reject) => {
            try {
                const geoStylerStyle = getGeoStylerStyleFromStyleObj(styleJSON);
                resolve(geoStylerStyle);
            } catch (error) {
                reject(error);
            }
        });
    }

    writeStyle(geoStylerStyle) {
        return new Promise((resolve, reject) => {
            try {
                const styleJSON = getStyleJSONFromRules(geoStylerStyle);
                resolve(styleJSON);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default Tileset3DParser;
