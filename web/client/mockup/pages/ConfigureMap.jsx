/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const url = require('url');
const { connect } = require('react-redux');
const PropTypes = require('prop-types');
const ConfigUtils = require('../../utils/ConfigUtils');
const HolyGrail = require('../../containers/HolyGrail');
const { loadMapConfig } = require('../../actions/config');
const { initMap } = require('../../actions/map');

class ConfigureMap extends React.Component {
    static propTypes = {
        name: PropTypes.string,
        mode: PropTypes.string,
        match: PropTypes.object,
        map: PropTypes.object,
        loadMapConfig: PropTypes.func,
        reset: PropTypes.func,
        plugins: PropTypes.object,
        onPermalink: PropTypes.func,
        setLayout: PropTypes.func,
        setReadOnly: PropTypes.func,
        onInit: PropTypes.func
    };

    static defaultProps = {
        name: 'configure-map',
        mode: 'desktop',
        loadMapConfig: () => { },
        reset: () => { },
        map: {},
        onPermalink: () => {},
        setLayout: () => {},
        setReadOnly: () => {},
        onInit: () => {}
    };

    componentDidMount() {
        const urlQuery = url.parse(window.location.href, true).query;
        const mapId = 'new';
        const config = urlQuery && urlQuery.config || null;
        const { configUrl } = ConfigUtils.getConfigUrl({ mapId, config });
        this.props.onInit();
        this.props.loadMapConfig(configUrl, null);
    }

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
                id="configure-map"
                pagePluginsConfig={pagePlugins}
                pluginsConfig={pluginsConfig}
                plugins={this.props.plugins}
                params={this.props.match.params}/>
        );
    }
}

module.exports = connect(() => ({ }), {
    loadMapConfig,
    onInit: initMap
})(ConfigureMap);
