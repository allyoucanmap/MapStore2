/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const { connect } = require('react-redux');
const {createSelector} = require('reselect');
const Timeline = require('./timeline/Timeline');
const InlineDateTimeSelector = require('./timeline//InlineDateTimeSelector');
const Toolbar = require('../components/misc/toolbar/Toolbar');
const {currentTimeSelector} = require('../selectors/dimension');
const {withState} = require('recompose');
const { selectTime } = require('../actions/timeline');
const moment = require('moment');
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
const TimelinePlugin = connect(
    createSelector(
    currentTimeSelector,
    (currentTime) => ({
        currentTime
    })
), {
    setCurrentTime: selectTime
})(
    withState('customTimes', 'setCustomTime', {
        startPlaybackTime: new Date('July 1, 2016'),
        endPlaybackTime: new Date('July 1, 2017'),
        offsetTime: moment(new Date('January 31, 2017')).add(1, 'days')
    })(
    withState('fakeState', 'onUpdateFakeState', {})(
    ({ items, fakeState, onUpdateFakeState, currentTime = new Date('January 31, 2017'), setCurrentTime, customTimes, setCustomTime}) => {

        const Playback = items[0].plugin;

        return (<div
            style={{
                position: "absolute",
                bottom: 65,
                left: 100,
                right: fakeState.collapsed ? 'auto' : 80,
                background: "transparent"
            }}
            className={`timeline-plugin${fakeState.hideLayersName ? ' hide-layers-name' : ''}`}>

            {fakeState.toggleCurrent && <InlineDateTimeSelector
                glyph="time-current"
                tooltip="Current time"
                date={currentTime}
                onUpdate={setCurrentTime}
                className="shadow-soft"
                style={{
                    position: 'absolute',
                    top: -60,
                    left: 2
                }}/>}

            <div className="timeline-plugin-toolbar">

                {fakeState.toggleCurrent ?
                <InlineDateTimeSelector
                    glyph={'vert-dashed'}
                    tooltip="Offset time"
                    date={customTimes.offsetTime} /> :
                <InlineDateTimeSelector
                    glyph={'time-current'}
                    tooltip="Current time"
                    date={currentTime}
                    onUpdate={setCurrentTime} />}

                <Toolbar
                    btnDefaultProps={{
                        className: 'square-button-md',
                        bsStyle: 'primary'
                    }}
                    buttons={[
                        {
                            glyph: 'list',
                            tooltip: !fakeState.hideLayersName ? 'Hide layers name' : 'Show layers name',
                            bsStyle: !fakeState.hideLayersName ? 'success' : 'primary',
                            visible: !fakeState.collapsed,
                            active: !fakeState.hideLayersName,
                            onClick: () => onUpdateFakeState({...fakeState, hideLayersName: !fakeState.hideLayersName})
                        },
                        {
                            glyph: 'time-offset',
                            bsStyle: fakeState.toggleCurrent ? 'success' : 'primary',
                            active: fakeState.toggleCurrent,
                            tooltip: fakeState.toggleCurrent ? 'Disable current time with offset' : 'Enable current time with offset',
                            onClick: () => onUpdateFakeState({...fakeState, toggleCurrent: !fakeState.toggleCurrent})
                        },
                        {
                            glyph: 'playback',
                            tooltip: !fakeState.togglePlayback ? 'Enable playback controls' : 'Disable playback controls',
                            bsStyle: fakeState.togglePlayback ? 'success' : 'primary',
                            active: fakeState.togglePlayback,
                            visible: !!Playback,
                            onClick: () => onUpdateFakeState({...fakeState, togglePlayback: !fakeState.togglePlayback})
                        }
                    ]} />
                {fakeState.togglePlayback && <Playback
                    startPlaybackTime={customTimes.startPlaybackTime.toISOString()}
                    endPlaybackTime={customTimes.endPlaybackTime.toISOString()}/>}
                <Toolbar
                    btnGroupProps={{
                        className: 'timeline-plugin-toolbar-right'
                    }}
                    btnDefaultProps={{
                        className: 'square-button-md',
                        bsStyle: 'primary'
                    }}
                    buttons={[
                        {
                            tooltip: fakeState.collapsed ? 'Expand time slider' : 'Collapse time slider',
                            glyph: fakeState.collapsed ? 'resize-full' : 'resize-small',
                            onClick: () => onUpdateFakeState({...fakeState, collapsed: !fakeState.collapsed})
                        }
                    ]} />
            </div>
            {!fakeState.collapsed &&
                <Timeline
                    customTimes={customTimes}
                    setCustomTime={setCustomTime}
                    toggleCurrent={fakeState.toggleCurrent}
                    togglePlayback={fakeState.togglePlayback}
                    hideLayersName={fakeState.hideLayersName}/>}
        </div>);
    })
));

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
