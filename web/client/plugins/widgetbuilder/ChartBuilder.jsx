/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {connect} from 'react-redux';

import {compose, renameProps, branch, renderComponent, withState, withProps} from 'recompose';

import BorderLayout from '../../components/layout/BorderLayout';
import {
    insertWidget,
    onEditorChange,
    setPage,
    openFilterEditor,
    changeEditorSetting
} from '../../actions/widgets';
import builderConfiguration from '../../components/widgets/enhancers/builderConfiguration';
import chartLayerSelector from './enhancers/chartLayerSelector';
import withExitButton from './enhancers/withChartExitButton';
import { wizardStateToProps, wizardSelector } from './commons';
import ChartWizard from '../../components/widgets/builder/wizard/ChartWizard';
import LayerSelector from './ChartLayerSelector';
import MapCatalogLayerSelector from './MapCatalogLayerSelector';
import withBackButton from './enhancers/withBackButton';
import BuilderHeader from './BuilderHeader';
import Toolbar from '../../components/widgets/builder/wizard/chart/Toolbar';
import { catalogEditorEnhancer } from './enhancers/catalogEditorEnhancer';

const Builder = connect(
    wizardSelector,
    {
        openFilterEditor,
        setPage,
        setValid: valid => changeEditorSetting("valid", valid),
        onConfigurationError: error => changeEditorSetting("configurationError", !!error),
        onEditorChange,
        insertWidget
    },
    wizardStateToProps
)(compose(
    builderConfiguration({needWPS: false}),
    renameProps({
        editorData: "data",
        onEditorChange: "onChange"
    })
)(ChartWizard));

// on layer error, add a back button to return to widget type selection
const withBackToWidgetTypeButton = withProps(({ stepButtons = [], settings = {}, onChange = () => {} }) => ({
    stepButtons: settings?.configurationError ? [
        {
            onClick: () => {
                // clears the previously selected layer/charts then the widget type
                onChange('chart-layers', undefined);
                onChange('widgetType', undefined);
            },
            visible: true,
            glyph: 'arrow-left',
            tooltipId: 'widgets.builder.wizard.backToWidgetTypeSelection'
        },
        ...stepButtons
    ] : stepButtons
}));

const ChartToolbar = compose(
    connect(
        wizardSelector,
        {
            openFilterEditor,
            setPage,
            onChange: onEditorChange,
            insertWidget
        },
        wizardStateToProps
    ),
    withExitButton(),
    withBackToWidgetTypeButton
)(Toolbar);

// Map-layers picker (current map layers only)
const ChartMapLayerSelector = compose(
    connect(() => ({}), {
        onLayerChoice: onEditorChange,
        onResetChange: onEditorChange
    }),
    withBackButton
)(MapCatalogLayerSelector);

/*
 * in case you don't have a layer selected (e.g. dashboard) the chart builder
 * prompts a catalog view to allow layer selection
 */
const chooseLayerEnhancer = compose(
    withState('showLayers', "toggleLayerSelector", false),
    withState('errors', 'setErrors', {}),
    connect(wizardSelector, null, wizardStateToProps),
    catalogEditorEnhancer,
    branch(
        ({layer, showLayers, editorData, dashBoardEditing} = {}) =>
            (!layer || showLayers) && (editorData?.globalWidgetMode === true || !dashBoardEditing),
        renderComponent(ChartMapLayerSelector)
    ),
    branch(
        ({layer, showLayers} = {}) => {
            return !layer || showLayers;
        },
        renderComponent(chartLayerSelector(LayerSelector))
    )
);

export default chooseLayerEnhancer(({ enabled, onClose = () => { }, exitButton, editorData, ...props} = {}) =>

    (<div className = "mapstore-chart-advance-options">
        <BorderLayout
            header={<BuilderHeader onClose={onClose}>
                <ChartToolbar
                    exitButton={exitButton}
                    editorData={editorData}
                    onClose={onClose}
                    toggleLayerSelector={props.toggleLayerSelector}
                    errors={props.errors}
                    dashboardEditing={props.dashboardEditing}
                    widgets={props.widgets}
                />
            </BuilderHeader>}
        >
            {enabled ? <Builder {...props}/> : null}
        </BorderLayout>
    </div>));
