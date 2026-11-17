/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getCurrentTimeLayout } from '../chartCurrentTimeShapes';

describe('chartCurrentTimeShapes enhancer', () => {
    const dateAxis = { id: 0, type: 'date' };
    it('draws a line for the axis current time', () => {
        const layout = getCurrentTimeLayout({ xAxisOpts: [{ ...dateAxis, appliedCurrentTime: '2020-01-01' }], layout: { title: 'chart' } });
        expect(layout.title).toBe('chart');
        expect(layout.shapes.length).toBe(1);
        expect(layout.shapes[0].type).toBe('line');
    });
    it('draws a band for the axis time range', () => {
        const layout = getCurrentTimeLayout({ xAxisOpts: [{ ...dateAxis, appliedCurrentTime: '2020-01-01', appliedOffsetTime: '2020-02-01' }] });
        expect(layout.shapes[0].type).toBe('rect');
    });
    it('keeps the layout without applied times or on axes that are not dates', () => {
        const layout = { title: 'chart' };
        expect(getCurrentTimeLayout({ xAxisOpts: [dateAxis], layout })).toBe(layout);
        expect(getCurrentTimeLayout({ xAxisOpts: [{ ...dateAxis, type: 'linear', appliedCurrentTime: '2020-01-01' }], layout })).toBe(layout);
    });
});
