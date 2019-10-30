/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withState } from 'recompose';
import { head } from 'lodash';
import { Glyphicon as GlyphiconRB } from 'react-bootstrap';
import tooltip from '../../components/misc/enhancers/tooltip';

const Glyphicon = tooltip(GlyphiconRB);

const getIconProps = ({ type = '' }) => {
    const icons = ['polygon', 'line', 'point'];
    const glyph = head(icons.filter(icon => type.toLowerCase().indexOf(icon) !== -1)) || 'point-dash';
    const tooltips = {
        polygon: 'Polygon',
        line: 'Line',
        point: 'Point'
    };
    return {
        glyph,
        tooltip: tooltips[glyph],
        tooltipPosition: 'left'
    };
};

const Icon = withState('error', 'setError')(
    ({ title = '', feature, error, setError, upperCase, path, color }) => {
        const splittedTitle = (title).split(' ');
        const one = splittedTitle[0];
        const two = splittedTitle[1];
        const icon = one && <svg viewBox="0 0 100 100">
            <rect x="0" y="0" width="100" height="100" />
            <text
                x="50"
                y="50"
                // using dy because alignmentBaseline is not supported in ie11
                dy="18"
                textAnchor="middle"
                style={color ? { fill: color } : {}}>
                {one[0].toUpperCase()}{two && (upperCase && two[0].toUpperCase() || two[0].toLowerCase())}
            </text>
        </svg>;
        return (<div className="mps-icon">
            {path && !error
                ? <img
                    src={path}
                    onError={() => setError(true)} />
                : icon || feature && <Glyphicon {...getIconProps(feature.geometry || {})} /> || null}
        </div>);
    }
);

export default withState('error', 'setError')(Icon);
