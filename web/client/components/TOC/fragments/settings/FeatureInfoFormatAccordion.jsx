/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const MapInfoUtils = require('../../../../utils/MapInfoUtils');
const Accordions = require('../../../misc/panels/Accordions');

module.exports = class extends React.Component {
    static propTypes = {
        element: PropTypes.object,
        label: PropTypes.object,
        defaultInfoFormat: PropTypes.object,
        generalInfoFormat: PropTypes.string,
        onInfoFormatChange: PropTypes.func
    };

    static defaultProps = {
        defaultInfoFormat: MapInfoUtils.getAvailableInfoFormat(),
        generalInfoFormat: "text/plain",
        onInfoFormatChange: () => {}
    };

    getInfoFormat = (infoFormats) => {
        return Object.keys(infoFormats).map((infoFormat) => {
            return {
                id: infoFormat,
                head: {
                    title: infoFormat,
                    caption: infoFormats[infoFormat]
                },
                body: <div style={{height: 500}}>infoFormat</div>
            };
        });
    }

    render() {
        // the selected value if missing on that layer should be set to the general info format value and not the first one.
        const data = this.getInfoFormat(this.props.defaultInfoFormat);
        const checkDisabled = !!(this.props.element.featureInfo && this.props.element.featureInfo.viewer);
        console.log(data, this.props.defaultInfoFormat);
        console.log(this.props.element.featureInfo ? this.props.element.featureInfo.format : MapInfoUtils.getLabelFromValue(this.props.generalInfoFormat));
        return (
            <Accordions
                activePanel={this.props.element.featureInfo ? this.props.element.featureInfo.format : MapInfoUtils.getLabelFromValue(this.props.generalInfoFormat)}
                panels={data}
                onSelect={value => {
                    this.props.onInfoFormatChange("featureInfo", Object.assign({}, {
                        ['format']: value,
                        ['viewer']: this.props.element.featureInfo ? this.props.element.featureInfo.viewer : undefined
                    }));
                }}/>
        );
    }
};
