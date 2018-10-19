/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
    SELECT_STYLE,
    UPDATE_TEMPORARY_STYLE,
    UPDATE_STATUS,
    ERROR_STYLE,
    ADD_STYLE,
    RESET_STYLE_EDITOR,
    LOADING_STYLE,
    LOADED_STYLE
} = require('../actions/styleeditor');

function styleeditor(state = {}, action) {
    switch (action.type) {
        case SELECT_STYLE: {
            return {
                ...state,
                selectedStyle: action.selectedStyle,
                enabled: true
            };
        }
        case UPDATE_TEMPORARY_STYLE: {
            return {
                ...state,
                temporaryId: action.temporaryId,
                templateId: action.templateId,
                code: action.code,
                format: action.format,
                error: null,
                initialCode: action.init ? action.code : state.initialCode
            };
        }
        case UPDATE_STATUS: {
            if (action.status === '') {
                return {
                    ...state,
                    status: action.status,
                    code: '',
                    templateId: '',
                    initialCode: '',
                    addStyle: false,
                    error: {}
                };
            }
            return {
                ...state,
                status: action.status
            };
        }
        case RESET_STYLE_EDITOR: {
            return {};
        }
        case ADD_STYLE: {
            return {...state, addStyle: action.add};
        }
        case LOADING_STYLE: {
            return {
                ...state,
                loading: action.status || true,
                error: {}
            };
        }
        case LOADED_STYLE: {
            return {
                ...state,
                loading: false
            };
        }
        case ERROR_STYLE: {
            const message = action.error && action.error.statusText || '';
            const position = message.match(/line\s([\d]+)|column\s([\d]+)/g);
            const errorInfo = position && position.length === 2 && position.reduce((info, pos) => {
                const splittedValues = pos.split(' ');
                const param = splittedValues[0];
                const value = parseFloat(splittedValues[1]);
                return param && !isNaN(value) && {
                    ...info,
                    [param]: value
                } || { ...info };
            }, { message }) || { message };
            return {
                ...state,
                loading: false,
                error: {
                    ...state.error,
                    [action.status || 'global']: {
                        status: action.error && action.error.status || 404,
                        ...errorInfo
                    }
                }
            };
        }
        default:
            return state;
    }
}

module.exports = styleeditor;
