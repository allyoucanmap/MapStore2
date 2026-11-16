/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import { compose, branch, renderComponent, withProps} from 'recompose';

import {getEditingWidget} from '../../selectors/widgets';
import { isMainMapWidget } from '../../utils/InteractionUtils';


const mapStateToProps = createSelector(
    getEditingWidget,
    (settings) => ({
        widgetType: settings && settings.widgetType,
        mainMap: isMainMapWidget(settings)
    })
);

import ChartBuilder from './ChartBuilder';
import TextBuilder from './TextBuilder';
import TableBuilder from './TableBuilder';
import MapBuilder from './MapBuilder';
import CounterBuilder from './CounterBuilder';
import LegendBuilder from './LegendBuilder';
import FilterBuilder from './FilterBuilder';
import WidgetTypeSelector from './WidgetTypeSelector';
import MainMapInteractionsBuilder from './MainMapInteractionsBuilder';
const Builders = {
    chart: ChartBuilder,
    text: TextBuilder,
    table: TableBuilder,
    map: MapBuilder,
    counter: CounterBuilder,
    legend: LegendBuilder,
    filter: FilterBuilder
};

/**
 * Allows the selection of a widget type to start the related wizard
 */
export default compose(
    connect(mapStateToProps),
    withProps(({ typeFilter = () => true, availableDependencies = []}) => ({
        // the main map interactions are available only where there is a main map (map viewer)
        typeFilter: (w = {}) => typeFilter(w)
            && !(w.type === 'legend' && availableDependencies.length === 0)
            && !(w.type === 'mainMap' && !availableDependencies.includes('map'))
    })),
    branch(
        ({widgetType} = {}) => !widgetType,
        renderComponent(WidgetTypeSelector),
        () => ({widgetType, mainMap, onClose = () => {}, ...props} = {}) => {
            const Builder = mainMap ? MainMapInteractionsBuilder : Builders[widgetType];
            return <Builder {...props} onClose={onClose} widgetType={widgetType} />;
        }
    )
)();
