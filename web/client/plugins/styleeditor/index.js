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

const stylesTemplates = require('./stylesTemplates');
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
    selectedStyleSelector
} = require('../../selectors/styleeditor');

const { additionalLayersByOwnerSelector } = require('../../selectors/additionallayers');
const { getSelectedLayer } = require('../../selectors/layers');
const { parseAdditionalLayerSettings, getEditorMode, STYLE_OWNER_NAME } = require('../../utils/StyleEditorUtils');

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
                loadingStyleSelector
            ],
            (code, format, hintProperties, error, loading) => ({
                code,
                mode: getEditorMode(format),
                hintProperties,
                error: error.edit || null,
                loading
            })
        ),
        {
            onChange: code => editStyleCode(code)
        }
    ),
    loadingState(
        ({code, error}) => !code && !error,
        {
            size: 150,
            style: {
                margin: 'auto'
            }
        },
        props => <div style={{position: 'relative', height: '100%', display: 'flex'}}><Loader {...props}/></div>
    ),
    emptyState(({error}) => error && error.status === 404, {title: 'Style not found'})
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
                geometryTypeSelector
            ],
            (selectedStyle, add, geometryType) => ({
                selectedStyle,
                add: add && selectedStyle,
                geometryType
            })
        ),
        {
            onSelect: selectStyleTemplate,
            onClose: addStyle.bind(null, false),
            onSave: createStyle
        }
    ),
    loadingState(({geometryType}) => !geometryType),
    withState('filterText', 'onFilter', ''),
    withState('styleSettings', 'onUpdate', {})
)(require('../../components/styleeditor/StyleTemplates'));

const StyleSelector = compose(
    connect(
        createSelector(
            [
                additionalLayersByOwnerSelector.bind(null, 'styleeditor'),
                statusStyleSelector,
                getSelectedLayer
            ],
            (additionalLayers, status, selectedLayer) => ({
                ...parseAdditionalLayerSettings(additionalLayers, selectedLayer),
                status
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
                selectedStyleSelector
            ],
            (status, templateId, error, initialCode, code, loading, selectedStyle) => ({
                status,
                templateId,
                error,
                isCodeChanged: initialCode !== code,
                loading,
                selectedStyle
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
