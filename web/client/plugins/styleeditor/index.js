/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { lazy }  from 'react';
import { connect } from 'react-redux';
import { branch, compose, defaultProps, lifecycle, withState } from 'recompose';
import { createSelector } from 'reselect';

import { getLayerCapabilities } from '../../actions/layerCapabilities';
import { updateSettingsParams } from '../../actions/layers';
import {
    addStyle,
    createStyle,
    selectStyleTemplate
} from '../../actions/styleeditor';
import Message from '../../components/I18N/Message';
import BorderLayout from '../../components/layout/BorderLayout';
import emptyState from '../../components/misc/enhancers/emptyState';
import loadingState from '../../components/misc/enhancers/loadingState';
import withMask from '../../components/misc/enhancers/withMask';
import Loader from '../../components/misc/Loader';
import StyleListComp from '../../components/styleeditor/StyleList';
import StyleTemplatesComp from '../../components/styleeditor/StyleTemplates';
import {
    addStyleSelector,
    canEditStyleSelector,
    geometryTypeSelector,
    getAllStyles,
    getUpdatedLayer,
    loadingStyleSelector,
    statusStyleSelector,
    styleServiceSelector,
    templateIdSelector
} from '../../selectors/styleeditor';
import {
    getStyleTemplates
} from '../../utils/StyleEditorUtils';

import withSuspense from '../../components/misc/withSuspense';
export const StyleCodeEditor = withSuspense()(lazy(() => import('./StyleCodeEditor')));

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

export const StyleTemplates = compose(
    defaultProps({
        templates: stylesTemplates
    }),
    connect(
        createSelector(
            [
                templateIdSelector,
                addStyleSelector,
                geometryTypeSelector,
                canEditStyleSelector,
                styleServiceSelector,
                loadingStyleSelector
            ],
            (selectedStyle, add, geometryType, canEdit, { formats = [] } = {}, loading) => ({
                selectedStyle,
                add: add && selectedStyle,
                geometryType,
                canEdit,
                availableFormats: formats,
                loading
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
)(StyleTemplatesComp);

export const StyleList = compose(
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
        ),
        {
            onSelect: updateSettingsParams
        }
    ),
    withState('filterText', 'onFilter', ''),
    withMask(
        ({ status, readOnly }) => status === 'template' && !readOnly,
        () => <StyleTemplates />,
        {
            maskContainerStyle: {
                display: 'flex',
                position: 'relative'
            },
            maskStyle: {
                overflowY: 'auto',
                left: 0
            }
        }
    )
)(StyleListComp);

const ReadOnlyStyleList = compose(
    connect(createSelector(
        [
            getUpdatedLayer
        ],
        (layer) => ({
            layer
        })
    ), {
        onInit: getLayerCapabilities
    }),
    lifecycle({
        UNSAFE_componentWillMount() {
            if (this.props.onInit && this.props.layer) {
                this.props.onInit(this.props.layer);
            }
        }
    }),
    loadingEnhancers(({ layer = {} }) => layer && layer.capabilitiesLoading)
)(
    () =>
        <BorderLayout className="ms-style-editor-container" footer={<div style={{ height: 25 }} />}>
            <StyleList readOnly />
        </BorderLayout>
);

export const StyleSelector = branch(
    ({ readOnly }) => readOnly,
    () => ReadOnlyStyleList
)(StyleList);

export default {
    StyleSelector,
    StyleTemplates,
    StyleCodeEditor
};
