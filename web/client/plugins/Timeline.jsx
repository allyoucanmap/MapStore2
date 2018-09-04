/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { connect } = require('react-redux');
// const BorderLayout = require('../components/layout/BorderLayout');

const Timeline = require('./timeline/Timeline');


/**
  * ZoomIn Plugin. Provides button to zoom in
  * @class  ZoomIn
  * @memberof plugins
  * @static
  *
  * @prop {object} cfg.style CSS to apply to the button
  * @prop {string} cfg.className the class name for the button
  *
  */
const TimelinePlugin = connect(() => { })(({items}) => {
    console.log(items);
    const Toolbar = items[0].plugin;
    return (<div style={{
    position: "absolute", bottom: 65, left: 100,
    right: 80, background: "rgba(255,255,255,.5)"}} className={"timeline-plugin"}>
        <div><Toolbar /> </div>
        <Timeline />
    </div>);

});

const assign = require('object-assign');


module.exports = {
    TimelinePlugin: assign(TimelinePlugin, {
        disablePluginIf: "{state('mapType') === 'cesium'}"
    }),
    reducers: {
        dimension: require('../reducers/dimension'),
        timeline: require('../reducers/timeline')
    },
    epics: require('../epics/timeline')
};
