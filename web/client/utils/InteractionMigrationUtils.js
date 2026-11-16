/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { TARGET_TYPES, TARGET_EVENT_DATA_TYPES, createLayerConstraint, extractWidgetIdFromNodePath } from './InteractionUtils';
import { SENDER_DATA_BUILDERS, TARGET_EFFECTS, getSenderSourceIds, isTransientEffectSender, INTERACTION_UPDATES } from './InteractionEffectsUtils';

export const MAIN_MAP_SENDER_ID = 'map';

const LEGACY_WIDGET_PATH_REGEX = /^widgets\["?([^"\]]*)"?\]/;
const LEGACY_WIDGET_MAP_PATH_REGEX = /^widgets\["?([^"\]]*)"?\]\.maps\["?([^"\]]*)"?\]/;

// stable across loads, so migrating the same resource twice does not duplicate interactions
const getLegacyInteractionId = (receiverId, interaction) =>
    `legacy:${receiverId}:${interaction?.targetType}:${interaction?.target?.nodePath}`;

/**
 * Returns the sender of a receiver legacy connection, the main map when `dependenciesMap` is empty
 * @param {object} widget the receiver widget
 * @returns {object|null} `{ senderId, mapId }`, null if not connected
 */
export const getLegacyConnectionSource = (widget) => {
    if (!widget?.mapSync) {
        return null;
    }
    if (isEmpty(widget.dependenciesMap)) {
        return { senderId: MAIN_MAP_SENDER_ID };
    }
    const paths = Object.values(widget.dependenciesMap).filter(path => typeof path === 'string');
    const [, senderId] = paths.map(path => LEGACY_WIDGET_PATH_REGEX.exec(path)).find(Boolean) || [];
    if (!senderId) {
        return null;
    }
    const [, , mapId] = paths.map(path => LEGACY_WIDGET_MAP_PATH_REGEX.exec(path)).find(Boolean) || [];
    return { senderId, ...(mapId ? { mapId } : {}) };
};

const legacyInteraction = (sender, targetType, nodePath, layer, sourceNodePath = `widgets[${sender.id}]`) => ({
    plugged: true,
    targetType,
    source: { nodePath: sourceNodePath },
    target: {
        nodePath,
        metaData: {
            targetType,
            expectedDataType: TARGET_EVENT_DATA_TYPES[targetType],
            constraints: layer ? { layer: createLayerConstraint(layer) } : {}
        }
    },
    configuration: {
        forcePlug: false,
        twoWaySynchronization: false,
        autoZoom: targetType === TARGET_TYPES.APPLY_ZOOM_TO
    }
});

const CHAINED_FILTER_KEYS = ['filter', 'quickFilters'];
const CHAINABLE_WIDGET_TYPES = ['chart', 'counter', 'table'];

const getTableFilterChainedWidgets = (mapReceiver, widgets = []) => widgets.filter(widget =>
    widget.mapSync
    && CHAINABLE_WIDGET_TYPES.includes(widget.widgetType)
    && CHAINED_FILTER_KEYS.some(key => {
        const path = widget.dependenciesMap?.[key];
        return typeof path === 'string' && LEGACY_WIDGET_PATH_REGEX.exec(path)?.[1] === mapReceiver.id;
    })
);

const TABLE_LEGACY_RECEIVER_INTERACTIONS = {
    counter: (receiver, sender) => [legacyInteraction(sender, TARGET_TYPES.APPLY_FILTER, `widgets[${receiver.id}]`, receiver.layer)],
    table: (receiver, sender) => [legacyInteraction(sender, TARGET_TYPES.APPLY_FILTER, `widgets[${receiver.id}]`, receiver.layer)],
    chart: (receiver, sender) => (receiver.charts || []).flatMap(chart => (chart.traces || [])
        .filter(trace => trace?.layer?.name === sender.layer?.name)
        .map(trace => legacyInteraction(sender, TARGET_TYPES.APPLY_FILTER,
            `widgets[${receiver.id}].charts[${chart.chartId || chart.id}].traces[${trace.id}]`, trace.layer))),
    // the old connection filtered the first layer with the table layer name, zoomed to the table records and to the clicked row
    map: (receiver, sender, widgets) => [
        ...(receiver.maps || []).flatMap(map => {
            const layer = (map.layers || []).find(l => l.name === sender.layer?.name);
            return [
                ...(layer ? [legacyInteraction(sender, TARGET_TYPES.APPLY_FILTER, `widgets[${receiver.id}].maps[${map.mapId}].layers[${layer.id}]`, layer)] : []),
                legacyInteraction(sender, TARGET_TYPES.APPLY_ZOOM_TO, `widgets[${receiver.id}].maps[${map.mapId}].${TARGET_TYPES.APPLY_ZOOM_TO}`),
                legacyInteraction(sender, TARGET_TYPES.APPLY_ZOOM_TO_FEATURE, `widgets[${receiver.id}].maps[${map.mapId}].${TARGET_TYPES.APPLY_ZOOM_TO}`)
            ];
        }),
        // widgets reading the table filter through the map become direct targets, their map connection stays legacy
        ...getTableFilterChainedWidgets(receiver, widgets)
            .flatMap(chained => TABLE_LEGACY_RECEIVER_INTERACTIONS[chained.widgetType]?.(chained, sender, widgets) || [])
    ]
};

/**
 * Converts a receiver connected to a table into interactions of the table
 * @param {object} receiver the connected receiver widget
 * @param {object} sender the table widget
 * @param {object} source the legacy connection source
 * @param {object[]} widgets all the widgets, to find the ones chained through a map widget
 * @returns {object|null} `{ interactions, receiver }`, null when the connection must stay legacy
 */
export const convertTableLegacyConnection = (receiver, sender, source, widgets) => {
    // a table connected to a map forwards the map dependencies too, the chain is converted with the map sender
    const getInteractions = !sender?.mapSync ? TABLE_LEGACY_RECEIVER_INTERACTIONS[receiver?.widgetType] : null;
    const interactions = getInteractions ? getInteractions(receiver, sender, widgets) : [];
    return interactions.length
        ? { interactions, receiver: omit(receiver, ['mapSync', 'dependenciesMap']) }
        : null;
};

const readsLegacyKey = (receiver, key) => typeof receiver?.dependenciesMap?.[key] === 'string';

// legends stay legacy until the legend phase
const MAP_LEGACY_RECEIVER_INTERACTIONS = {
    counter: (receiver, sender, sourceNodePath) => readsLegacyKey(receiver, 'viewport') && receiver.geomProp
        ? [legacyInteraction(sender, TARGET_TYPES.APPLY_SPATIAL_FILTER, `widgets[${receiver.id}]`, null, sourceNodePath)]
        : [],
    table: (receiver, sender, sourceNodePath) => readsLegacyKey(receiver, 'viewport') && receiver.geomProp
        ? [legacyInteraction(sender, TARGET_TYPES.APPLY_SPATIAL_FILTER, `widgets[${receiver.id}]`, null, sourceNodePath)]
        : [],
    chart: (receiver, sender, sourceNodePath) => readsLegacyKey(receiver, 'viewport')
        ? (receiver.charts || []).flatMap(chart => (chart.traces || [])
            .filter(trace => trace?.geomProp)
            .map(trace => legacyInteraction(sender, TARGET_TYPES.APPLY_SPATIAL_FILTER,
                `widgets[${receiver.id}].charts[${chart.chartId || chart.id}].traces[${trace.id}]`, null, sourceNodePath)))
        : [],
    // the old connection moved the selected map, each map of the receiver follows the sender map now
    map: (receiver, sender, sourceNodePath) => readsLegacyKey(receiver, 'center') || readsLegacyKey(receiver, 'zoom')
        ? (receiver.maps || []).map(map => legacyInteraction(sender, TARGET_TYPES.APPLY_VIEW_SYNC,
            `widgets[${receiver.id}].maps[${map.mapId}].${TARGET_TYPES.APPLY_ZOOM_TO}`, null, sourceNodePath))
        : []
};

/**
 * Converts a receiver connected to a map widget into interactions of the map widget, spatial filter or view sync
 * @param {object} receiver the connected receiver widget
 * @param {object} sender the map widget
 * @param {object} source the legacy connection source, with the `mapId` of the connected map
 * @returns {object|null} `{ interactions, receiver }`, null when the connection must stay legacy
 */
export const convertMapLegacyConnection = (receiver, sender, source) => {
    const mapId = source?.mapId || sender?.selectedMapId || sender?.maps?.[0]?.mapId;
    const getInteractions = mapId ? MAP_LEGACY_RECEIVER_INTERACTIONS[receiver?.widgetType] : null;
    const interactions = getInteractions ? getInteractions(receiver, sender, `widgets[${sender.id}].maps[${mapId}]`) : [];
    return interactions.length
        ? { interactions, receiver: omit(receiver, ['mapSync', 'dependenciesMap']) }
        : null;
};

/**
 * Writes the current effects of the converted interactions into a targeted widget, so converted resources show filtered data on load
 * @param {object} widget the targeted widget
 * @param {object} sender the sender widget
 * @param {object[]} interactions the converted interactions targeting the widget, with their ids
 * @returns {object} the widget with the applied effects
 */
export const writeLegacyConnectionEffects = (widget, sender, interactions) => {
    const buildAppliedData = SENDER_DATA_BUILDERS[sender?.widgetType];
    const sourceIds = getSenderSourceIds(sender);
    return interactions.reduce((updated, interaction) => {
        const applyEffect = TARGET_EFFECTS[interaction.targetType];
        const sourceId = sourceIds.find(id => interaction.source?.nodePath?.includes(id));
        const context = { widgets: [updated] };
        const appliedData = applyEffect && buildAppliedData ? buildAppliedData(sender, sourceId, interaction, context) : null;
        if (!appliedData) {
            return updated;
        }
        const update = applyEffect({ ...interaction, appliedData, "transient": isTransientEffectSender(sender) }, context);
        return update?.type === INTERACTION_UPDATES.WIDGET_PROPERTY && update.mode !== 'merge'
            ? { ...updated, [update.key]: update.value }
            : updated;
    }, widget);
};

/**
 * Legacy connection converters by sender widget type: `(receiver, sender, source, widgets) => ({ interactions, receiver }) | null`
 */
export const LEGACY_CONNECTION_CONVERTERS = {
    table: convertTableLegacyConnection,
    map: convertMapLegacyConnection
};

/**
 * Writers of the converted interaction effects into a targeted widget, by sender widget type: `(widget, sender, interactions) => widget`
 */
export const LEGACY_CONNECTION_EFFECT_WRITERS = {
    table: writeLegacyConnectionEffects,
    map: writeLegacyConnectionEffects
};

const mergeInteractions = (existing = [], added = []) => {
    const existingIds = existing.map(interaction => interaction?.id);
    return [...existing, ...added.filter(interaction => !existingIds.includes(interaction?.id))];
};

/**
 * Converts legacy widget connections (`mapSync`, `dependenciesMap`) into sender interactions
 * @param {object} config widgets configuration with `widgets`
 * @param {object} [converters] converters by sender widget type
 * @param {object} [effectWriters] effect writers by sender widget type
 * @returns {object} the converted configuration, the same object when nothing is converted
 */
export const migrateLegacyConnections = (config, converters = LEGACY_CONNECTION_CONVERTERS, effectWriters = LEGACY_CONNECTION_EFFECT_WRITERS) => {
    const widgets = config?.widgets;
    if (!Array.isArray(widgets) || isEmpty(converters)) {
        return config;
    }
    const addedBySender = {};
    const receivers = {};
    widgets.forEach(widget => {
        const source = getLegacyConnectionSource(widget);
        // the main map is not a sender yet, its connections stay legacy
        const sender = source && source.senderId !== MAIN_MAP_SENDER_ID
            ? widgets.find(w => w.id === source.senderId)
            : undefined;
        const result = sender ? converters[sender.widgetType]?.(widget, sender, source, widgets) : null;
        if (!result) {
            return;
        }
        const interactions = (result.interactions || []).map(interaction => ({ ...interaction, id: getLegacyInteractionId(widget.id, interaction) }));
        addedBySender[source.senderId] = [...(addedBySender[source.senderId] || []), ...interactions];
        receivers[widget.id] = result.receiver || widget;
    });
    if (isEmpty(receivers)) {
        return config;
    }
    // effects are written into every targeted widget, also the ones chained through a converted receiver
    const writeEffects = (widget) => Object.entries(addedBySender).reduce((updated, [senderId, added]) => {
        const sender = widgets.find(w => w.id === senderId);
        const writer = effectWriters?.[sender?.widgetType];
        const targeting = added.filter(interaction => extractWidgetIdFromNodePath(interaction?.target?.nodePath) === widget.id);
        return writer && targeting.length ? writer(updated, sender, targeting) : updated;
    }, receivers[widget.id] || widget);
    return {
        ...config,
        widgets: widgets.map(widget => {
            const updated = writeEffects(widget);
            return addedBySender[widget.id]
                ? { ...updated, interactions: mergeInteractions(updated.interactions, addedBySender[widget.id]) }
                : updated;
        })
    };
};
