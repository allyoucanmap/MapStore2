/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const { connect } = require('react-redux');
const { isString, differenceBy, trim, isEqual } = require('lodash');
const { currentTimeSelector, layersWithTimeDataSelector } = require('../../selectors/dimension');
const { selectTime, selectLayer, onRangeChanged } = require('../../actions/timeline');
const { itemsSelector, loadingSelector, selectedLayerSelector } = require('../../selectors/timeline');
const { createStructuredSelector, createSelector } = require('reselect');
const { compose, branch, withHandlers, withPropsOnChange, renderNothing, defaultProps } = require('recompose');
const moment = require('moment');
/**
 * Provides time dimension data for layers
 */
const layerData = compose(
    connect(
        createSelector(
            itemsSelector,
            layersWithTimeDataSelector,
            loadingSelector,
            (items, layers, loading) => ({ items, layers, loading })
        )
    ),
    branch(({ layers = [] }) => Object.keys(layers).length === 0, renderNothing),
    withPropsOnChange(
        (props, nextProps) => {
            const { layers = [], loading, selectedLayer, hideLayersName, customTimes, togglePlayback} = props;
            const { togglePlayback: nextTogglePlayback, layers: nextLayers, loading: nextLoading, selectedLayer: nextSelectedLayer, hideLayersName: nextHideLayersName, customTimes: newCustomTimes } = nextProps;
            return loading !== nextLoading
                || selectedLayer !== nextSelectedLayer
                || nextHideLayersName !== hideLayersName
                || !isEqual(newCustomTimes, customTimes)
                || togglePlayback !== nextTogglePlayback
                || differenceBy(layers, nextLayers || [], ({id, title, name} = {}) => id + title + name).length > 0;
        },
        // (props = {}, nextProps = {}) => Object.keys(props.data).length !== Object.keys(nextProps.data).length,
        ({ layers = [], loading = {}, selectedLayer }) => ({
            groups: layers.map((l) => ({
                id: l.id,
                className: (loading[l.id] ? "loading" : "") + ((l.id && l.id === selectedLayer) ? " selected" : ""),
                content:
                   `<div class="timeline-layer-label-container">`
                   + (loading[l.id] ? `<div class="timeline-layer-icon"><div class="timeline-spinner"></div></div>` : `<div class="timeline-layer-icon">${(l.id && l.id === selectedLayer) ? '<i class="glyphicon glyphicon-time"></i>' : ''}</div>`)
                    + `<div class="timeline-layer-title">${(isString(l.title) ? l.title : l.name)}</div></div>` // TODO: i18n for layer titles*/
            }))
        })
    )
);
/**
 * Bind current time properties and handlers
 */
const currentTimeEnhancer = compose(
    connect(
        createStructuredSelector({
            currentTime: currentTimeSelector
        }),
        {
            setCurrentTime: selectTime
        }
    ),
    defaultProps({
        currentTime: new Date('January 31, 2017')
    })
);

const layerSelectionEnhancer = compose(
    connect(
        createSelector(
            selectedLayerSelector,
            selectedLayer => ({selectedLayer})
        )
        , {
            selectGroup: selectLayer
        }
    )
);

const reverseRangeBackground = (keyStart, keyEnd, times) => {
    const start = times[keyStart];
    const end = times[keyEnd];
    const diff = moment(end).diff(start);
    return {
        [keyStart]: diff < 0 ? end : start,
        [keyEnd]: diff < 0 ? start : end
    };
};

const clickHandleEnhancer = withHandlers({
    clickHandler: ({ currentTime, setCurrentTime = () => { }, selectGroup = () => { }, setCustomTime = () => {}, customTimes = {} }) => ({ time, group, what, event } = {}) => {
        if (["axis", "group-label"].indexOf(what) < 0) {
            const target = event && event.target && event.target.closest('.vis-custom-time');
            const className = target && target.getAttribute('class');
            const customTimeId = className && trim(className.replace('vis-custom-time', ''));
            if (!customTimeId || customTimeId === 'currentTime') {
                const diff = moment(customTimes.offsetTime).diff(currentTime);
                const offsetTime = moment(time).add(diff);
                setCurrentTime(time.toISOString());
                setCustomTime({
                    ...customTimes,
                    offsetTime
                });
            } else {
                const newCustomTimes = {
                    ...customTimes,
                    [customTimeId]: time
                };
                const playbackObj = reverseRangeBackground('startPlaybackTime', 'endPlaybackTime', newCustomTimes);
                setCustomTime({
                    ...newCustomTimes,
                    ...playbackObj
                });
            }
        } else if (what === "group-label") {
            selectGroup(group);
        }
    }
});
const rangeEnhancer = compose(
    connect(() => ({}), {
        rangechangedHandler: onRangeChanged
    })
);

const getStartEnd = (startTime, endTime) => {
    const diff = moment(startTime).diff(endTime);
    return {
        start: diff >= 0 ? endTime : startTime,
        end: diff >= 0 ? startTime : endTime
    };
};

const enhance = compose(
    currentTimeEnhancer,
    layerSelectionEnhancer,
    clickHandleEnhancer,
    rangeEnhancer,
    layerData,
    withPropsOnChange(
        ['currentTime', 'customTimes', 'togglePlayback', 'toggleCurrent'],
        ({ currentTime, items, customTimes, togglePlayback, toggleCurrent }) => ({
            items: [
                ...items,
                togglePlayback ? {
                    id: 'playback-range',
                    start: moment(customTimes.startPlaybackTime),
                    end: moment(customTimes.endPlaybackTime),
                    type: 'background',
                    className: 'ms-playback-range'
                } : null,
                toggleCurrent ? {
                    id: 'current-range',
                    ...getStartEnd( moment(currentTime), moment(customTimes.offsetTime)),
                    type: 'background',
                    className: 'ms-current-range',
                    editable: {
                        remove: true,
                        updateGroup: true,
                        updateTime: true
                    }
                } : null
            ].filter(val => val),
            key: 'timeline',
            customTimes: {
                currentTime,
                ...Object.keys(customTimes).reduce((newCustomTimes, key) => {
                    if ((key === 'offsetTime') && !toggleCurrent) {
                        return {
                            ...newCustomTimes
                        };
                    }
                    if ((key === 'startPlaybackTime' || key === 'endPlaybackTime') && !togglePlayback) {
                        return {
                            ...newCustomTimes
                        };
                    }
                    return {
                        ...newCustomTimes,
                        [key]: customTimes[key]
                    };
                }, {})
            },
            options: {
                stack: false,
                showMajorLabels: true,
                showCurrentTime: false,
                zoomMin: 10,
                zoomable: true,
                type: 'background',
                margin: {
                    item: 0,
                    axis: 0
                },
                format: {
                    minorLabels: {
                        minute: 'h:mma',
                        hour: 'ha'
                    }
                },
                moment: function(date) {
                    return moment(date).utc();
                }
            }

        })
)

);
const Timeline = require('react-visjs-timeline').default;

module.exports = enhance(Timeline);
