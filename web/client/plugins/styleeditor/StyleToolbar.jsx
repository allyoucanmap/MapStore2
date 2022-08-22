/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import { compose, withState } from 'recompose';
import { createSelector } from 'reselect';

import { updateOptionsByOwner } from '../../actions/additionallayers';
import {
    addStyle,
    deleteStyle,
    setDefaultStyle,
    updateStatus,
    updateStyleCode
} from '../../actions/styleeditor';
import StyleToolbarComp from '../../components/styleeditor/StyleToolbar';
import {
    canEditStyleSelector,
    codeStyleSelector,
    errorStyleSelector,
    getAllStyles,
    initialCodeStyleSelector,
    loadingStyleSelector,
    selectedStyleFormatSelector,
    selectedStyleSelector,
    statusStyleSelector,
    styleServiceSelector,
    templateIdSelector
} from '../../selectors/styleeditor';
import {
    STYLE_OWNER_NAME
} from '../../utils/StyleEditorUtils';

export const StyleToolbar = compose(
    withState('showModal', 'onShowModal'),
    connect(
        createSelector(
            [
                statusStyleSelector,
                templateIdSelector,
                errorStyleSelector,
                initialCodeStyleSelector,
                codeStyleSelector,
                loadingStyleSelector,
                selectedStyleSelector,
                canEditStyleSelector,
                getAllStyles,
                styleServiceSelector,
                selectedStyleFormatSelector
            ],
            (status, templateId, error, initialCode, code, loading, selectedStyle, canEdit, { defaultStyle }, { formats = [ 'sld' ] } = {}, format) => ({
                status,
                templateId,
                error,
                isCodeChanged: initialCode !== code,
                loading,
                layerDefaultStyleName: defaultStyle,
                selectedStyle: defaultStyle === selectedStyle ? '' : selectedStyle,
                editEnabled: canEdit,
                // enable edit only if service support current format
                disableCodeEditing: formats.indexOf(format) === -1
            })
        ),
        {
            onSelectStyle: updateStatus.bind(null, 'template'),
            onEditStyle: updateStatus.bind(null, 'edit'),
            onBack: updateStatus.bind(null, ''),
            onReset: updateOptionsByOwner.bind(null, STYLE_OWNER_NAME, [{}]),
            onAdd: addStyle.bind(null, true),
            onUpdate: updateStyleCode,
            onDelete: deleteStyle,
            onSetDefault: setDefaultStyle
        }
    )
)(StyleToolbarComp);

export default StyleToolbar;
