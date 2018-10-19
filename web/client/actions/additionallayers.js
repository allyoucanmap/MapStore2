
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const UPDATE_ADDITIONAL_LAYER = 'ADDITIONALLAYER:UPDATE_ADDITIONAL_LAYER';
const UPDATE_OPTIONS_BY_OWNER = 'ADDITIONALLAYER:UPDATE_OPTIONS_BY_OWNER';
const REMOVE_ADDITIONAL_LAYER = 'ADDITIONALLAYER:REMOVE_ADDITIONAL_LAYER';

const updateAdditionalLayer = (id, owner, actionType, settings, options) => {
    return {
        type: UPDATE_ADDITIONAL_LAYER,
        id,
        owner,
        actionType,
        settings,
        options
    };
};

const updateOptionsByOwner = (owner, options) => {
    return {
        type: UPDATE_OPTIONS_BY_OWNER,
        owner,
        options
    };
};

const removeAdditionalLayer = ({id, owner}) => {
    return {
        type: REMOVE_ADDITIONAL_LAYER,
        id,
        owner
    };
};

module.exports = {
    UPDATE_ADDITIONAL_LAYER,
    updateAdditionalLayer,
    REMOVE_ADDITIONAL_LAYER,
    removeAdditionalLayer,
    UPDATE_OPTIONS_BY_OWNER,
    updateOptionsByOwner
};
