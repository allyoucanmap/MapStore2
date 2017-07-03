/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');
const {connect} = require('react-redux');
const {bindActionCreators} = require('redux');
const {get} = require('lodash');
const Dock = require('react-dock');
const Grid = require('../components/data/featuregrid/FeatureGrid');
const BottomToolbar = require('../components/data/featuregrid/BottomToolbar');
const TopToolbar = require('../components/data/featuregrid/TopToolbar');
const BorderLayout = require('../components/layout/BorderLayout');
const {tools, gridEvents, pageEvents} = require('./featuregrid/index');

const Plugin = (props) => {
    const dockProps = {
        dimMode: "none",
        dockSize: 0.35,
        fluid: true,
        isVisible: true,
        maxDockSize: 1.0,
        minDockSize: 0.1,
        position: "bottom",
        setDockSize: () => {},
        toolbar: null,
        toolbarHeight: 40,
        wrappedComponent: {},
        zIndex: 1030
    };
    return (<Dock {...dockProps} >
        <BorderLayout
             header={<TopToolbar />}
            footer={<BottomToolbar {...props.pageEvents} {...props.pagination} totalFeatures={props.totalFeatures} resultSize={props.resultSize}/>
            }
            columns={[<aside style={{backgroundColor: "red", flex: "0 0 12em"}}>column-selector</aside>]}
            >
            <Grid
            {...props.gridEvents}
            describeFeatureType={props.describe}
            features={props.features}
            minHeight={600}
            tools={props.gridTools}
         /></BorderLayout>
    </Dock>);
};

const EditorPlugin = connect((state) => ({
    features: get(state, "query.result.features"),
    resultSize: get(state, "query.result.features.length"),
    totalFeatures: get(state, "query.result.totalFeatures"),
    pagination: get(state, "query.filterObj.pagination"),
    open: get(state, "controls.featuregrid.open"),
    describe: get(state, `query.featureTypes.${get(state, "query.filterObj.featureTypeName")}.original`)
}), (dispatch) => ({
    gridEvents: bindActionCreators(gridEvents, dispatch),
    pageEvents: bindActionCreators(pageEvents, dispatch),
    gridTools: tools.map((t) => ({
        ...t,
        events: bindActionCreators(t.events, dispatch)
    }))
}))(Plugin);
module.exports = {
     FeatureEditorPlugin: EditorPlugin,
     epics: require('../epics/featuregrid'),
     reducers: {
         featuregrid: require('../reducers/featuregrid')
     }
 };
