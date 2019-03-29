/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const { connect } = require('react-redux');

const url = require('url');
const urlQuery = url.parse(window.location.href, true).query;

const ConfigUtils = require('@mapstore/utils/ConfigUtils');

const { loadMapConfig } = require('@mapstore/actions/config');
const { resetControls } = require('@mapstore/actions/controls');
const { mapSelector } = require('@mapstore/selectors/map');
const HolyGrail = require('@mapstore/containers/HolyGrail');

class GeoStory extends React.Component {
    static propTypes = {
        name: PropTypes.string,
        mode: PropTypes.string,
        match: PropTypes.object,
        map: PropTypes.object,
        loadMapConfig: PropTypes.func,
        reset: PropTypes.func,
        plugins: PropTypes.object,
        onPermalink: PropTypes.func
    };

    static defaultProps = {
        name: 'geostory',
        mode: 'desktop',
        loadMapConfig: () => { },
        reset: () => { },
        map: {},
        onPermalink: () => {}
    };

    render() {
        const plugins = ConfigUtils.getConfigProp('plugins') || {};
        const pagePlugins = {
            desktop: [],
            mobile: []
        };
        const pluginsConfig = {
            desktop: plugins[this.props.name] || [],
            mobile: plugins[this.props.name] || []
        };
        return (
            <HolyGrail
                id="map-viewer-container"
                pagePluginsConfig={pagePlugins}
                pluginsConfig={pluginsConfig}
                plugins={this.props.plugins}
                params={this.props.match.params}/>
        );
    }
}

module.exports = connect((state) => ({
        mode: urlQuery.mobile || state.browser && state.browser.mobile ? 'mobile' : 'desktop',
        map: mapSelector(state)
    }),
    {
        loadMapConfig,
        reset: resetControls
    }
)(GeoStory);
