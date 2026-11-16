/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isEmpty from 'lodash/isEmpty';

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

/**
 * Legacy connection converters by sender widget type: `(receiver, sender, source) => ({ interactions, receiver }) | null`
 */
export const LEGACY_CONNECTION_CONVERTERS = {};

const mergeInteractions = (existing = [], added = []) => {
    const existingIds = existing.map(interaction => interaction?.id);
    return [...existing, ...added.filter(interaction => !existingIds.includes(interaction?.id))];
};

/**
 * Converts legacy widget connections (`mapSync`, `dependenciesMap`) into sender interactions
 * @param {object} config widgets configuration with `widgets`
 * @param {object} [converters] converters by sender widget type
 * @returns {object} the converted configuration, the same object when nothing is converted
 */
export const migrateLegacyConnections = (config, converters = LEGACY_CONNECTION_CONVERTERS) => {
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
        const result = sender ? converters[sender.widgetType]?.(widget, sender, source) : null;
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
    return {
        ...config,
        widgets: widgets.map(widget => {
            const updated = receivers[widget.id] || widget;
            return addedBySender[widget.id]
                ? { ...updated, interactions: mergeInteractions(updated.interactions, addedBySender[widget.id]) }
                : updated;
        })
    };
};
