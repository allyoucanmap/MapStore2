/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { addCurrentTimeShapes } from '../../../utils/WidgetsUtils';

/**
 * Returns the chart layout with the current time shapes of the date axes, from the axis applied times
 * @param {object} props `{ xAxisOpts, yAxisOpts, layout }` of the chart
 * @returns {object} the layout
 */
export const getCurrentTimeLayout = ({ xAxisOpts, yAxisOpts, layout = {} } = {}) => {
    const shapes = addCurrentTimeShapes({ xAxisOpts, yAxisOpts });
    return shapes?.length ? { ...layout, shapes: [...(layout?.shapes || []), ...shapes] } : layout;
};

/**
 * Adds to the chart layout the current time line or band of the date axes, set by the dimension interactions (e.g. timeline time)
 */
const chartCurrentTimeShapes = (Component) => (props) => <Component {...props} layout={getCurrentTimeLayout(props)} />;

export default chartCurrentTimeShapes;
