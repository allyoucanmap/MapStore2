/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import url from 'url';
if (!global.Symbol) {
    require("babel-polyfill");
}

const urlQuery = url.parse(window.location.href, true).query;

class Debug extends React.Component {
    state = {
        DevTools: null
    }
    componentWillMount() {
        if (urlQuery && urlQuery.debug && __DEVTOOLS__ && !window.devToolsExtension) {
            import(/* webpackChunkName: 'dev-tools' */'./DevTools')
                .then((mod) => {
                    this.setState({
                        DevTools: mod.default
                    });
                });
        }
    }
    render() {
        const { DevTools } = this.state;
        return DevTools ? <DevTools /> : null;
    }
}

export default Debug;
