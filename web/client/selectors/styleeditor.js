/*
* Copyright 2018, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

const { get, head } = require('lodash');
const { additionalLayersByOwnerSelector } = require('./additionallayers');
const { STYLE_OWNER_NAME } = require('../utils/StyleEditorUtils');

const temporaryIdSelector = state => get(state, 'styleeditor.temporaryId');
const templateIdSelector = state => get(state, 'styleeditor.templateId');
const statusStyleSelector = state => get(state, 'styleeditor.status');
const errorStyleSelector = state => get(state, 'styleeditor.error') || {};
const loadingStyleSelector = state => get(state, 'styleeditor.loading');
const formatStyleSelector = state => get(state, 'styleeditor.format') || 'css';
const codeStyleSelector = state => get(state, 'styleeditor.code');
const initialCodeStyleSelector = state => get(state, 'styleeditor.initialCode') || '';
const selectedStyleSelector = state => get(state, 'styleeditor.selectedStyle') || '';
const addStyleSelector = state => get(state, 'styleeditor.addStyle') || '';
const enabledStyleEditorSelector = state => get(state, 'styleeditor.enabled');

const geometryTypeSelector = state => {
    const additionalLayers = additionalLayersByOwnerSelector(STYLE_OWNER_NAME, state);
    const currentLayer = additionalLayers && head(additionalLayers);
    return currentLayer && currentLayer.settings && currentLayer.settings.geometryType || '';
};

const layerPropertiesSelector = state => {
    const additionalLayers = additionalLayersByOwnerSelector(STYLE_OWNER_NAME, state);
    const currentLayer = additionalLayers && head(additionalLayers);
    return currentLayer && currentLayer.settings && currentLayer.settings.properties || {};
};

module.exports = {
    temporaryIdSelector,
    templateIdSelector,
    statusStyleSelector,
    errorStyleSelector,
    loadingStyleSelector,
    formatStyleSelector,
    codeStyleSelector,
    initialCodeStyleSelector,
    selectedStyleSelector,
    addStyleSelector,
    geometryTypeSelector,
    layerPropertiesSelector,
    enabledStyleEditorSelector
};
