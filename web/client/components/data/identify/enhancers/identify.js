/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {lifecycle, withHandlers, branch, withState, compose} = require('recompose');
const MapInfoUtils = require('../../../../utils/MapInfoUtils');
const {isEqual} = require('lodash');

const switchControlledIdentify = branch(
    ({viewerOptions}) => viewerOptions && !viewerOptions.header,
    withState(
        'index', 'setIndex', 0
    )
);

const identifyHandlers = withHandlers({
    needsRefresh: () => (props, newProps) => {
        if (newProps.enabled && newProps.point && newProps.point.pixel) {
            if (!props.point || !props.point.pixel ||
                props.point.pixel.x !== newProps.point.pixel.x ||
                props.point.pixel.y !== newProps.point.pixel.y ) {
                return true;
            }
            if (!props.point || !props.point.pixel || newProps.point.pixel && props.format !== newProps.format) {
                return true;
            }
        }
        return false;
    },
    onClose: ({hideMarker, purgeResults}) => () => {
        hideMarker();
        purgeResults();
    }
});

const identifyLifecycle = compose(
    lifecycle({
        componentDidMount() {
            if (this.props.enabled) {
                this.props.changeMousePointer('pointer');
            }
        },
        componentWillReceiveProps(newProps) {
            if (this.props.needsRefresh && this.props.needsRefresh(this.props, newProps)) {
                if (!newProps.point.modifiers || newProps.point.modifiers.ctrl !== true || !newProps.allowMultiselection) {
                    this.props.purgeResults();
                }
                const queryableLayers = newProps.layers
                    .filter(newProps.queryableLayersFilter)
                    .filter(newProps.layer ? l => l.id === newProps.layer : () => true);
                queryableLayers.forEach((layer) => {
                    const {url, request, metadata} = this.props.buildRequest(layer, newProps);
                    if (url) {
                        this.props.sendRequest(url, request, metadata, MapInfoUtils.filterRequestParams(layer, this.props.includeOptions, this.props.excludeParams));
                    } else {
                        this.props.localRequest(layer, request, metadata);
                    }

                });
                if (queryableLayers.length === 0) {
                    this.props.noQueryableLayers();
                } else {
                    if (!newProps.layer) {
                        this.props.showMarker();
                    } else {
                        this.props.hideMarker();
                    }
                }
            }

            if (newProps.enabled && !this.props.enabled) {
                this.props.changeMousePointer('pointer');
            } else if (!newProps.enabled && this.props.enabled) {
                this.props.changeMousePointer('auto');
                this.props.hideMarker();
                this.props.purgeResults();
            }
            // reset current page on new requests set
            if (this.props.setIndex && !isEqual(newProps.responses, this.props.responses)) {
                this.props.setIndex(0);
            }
        }
    })
);

module.exports = {
    identifyLifecycle,
    identifyHandlers,
    switchControlledIdentify
};
