/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { connect } = require('react-redux');
const { createSelector } = require('reselect');
const { compose, withState, defaultProps } = require('recompose');

const inlineWidgets = require('./inlineWidgets');

const {
    selectStyleTemplate,
    updateStatus,
    addStyle,
    createStyle,
    updateStyleCode,
    editStyleCode,
    deleteStyle
} = require('../../actions/styleeditor');

const { updateOptionsByOwner } = require('../../actions/additionallayers');

const BorderLayout = require('../../components/layout/BorderLayout');
const Editor = require('../../components/styleeditor/Editor');
const withMask = require('../../components/misc/enhancers/withMask');
const loadingState = require('../../components/misc/enhancers/loadingState');
const emptyState = require('../../components/misc/enhancers/emptyState');
const Loader = require('../../components/misc/Loader');
const Message = require('../../components/I18N/Message');

const {
    templateIdSelector,
    statusStyleSelector,
    codeStyleSelector,
    geometryTypeSelector,
    formatStyleSelector,
    loadingStyleSelector,
    errorStyleSelector,
    layerPropertiesSelector,
    initialCodeStyleSelector,
    addStyleSelector,
    selectedStyleSelector,
    canEditStyleSelector,
    getAllStyles
} = require('../../selectors/styleeditor');

const { isAdminUserSelector } = require('../../selectors/security');
const { getEditorMode, STYLE_OWNER_NAME, getStyleTemplates } = require('../../utils/StyleEditorUtils');

const stylesTemplates = getStyleTemplates();

const permissionDeniedEnhancers = emptyState(({canEdit}) => !canEdit, {glyph: 'exclamation-mark', title: <Message msgId="styleeditor.noPermission"/>});

const loadingEnhancers = (funcBool) => loadingState(
    funcBool,
    {
        size: 150,
        style: {
            margin: 'auto'
        }
    },
    props => <div style={{position: 'relative', height: '100%', display: 'flex'}}><Loader {...props}/></div>
);

const StyleCodeEditor = compose(
    defaultProps({
        inlineWidgets
    }),
    connect(
        createSelector(
            [
                codeStyleSelector,
                formatStyleSelector,
                layerPropertiesSelector,
                errorStyleSelector,
                loadingStyleSelector,
                canEditStyleSelector
            ],
            (code, format, hintProperties, error, loading, canEdit) => ({
                code,
                mode: getEditorMode(format),
                hintProperties,
                error: error.edit || null,
                loading,
                canEdit
            })
        ),
        {
            onChange: code => editStyleCode(code)
        }
    ),
    loadingEnhancers(({code, error}) => !code && !error),
    permissionDeniedEnhancers,
    emptyState(({error}) => error && error.status === 404, {glyph: 'exclamation-mark', title: <Message msgId="styleeditor.styleNotFound"/>})
)(props => (
    <BorderLayout>
        <Editor {...props} />
    </BorderLayout>
));

const StyleTemplates = compose(
    defaultProps({
        templates: stylesTemplates
    }),
    connect(
        createSelector(
            [
                templateIdSelector,
                addStyleSelector,
                geometryTypeSelector,
                canEditStyleSelector
            ],
            (selectedStyle, add, geometryType, canEdit) => ({
                selectedStyle,
                add: add && selectedStyle,
                geometryType,
                canEdit
            })
        ),
        {
            onSelect: selectStyleTemplate,
            onClose: addStyle.bind(null, false),
            onSave: createStyle
        }
    ),
    permissionDeniedEnhancers,
    loadingEnhancers(({geometryType}) => !geometryType),
    withState('filterText', 'onFilter', ''),
    withState('styleSettings', 'onUpdate', {})
)(require('../../components/styleeditor/StyleTemplates'));

const StyleSelector = compose(
    connect(
        createSelector(
            [
                statusStyleSelector,
                getAllStyles
            ],
            (status, { defaultStyle, enabledStyle, availableStyles }) => ({
                status,
                defaultStyle,
                enabledStyle,
                availableStyles
            })
        )
    ),
    withState('filterText', 'onFilter', ''),
    withMask(
        ({ status }) => status === 'template',
        () => <StyleTemplates />,
        {
            maskContainerStyle: {
                display: 'flex',
                position: 'relative'
            },
            maskStyle: {
                overflowY: 'auto'
            }
        }
    )
)(require('../../components/styleeditor/StyleList'));

const StyleToolbar = compose(
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
                isAdminUserSelector,
                canEditStyleSelector
            ],
            (status, templateId, error, initialCode, code, loading, selectedStyle, isAdmin, canEdit) => ({
                status,
                templateId,
                error,
                isCodeChanged: initialCode !== code,
                loading,
                selectedStyle,
                editEnabled: isAdmin && canEdit
            })
        ),
        {
            onSelectStyle: updateStatus.bind(null, 'template'),
            onEditStyle: updateStatus.bind(null, 'edit'),
            onBack: updateStatus.bind(null, ''),
            onReset: updateOptionsByOwner.bind(null, STYLE_OWNER_NAME, [{}]),
            onAdd: addStyle.bind(null, true),
            onUpdate: updateStyleCode,
            onDelete: deleteStyle
        }
    )
)(require('../../components/styleeditor/StyleToolbar'));

module.exports = {
    StyleTemplates,
    StyleSelector,
    StyleToolbar,
    StyleCodeEditor
};