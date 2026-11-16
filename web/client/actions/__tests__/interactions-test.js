/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import expect from "expect";
import {
    APPLY_WIDGET_INTERACTIONS,
    ZOOM_TO_FILTER_EXTENT,
    applyWidgetInteractions,
    zoomToFilterExtent
} from '../interactions';

describe('interactions actions', () => {
    it('applyWidgetInteractions default target', () => {
        const retval = applyWidgetInteractions('myWidgetId', undefined, 'myFilterId');
        expect(retval).toExist();
        expect(retval.type).toBe(APPLY_WIDGET_INTERACTIONS);
        expect(retval.widgetId).toBe('myWidgetId');
        expect(retval.target).toBe('floating');
        expect(retval.sourceId).toBe('myFilterId');
    });

    it('applyWidgetInteractions with specific target', () => {
        const retval = applyWidgetInteractions('myWidgetId', 'specificTarget', 'myFilterId');
        expect(retval).toExist();
        expect(retval.type).toBe(APPLY_WIDGET_INTERACTIONS);
        expect(retval.widgetId).toBe('myWidgetId');
        expect(retval.target).toBe('specificTarget');
        expect(retval.sourceId).toBe('myFilterId');
    });

    it('zoomToFilterExtent default target', () => {
        const retval = zoomToFilterExtent('myWidgetId', undefined, 'myFilterId');
        expect(retval).toExist();
        expect(retval.type).toBe(ZOOM_TO_FILTER_EXTENT);
        expect(retval.widgetId).toBe('myWidgetId');
        expect(retval.target).toBe('floating');
        expect(retval.sourceId).toBe('myFilterId');
    });

    it('zoomToFilterExtent with specific target', () => {
        const retval = zoomToFilterExtent('myWidgetId', 'specificTarget', 'myFilterId');
        expect(retval).toExist();
        expect(retval.type).toBe(ZOOM_TO_FILTER_EXTENT);
        expect(retval.widgetId).toBe('myWidgetId');
        expect(retval.target).toBe('specificTarget');
        expect(retval.sourceId).toBe('myFilterId');
    });
    it('applyWidgetInteractions with event data', () => {
        const event = { targetTypes: ['applyZoomToFeature'], data: { feature: { bbox: [0, 0, 1, 1] } } };
        const retval = applyWidgetInteractions('table-1', undefined, 'table-1', event);
        expect(retval.type).toBe(APPLY_WIDGET_INTERACTIONS);
        expect(retval.target).toBe('floating');
        expect(retval.event).toBe(event);
        expect(applyWidgetInteractions('table-1', undefined, 'table-1').event).toNotExist();
    });
});
