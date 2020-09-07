/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React = require('react');

var {Panel} = require('react-bootstrap');
var I18N = require('../../../../../framework/components/I18N/I18N');

class Description extends React.Component {
    render() {
        return (<Panel className="mapstore-presentation-panel">
            <p>
                <I18N.HTML msgId="home.description" />
            </p>
        </Panel>);
    }
}

module.exports = Description;
