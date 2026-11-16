/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import omit from 'lodash/omit';
import {
    getLegacyConnectionSource,
    migrateLegacyConnections,
    LEGACY_CONNECTION_CONVERTERS,
    MAIN_MAP_SENDER_ID
} from '../InteractionMigrationUtils';

const TABLE_ID = 'table-1';
const CHART_ID = 'chart-1';

const makeTable = (overrides = {}) => ({ id: TABLE_ID, widgetType: 'table', title: 'Table', ...overrides });
const makeConnectedChart = (overrides = {}) => ({
    id: CHART_ID,
    widgetType: 'chart',
    title: 'Chart',
    mapSync: true,
    dependenciesMap: {
        filter: `widgets[${TABLE_ID}].filter`,
        quickFilters: `widgets[${TABLE_ID}].quickFilters`
    },
    ...overrides
});

const testConverters = {
    table: (receiver, sender) => ({
        interactions: [{
            plugged: true,
            targetType: 'applyFilter',
            source: { nodePath: `widgets[${sender.id}]` },
            target: { nodePath: `widgets[${receiver.id}]` }
        }],
        receiver: omit(receiver, ['mapSync', 'dependenciesMap'])
    })
};

describe('InteractionMigrationUtils', () => {
    describe('getLegacyConnectionSource', () => {
        it('returns null when not connected', () => {
            expect(getLegacyConnectionSource(makeConnectedChart({ mapSync: false }))).toBe(null);
            expect(getLegacyConnectionSource({ id: 'w' })).toBe(null);
            expect(getLegacyConnectionSource()).toBe(null);
        });
        it('returns the main map without dependenciesMap', () => {
            expect(getLegacyConnectionSource({ mapSync: true })).toEqual({ senderId: MAIN_MAP_SENDER_ID });
            expect(getLegacyConnectionSource({ mapSync: true, dependenciesMap: {} })).toEqual({ senderId: MAIN_MAP_SENDER_ID });
        });
        it('returns the sender widget', () => {
            expect(getLegacyConnectionSource(makeConnectedChart())).toEqual({ senderId: TABLE_ID });
        });
        it('returns the sender map widget and map, also with quoted ids', () => {
            const widget = { mapSync: true, dependenciesMap: { viewport: 'widgets["map-w"].maps["map-1"].viewport', zoom: 'widgets["map-w"].maps["map-1"].zoom' } };
            expect(getLegacyConnectionSource(widget)).toEqual({ senderId: 'map-w', mapId: 'map-1' });
        });
        it('returns null when no path refers to a widget', () => {
            expect(getLegacyConnectionSource({ mapSync: true, dependenciesMap: { center: 'map.center' } })).toBe(null);
        });
    });

    describe('migrateLegacyConnections', () => {
        it('has no registered converters yet', () => {
            expect(LEGACY_CONNECTION_CONVERTERS).toEqual({});
        });
        it('returns the same configuration without converters or widgets', () => {
            const config = { widgets: [makeTable(), makeConnectedChart()] };
            expect(migrateLegacyConnections(config)).toBe(config);
            expect(migrateLegacyConnections(undefined, testConverters)).toBe(undefined);
            const noWidgets = { layouts: {} };
            expect(migrateLegacyConnections(noWidgets, testConverters)).toBe(noWidgets);
        });
        it('converts a legacy connection into a sender interaction', () => {
            const migrated = migrateLegacyConnections({ widgets: [makeTable(), makeConnectedChart()] }, testConverters);
            const [table, chart] = migrated.widgets;
            expect(table.interactions.length).toBe(1);
            expect(table.interactions[0].id).toBe(`legacy:${CHART_ID}:applyFilter:widgets[${CHART_ID}]`);
            expect(chart.mapSync).toNotExist();
            expect(chart.dependenciesMap).toNotExist();
        });
        it('is idempotent', () => {
            const once = migrateLegacyConnections({ widgets: [makeTable(), makeConnectedChart()] }, testConverters);
            expect(migrateLegacyConnections(once, testConverters)).toBe(once);
            const senderAlreadyMigrated = { widgets: [once.widgets[0], makeConnectedChart()] };
            expect(migrateLegacyConnections(senderAlreadyMigrated, testConverters).widgets[0].interactions.length).toBe(1);
        });
        it('preserves existing interactions and properties', () => {
            const existing = { id: 'int-1', targetType: 'applyFilter' };
            const config = { layouts: { md: [] }, widgets: [makeTable({ interactions: [existing] }), makeConnectedChart(), { id: 'other', widgetType: 'counter' }] };
            const migrated = migrateLegacyConnections(config, testConverters);
            expect(migrated.layouts).toBe(config.layouts);
            expect(migrated.widgets[0].title).toBe('Table');
            expect(migrated.widgets[0].interactions[0]).toBe(existing);
            expect(migrated.widgets[0].interactions.length).toBe(2);
            expect(migrated.widgets[1].title).toBe('Chart');
            expect(migrated.widgets[2]).toBe(config.widgets[2]);
        });
        it('keeps connections without a converter, to the main map or rejected by the converter', () => {
            const mainMap = { id: 'counter-1', widgetType: 'counter', mapSync: true };
            const config = { widgets: [makeTable(), mainMap] };
            expect(migrateLegacyConnections(config, testConverters)).toBe(config);
            const rejected = { widgets: [makeTable(), makeConnectedChart()] };
            expect(migrateLegacyConnections(rejected, { table: () => null })).toBe(rejected);
            expect(migrateLegacyConnections(rejected, { chart: testConverters.table })).toBe(rejected);
        });
    });
});
