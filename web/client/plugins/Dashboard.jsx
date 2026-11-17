/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { zoomToExtent } from '../actions/map';
import { error } from '../actions/notifications';
import { applyWidgetInteractions } from '../actions/interactions';
import PropTypes from 'prop-types';
import React from 'react';
import { withResizeDetector } from 'react-resize-detector';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';
import { isEmpty } from 'lodash';

import {
    changeLayout,
    deleteWidget,
    editWidget,
    exportCSV,
    updateWidgetProperty,
    toggleMaximize,
    replaceLayoutView,
    replaceWidgets,
    setSelectedLayoutViewId,
    setLinkedDashboardData
} from '../actions/widgets';
import Dashboard from '../components/dashboard/Dashboard';
import widgetsReducers from '../reducers/widgets';
import {
    dashboardResource,
    isBrowserMobile,
    isDashboardLoading,
    isDashboardAvailable,
    dashboardTitleSelector,
    buttonCanEdit
} from '../selectors/dashboard';
import { currentLocaleLanguageSelector, currentLocaleSelector } from '../selectors/locale';
import { isLocalizedLayerStylesEnabledSelector, localizedLayerStylesEnvSelector } from '../selectors/localizedLayerStyles';
import {
    getDashboardWidgets,
    getDashboardWidgetsLayout,
    getEditingWidget,
    getMaximizedState,
    getSelectedLayoutId,
    getLegendMapsSelector
} from '../selectors/widgets';
import dashboardReducers from '../reducers/dashboard';
import dashboardEpics from '../epics/dashboard';
import widgetsEpics from '../epics/widgets';
import interactionsEpics from '../epics/interactions';
import GlobalSpinner from '../components/misc/spinners/GlobalSpinner/GlobalSpinner';
import { createPlugin } from '../utils/PluginsUtils';
import usePluginItems from '../hooks/usePluginItems';
import { userSelector } from '../selectors/security';

const WidgetsView = compose(
    connect(
        createSelector(
            dashboardResource,
            getDashboardWidgets,
            getDashboardWidgetsLayout,
            (state) => getEditingWidget(state),
            isDashboardLoading,
            isBrowserMobile,
            currentLocaleLanguageSelector,
            isLocalizedLayerStylesEnabledSelector,
            localizedLayerStylesEnvSelector,
            getMaximizedState,
            currentLocaleSelector,
            isDashboardAvailable,
            getSelectedLayoutId,
            buttonCanEdit,
            userSelector,
            getLegendMapsSelector,
            (resource, widgets, layouts, editingWidget, loading, isMobile, currentLocaleLanguage, isLocalizedLayerStylesEnabled,
                env, maximized, currentLocale, isDashboardOpened, selectedLayoutId, edit, user, legendMaps) => ({
                resource,
                loading,
                canEdit: edit,
                layouts,
                editingWidget,
                widgets: !isEmpty(maximized) && Array.isArray(maximized.widget) && maximized.widget.some(w => w.layoutId === selectedLayoutId)
                    ? widgets.filter(w => maximized.widget.some(mw => mw.id === w.id))
                    : widgets,
                language: isLocalizedLayerStylesEnabled ? currentLocaleLanguage : null,
                env,
                maximized: !isEmpty(maximized) && (
                    (Array.isArray(maximized.widget)
                        ? maximized.widget.every(w => w.layoutId !== selectedLayoutId)
                        : maximized.widget.layoutId !== selectedLayoutId
                    )
                ) ? {} : maximized,
                currentLocale,
                isDashboardOpened,
                selectedLayoutId,
                user,
                legendMaps
            })
        ), {
            editWidget,
            updateWidgetProperty,
            onApplyWidgetInteractions: applyWidgetInteractions,
            onZoomToExtent: zoomToExtent,
            onNotifyError: error,
            exportCSV,
            deleteWidget,
            onLayoutChange: changeLayout,
            toggleMaximize,
            onLayoutViewReplace: replaceLayoutView,
            onWidgetsReplace: replaceWidgets,
            onLayoutViewSelected: setSelectedLayoutViewId,
            onLinkedDashboardDataLoad: setLinkedDashboardData
        }
    ),
    withProps(() => ({
        style: {
            height: "100%",
            overflow: "auto"
        }
    }))
)(Dashboard);

/**
 * Dashboard Plugin. Renders the main dashboard UI.
 * @static
 * @memberof plugins
 * @name Dashboard
 * @class Dashboard
 * @prop {boolean} cfg.enabled if true, render the plugin
 * @prop {number} cfg.rowHeight Rows have a static height
 * @prop {object} cfg.cols Number of columns in this layout. default { lg: 6, md: 6, sm: 4, xs: 2, xxs: 1 }
 * @prop {object} cfg.minLayoutWidth minimum size of the layout, below this size the widgets are listed in a single column
 * for more info about rowHeight and cols, see https://github.com/STRML/react-grid-layout#grid-layout-props
 * @prop {object} cfg.widgetOpts can be used to configure widget specific options.
 * Currently, it explicitly supports table widget with following options
 * @example
 * {
 *   "name": "Dashboard",
 *   "cfg": {
 *      "rowHeight": 150,
 *      "cols": { lg: 6, md: 6, sm: 4, xs: 2, xxs: 1 },
 *      "widgetOpts": {
 *          "table": {
 *              gridOpts: {
 *                  rowHeight: 20,
 *                  headerRowHeight: 20,
 *                  headerFiltersHeight: 20
 *              }
 *          }
 *      }
 *   }
 * }
 * @prop {object} cfg.configureViewOptions options to pass to the configure view
 * @prop {object} cfg.configureViewOptions.query query parameters to pass to the configure view
 * @prop {object} cfg.configureViewOptions.resourcesType resources type to pass to the configure view
 * @example
 * {
 *   "name": "Dashboard",
 *   "cfg": {
 *      "configureViewOptions": {
 *         "query": {
 *            "filter": "dashboard"
 *         },
 *         "resourcesType": ["DASHBOARD"]
 *      }
 *   }
 * }
 */
class DashboardPlugin extends React.Component {
    static propTypes = {
        items: PropTypes.array,
        enabled: PropTypes.bool,
        rowHeight: PropTypes.number,
        cols: PropTypes.object,
        minLayoutWidth: PropTypes.number,
        widgetOpts: PropTypes.object,
        enableZoomInTblWidget: PropTypes.bool,
        dashboardTitle: PropTypes.string,
        configureViewOptions: PropTypes.object
    };
    static defaultProps = {
        enabled: true,
        minLayoutWidth: 480,
        enableZoomInTblWidget: true,
        configureViewOptions: {
            resourcesType: ["DASHBOARD"]
        }
    };
    componentDidMount() {
        let isExistingDashboardResource = this.props?.did;
        if (isExistingDashboardResource) {
            this.oldDocumentTitle = document.title;
        }
    }
    componentDidUpdate() {
        let isExistingDashboardResource = this.props?.did;
        if (this.props.dashboardTitle && isExistingDashboardResource) {
            document.title = this.props.dashboardTitle;
        }
    }
    componentWillUnmount() {
        let isExistingDashboardResource = this.props?.did;
        if (isExistingDashboardResource) {
            document.title = this.oldDocumentTitle;
        }
    }
    render() {
        return this.props.enabled
            ? <WidgetsView
                items={this.props.items}
                width={this.props.width}
                height={this.props.height}
                rowHeight={this.props.rowHeight}
                cols={this.props.cols}
                minLayoutWidth={this.props.minLayoutWidth}
                enableZoomInTblWidget={this.props.enableZoomInTblWidget}
                widgetOpts={this.props.widgetOpts}
                isDashboardWidget
                configureViewOptions={this.props.configureViewOptions}
            />
            : null;

    }
}

const DashboardComponentWrapper = (props, context) => {
    const { loadedPlugins } = context;
    const items = usePluginItems({ items: props.items, loadedPlugins })
        .filter(({ target }) => target === 'menu');

    return <DashboardPlugin {...props} items={items}/>;
};

DashboardComponentWrapper.contextTypes = {
    loadedPlugins: PropTypes.object
};

export default createPlugin("Dashboard", {
    component: connect((state) => ({dashboardTitle: dashboardTitleSelector(state)}))(withResizeDetector(DashboardComponentWrapper)),
    reducers: {
        dashboard: dashboardReducers,
        widgets: widgetsReducers
    },
    containers: {
        SidebarMenu: {
            name: "Dashboard-spinner",
            alwaysVisible: true,
            position: 2000,
            tool: connect((state) => ({
                loading: isDashboardLoading(state)
            }))(GlobalSpinner)
        }
    },
    epics: {
        ...dashboardEpics,
        ...widgetsEpics,
        ...interactionsEpics
    }
});
