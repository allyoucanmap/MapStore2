const PropTypes = require('prop-types');
/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

require("../assets/css/maps.css");

const {connect} = require('react-redux');

const url = require('url');
const urlQuery = url.parse(window.location.href, true).query;
const ConfigUtils = require('../../../../framework/utils/ConfigUtils');

const {resetControls} = require('../../../../framework/actions/controls');
const {loadMaps} = require('../../../../framework/actions/maps');

const Page = require('../../../../framework/containers/Page');

class MapsPage extends React.Component {
    static propTypes = {
        mode: PropTypes.string,
        match: PropTypes.object,
        reset: PropTypes.func,
        loadMaps: PropTypes.func,
        plugins: PropTypes.object
    };

    static defaultProps = {
        mode: 'desktop',
        reset: () => {}
    };

    UNSAFE_componentWillMount() {
        if (this.props.match.params.mapType && this.props.match.params.mapId) {
            if (this.props.mode === 'mobile') {
                require('../assets/css/mobile.css');
            }
            this.props.reset();
        }
    }

    render() {
        return (<Page
            id="maps"
            onMount={this.props.loadMaps}
            plugins={this.props.plugins}
            params={this.props.match.params}
        />);
    }
}

module.exports = connect((state) => ({
    mode: urlQuery.mobile || state.browser && state.browser.mobile ? 'mobile' : 'desktop'
}),
{
    loadMaps: () => loadMaps(
        ConfigUtils.getDefaults().geoStoreUrl,
        ConfigUtils.getDefaults().initialMapFilter || "*"
    ),
    reset: resetControls
})(MapsPage);
