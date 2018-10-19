/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const TOGGLE_STYLE_EDITOR = 'STYLEEDITOR:TOGGLE_STYLE_EDITOR';
const SELECT_STYLE = 'STYLEEDITOR:SELECT_STYLE';
const SELECT_STYLE_TEMPLATE = 'STYLEEDITOR:SELECT_STYLE_TEMPLATE';
const UPDATE_TEMPORARY_STYLE = 'STYLEEDITOR:UPDATE_TEMPORARY_STYLE';
const UPDATE_STATUS = 'STYLEEDITOR:UPDATE_STATUS';
const RESET_STYLE_EDITOR = 'STYLEEDITOR:RESET_STYLE_EDITOR';

const ADD_STYLE = 'STYLEEDITOR:ADD_STYLE';
const CREATE_STYLE = 'STYLEEDITOR:CREATE_STYLE';
const LOADING_STYLE = 'STYLEEDITOR:LOADING_STYLE';
const LOADED_STYLE = 'STYLEEDITOR:LOADED_STYLE';
const ERROR_STYLE = 'STYLEEDITOR:ERROR_STYLE';
const UPDATE_STYLE_CODE = 'STYLEEDITOR:UPDATE_STYLE_CODE';
const EDIT_STYLE_CODE = 'STYLEEDITOR:EDIT_STYLE_CODE';
const DELETE_STYLE = 'STYLEEDITOR:DELETE_STYLE';

function toggleStyleEditor(layer, enabled) {
    return {
        type: TOGGLE_STYLE_EDITOR,
        layer,
        enabled
    };
}

function selectStyle(selectedStyle) {
    return {
        type: SELECT_STYLE,
        selectedStyle
    };
}

function updateStatus(status) {
    return {
        type: UPDATE_STATUS,
        status
    };
}

function selectStyleTemplate({ code, templateId, format, init } = {}) {
    return {
        type: SELECT_STYLE_TEMPLATE,
        code,
        templateId,
        format,
        init
    };
}

function updateTemporaryStyle({ temporaryId, templateId, code, format, init } = {}) {
    return {
        type: UPDATE_TEMPORARY_STYLE,
        temporaryId,
        templateId,
        code,
        format,
        init
    };
}

function loadingStyle(status) {
    return {
        type: LOADING_STYLE,
        status
    };
}

function loadedStyle() {
    return {
        type: LOADED_STYLE
    };
}

function createStyle(settings) {
    return {
        type: CREATE_STYLE,
        settings
    };
}

function resetStyleEditor() {
    return {
        type: RESET_STYLE_EDITOR
    };
}

function addStyle(add) {
    return {
        type: ADD_STYLE,
        add
    };
}

function errorStyle(status, error) {
    return {
        type: ERROR_STYLE,
        status,
        error
    };
}

function updateStyleCode() {
    return {
        type: UPDATE_STYLE_CODE
    };
}

function editStyleCode(code) {
    return {
        type: EDIT_STYLE_CODE,
        code
    };
}

function deleteStyle(styleName) {
    return {
        type: DELETE_STYLE,
        styleName
    };
}

module.exports = {
    UPDATE_TEMPORARY_STYLE,
    updateTemporaryStyle,
    UPDATE_STATUS,
    updateStatus,
    TOGGLE_STYLE_EDITOR,
    toggleStyleEditor,
    RESET_STYLE_EDITOR,
    resetStyleEditor,
    SELECT_STYLE_TEMPLATE,
    selectStyleTemplate,
    CREATE_STYLE,
    createStyle,
    LOADING_STYLE,
    loadingStyle,
    LOADED_STYLE,
    loadedStyle,
    ADD_STYLE,
    addStyle,
    ERROR_STYLE,
    errorStyle,
    SELECT_STYLE,
    selectStyle,
    UPDATE_STYLE_CODE,
    updateStyleCode,
    EDIT_STYLE_CODE,
    editStyleCode,
    DELETE_STYLE,
    deleteStyle
};
