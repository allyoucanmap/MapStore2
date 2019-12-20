/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import head from 'lodash/head';
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

function Icon({
    title = '',
    feature,
    upperCase,
    color,
    path
}) {
    const [ error, setError ] = useState();
    const splitTitle = ( title).split(' ');
    const one = splitTitle[0];
    const two = splitTitle[1];
    const initials = one && `${one[0].toUpperCase()}${two && (upperCase && two[0].toUpperCase() || two[0].toLowerCase()) || ''}`;
    const icon = initials && <svg viewBox="0 0 100 100">
        <rect x="0" y="0" width="100" height="100"/>
        <text
            x="50"
            y="50"
            // using dy because alignmentBaseline is not supported in ie11
            dy="18"
            textAnchor="middle"
            style={color ? {fill: color} : {}}>
            {initials}
        </text>
    </svg>;
    return (<div className="ms-icon">
        {path && !error
            ? <img
                src={path}
                onError={() => setError(true)}/>
            : icon || feature && feature.geometry && <Glyphicon {...getIconProps(feature.geometry || {})} /> || null}
    </div>);
}

Icon.propTypes = {
    title: PropTypes.string,
    name: PropTypes.string,
    feature: PropTypes.object,
    upperCase: PropTypes.bool
};

export default Icon;
