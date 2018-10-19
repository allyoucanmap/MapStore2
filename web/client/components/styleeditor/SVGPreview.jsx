/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const SVGPreview = ({ type, patterns, paths, backgroundColor = '#ffffff' }) =>
    <svg viewBox="0 0 200 200">
        {<defs>
            {patterns && patterns.map(pattern => <pattern id={pattern.id} viewBox="0 0 1 1" width="15%" height="15%">
                {pattern.icon && <path {...pattern.icon} />}
            </pattern>)}
        </defs>}
        <path fill={backgroundColor} d={`M0 0 L200 0 L200 200 L0 200Z`} />
        {paths && paths.map(({type: pathType, text, ...props}) =>
            (pathType || type) === 'polygon' && <path {...props} d="M20 20 L180 20 L180 180 L20 180Z" />
            || (pathType || type) === 'linestring' && <path {...props} fill="none" d="M30 160 L100 40 L170 160" />
            || (pathType || type) === 'point' && <path {...props} />
            || text && <text x="100" y="100" textAnchor="middle" alignmentBaseline="middle" {...props}>{text}</text>
        )}
    </svg>;

module.exports = SVGPreview;
