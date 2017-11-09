const PropTypes = require('prop-types');
/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const {connect} = require('react-redux');

require('./toolbar/assets/css/toolbar.css');

const {CSSTransitionGroup} = require('react-transition-group');
const {cssStatusSelector} = require('../selectors/controls');
const {createSelector} = require('reselect');

const assign = require('object-assign');

const ToolsContainer = require('./containers/ToolsContainer');

class AnimatedContainer extends React.Component {
    render() {
        const {children, ...props} = this.props;
        return (<CSSTransitionGroup {...props} transitionName="toolbarexpand" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
            {children}
        </CSSTransitionGroup>);
    }
}

class Toolbar extends React.Component {
    static propTypes = {
        id: PropTypes.string,
        tools: PropTypes.array,
        mapType: PropTypes.string,
        style: PropTypes.object,
        panelStyle: PropTypes.object,
        panelClassName: PropTypes.string,
        active: PropTypes.string,
        items: PropTypes.array,
        allVisible: PropTypes.bool,
        layout: PropTypes.string,
        stateSelector: PropTypes.string,
        buttonStyle: PropTypes.string,
        buttonSize: PropTypes.string,
        pressedButtonStyle: PropTypes.string,
        btnConfig: PropTypes.object,
        cssStatus: PropTypes.string
    };

    static contextTypes = {
        messages: PropTypes.object,
        router: PropTypes.object
    };

    static defaultProps = {
        id: "mapstore-toolbar",
        style: {},
        panelStyle: {
            minWidth: "300px",
            right: "52px",
            zIndex: 100,
            position: "absolute",
            overflow: "auto",
            left: "450px"
        },
        panelClassName: "toolbar-panel",
        items: [],
        allVisible: true,
        layout: "vertical",
        stateSelector: "toolbar",
        buttonStyle: 'primary',
        buttonSize: null,
        pressedButtonStyle: 'success',
        btnConfig: {
            className: "square-button"
        },
        cssStatus: "panel-open"
    };

    getPanel = (tool) => {
        if (tool.panel === true) {
            return tool.plugin;
        }
        return tool.panel;
    };

    getPanels = () => {
        return this.getTools()
            .filter((tool) => tool.panel)
            .map((tool) => ({name: tool.name, title: tool.title, cfg: tool.cfg, panel: this.getPanel(tool), items: tool.items, wrap: tool.wrap || false}));
    };

    getTools = () => {
        const unsorted = this.props.items
            .filter((item) => item.alwaysVisible || this.props.allVisible)
            .map((item, index) => assign({}, item, {position: item.position || index}));
        return unsorted.sort((a, b) => a.position - b.position);
    };

    render() {
        return (<ToolsContainer id={this.props.id} className={"mapToolbar btn-group-" + this.props.layout + this.props.cssStatus}
            toolCfg={this.props.btnConfig}
            container={AnimatedContainer}
            mapType={this.props.mapType}
            toolStyle={this.props.buttonStyle}
            activeStyle={this.props.pressedButtonStyle}
            toolSize={this.props.buttonSize}
            stateSelector={this.props.stateSelector}
            tools={this.getTools()}
            panels={this.getPanels()}
            activePanel={this.props.active}
            style={this.props.style}
            panelStyle={this.props.panelStyle}
            panelClassName={this.props.panelClassName}
            />);
    }
}

const toolbarSelector = stateSelector => createSelector([
        state => state.controls && state.controls[stateSelector] && state.controls[stateSelector].active,
        state => state.controls && state.controls[stateSelector] && state.controls[stateSelector].expanded,
        cssStatusSelector,
        state => state.featuregrid && state.featuregrid.dockSize,
        state => state.featuregrid && state.featuregrid.open
    ], (active, allVisible, cssStatus, dockSize, featuregridOpen) => ({
        active,
        allVisible,
        stateSelector,
        cssStatus,
        layout: cssStatus.match('mapstore-featuregrid-open') ? 'horizontal' : 'vertical',
        style: featuregridOpen && {bottom: (dockSize * 100) + '%'} || {}
}));

module.exports = {
    ToolbarPlugin: (stateSelector = 'toolbar') => connect(toolbarSelector(stateSelector))(Toolbar),
    reducers: {controls: require('../reducers/controls')}
};
