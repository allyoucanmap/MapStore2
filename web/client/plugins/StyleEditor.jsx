/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assign from 'object-assign';
import React, { lazy } from 'react';
import { connect } from 'react-redux';
import { branch, compose, lifecycle, toClass } from 'recompose';
import { createSelector } from 'reselect';

import { updateSettingsParams } from '../actions/layers';
import { initStyleService, toggleStyleEditor } from '../actions/styleeditor';
import HTML from '../components/I18N/HTML';
import emptyState from '../components/misc/enhancers/emptyState';
import loadingState from '../components/misc/enhancers/loadingState';
import Loader from '../components/misc/Loader';
import { userRoleSelector } from '../selectors/security';
import {
    canEditStyleSelector,
    errorStyleSelector,
    getUpdatedLayer,
    loadingStyleSelector,
    statusStyleSelector,
    styleServiceSelector
} from '../selectors/styleeditor';
import StyleToolbar from './styleeditor/StyleToolbar';


import styleeditor from '../reducers/styleeditor';
import epics from '../epics/styleeditor';
import withSuspense from '../components/misc/withSuspense';

const StyleEditorPanel = withSuspense()(lazy(() => import('./styleeditor/StyleEditorPanel')));


/**
 * StyleEditor plugin.
 * - Select styles from available styles of the layer
 * - Create a new style from a list of template
 * - Remove a style
 * - Edit css style with preview
 *
 * Note: current implementation is available only in TOCItemsSettings
 * @prop {object} cfg.styleService GeoServer service in use, when undefined Style Editor creates style service based on layer options
 * @prop {string} cfg.styleService.baseUrl base url of service eg: '/geoserver/'
 * @prop {array} cfg.styleService.availableUrls a list of urls that can access directly to the style service
 * @prop {array} cfg.styleService.formats supported formats, could be one of [ 'sld' ] or [ 'sld', 'css' ]
 * @prop {array} cfg.editingAllowedRoles all roles with edit permission eg: [ 'ADMIN' ], if null all roles have edit permission
 * @prop {array} cfg.enableSetDefaultStyle enable set default style functionality
 * @prop {object} cfg.editorConfig contains editor configurations
 * @prop {object} cfg.editorConfig.classification configuration of the classification symbolizer
 * For example adding default editor configuration to the classification
 * ```
 * "cfg": {
 *    "editorConfig" : {
 *       "classification": {
 *           "intervalsForUnique": 100
 *       },
 *    }
 *  }
 * ```
 * @memberof plugins
 * @class StyleEditor
 */
const StyleEditorPlugin = compose(
    // Plugin needs to be a class
    // in this case 'branch' return always a functional component and PluginUtils expects a class
    toClass,
    // No rendering if not active
    // eg: now only TOCItemsSettings can active following plugin
    branch(
        ({ active } = {}) => !active,
        () => () => null
    ),
    // end
    connect(
        createSelector(
            [
                statusStyleSelector,
                loadingStyleSelector,
                getUpdatedLayer,
                errorStyleSelector,
                userRoleSelector,
                canEditStyleSelector,
                styleServiceSelector
            ],
            (status, loading, layer, error, userRole, canEdit, styleService) => ({
                isEditing: status === 'edit',
                loading,
                layer,
                error,
                userRole,
                canEdit,
                styleService
            })
        ),
        {
            onInit: initStyleService,
            onUpdateParams: updateSettingsParams
        },
        (stateProps, dispatchProps, ownProps) => {
            // detect if the static service has been updated with new information in the global state
            // eg: classification methods are requested asynchronously
            const isStaticServiceUpdated = ownProps.styleService?.baseUrl === stateProps.styleService?.baseUrl
                && stateProps.styleService?.isStatic;
            const newStyleService = ownProps.styleService && !isStaticServiceUpdated
                ? { ...ownProps.styleService, isStatic: true }
                : { ...stateProps.styleService };
            return {
                ...ownProps,
                ...stateProps,
                ...dispatchProps,
                styleService: newStyleService
            };
        }
    ),
    emptyState(
        ({ error }) => !!(error?.availableStyles || error?.global || error?.parsingCapabilities),
        ({ error }) => ({
            glyph: 'exclamation-mark',
            title: <HTML msgId="styleeditor.errorTitle"/>,
            description: <HTML msgId={
                error?.availableStyles && "styleeditor.missingAvailableStylesMessage" ||
                error?.parsingCapabilities && "styleeditor.parsingCapabilitiesError" ||
                error?.global && "styleeditor.globalError"
            }/>,
            style: {
                display: 'flex',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            },
            mainViewStyle: {
                margin: 'auto',
                width: 300
            }
        })
    ),
    loadingState(
        ({loading}) => loading === 'global',
        {
            size: 150,
            style: {
                margin: 'auto'
            }
        },
        props => <div style={{position: 'relative', height: '100%', display: 'flex'}}><Loader {...props}/></div>
    ),
    compose(
        connect(() => ({}), {
            toggleStyleEditor
        }),
        lifecycle({
            componentDidMount() {
                this.props.toggleStyleEditor(null, true);
            }
        })
    )
)(StyleEditorPanel);

export default {
    StyleEditorPlugin: assign(StyleEditorPlugin, {
        TOC: {
            priority: 1,
            container: 'TOCItemSettings'
        },
        TOCItemsSettings: {
            name: 'StyleEditor',
            target: 'style',
            priority: 1,
            ToolbarComponent: StyleToolbar
        }
    }),
    reducers: {
        styleeditor
    },
    epics
};
