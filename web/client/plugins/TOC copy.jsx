/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import PropTypes from 'prop-types';

import React from 'react';
import { connect } from 'react-redux';
import { compose, branch, withPropsOnChange } from 'recompose';
import { Glyphicon } from 'react-bootstrap';

import {
    changeLayerProperties,
    changeGroupProperties,
    toggleNode,
    contextNode,
    moveNode,
    showSettings,
    hideSettings,
    updateSettings,
    updateNode,
    removeNode,
    browseData,
    selectNode,
    filterLayers,
    refreshLayerVersion,
    hideLayerMetadata,
    download
} from '../actions/layers';

import { openQueryBuilder } from '../actions/layerFilter';
import { getLayerCapabilities } from '../actions/layerCapabilities';
import { zoomToExtent } from '../actions/map';
import { error } from '../actions/notifications';
import { getSelectedAnnotationLayer  } from './Annotations/selectors/annotations';
import {
    groupsSelector,
    layersSelector,
    selectedNodesSelector,
    layerFilterSelector,
    layerSettingSelector,
    layerMetadataSelector,
    wfsDownloadSelector
} from '../selectors/layers';

import { layerSwipeSettingsSelector } from '../selectors/swipe';
import { mapSelector, mapNameSelector } from '../selectors/map';
import { currentLocaleSelector, currentLocaleLanguageSelector } from '../selectors/locale';
import { widgetBuilderAvailable } from '../selectors/controls';
import { generalInfoFormatSelector } from '../selectors/mapInfo';
import { userSelector } from '../selectors/security';
import { isLocalizedLayerStylesEnabledSelector } from '../selectors/localizedLayerStyles';
import { getNode, toggleByType } from '../utils/LayersUtils';
import { getScales, getResolutions } from '../utils/MapUtils';
import { getMessageById } from '../utils/LocaleUtils';
import Message from '../components/I18N/Message';
import assign from 'object-assign';
import layersIcon from './toolbar/assets/img/layers.png';
import { isObject, head, find, round } from 'lodash';
import { setControlProperties, setControlProperty } from '../actions/controls';
import { createWidget } from '../actions/widgets';
import { getMetadataRecordById } from '../actions/catalog';
import { isActiveSelector } from '../selectors/catalog';
import { isCesium } from '../selectors/maptype';
import { createShallowSelectorCreator } from '../utils/ReselectUtils';
import isEqual from 'lodash/isEqual';

const addFilteredAttributesGroups = (nodes, filters) => {
    return nodes.reduce((newNodes, currentNode) => {
        let node = assign({}, currentNode);
        if (node.nodes) {
            node = assign({}, node, {nodes: addFilteredAttributesGroups(node.nodes, filters)});
        }
        filters.forEach(filter => {
            if (filter.func(node)) {
                node = assign({}, node, filter.options);
            } else {
                node = assign({}, node);
            }
        });
        newNodes.push(node);
        return newNodes;
    }, []);
};

const filterLayersByTitle = (layer, filterText, currentLocale) => {
    const translation = isObject(layer.title) ? layer.title[currentLocale] || layer.title.default : layer.title;
    const title = translation || layer.name;
    return (title || '').toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
};

const tocSelector = createShallowSelectorCreator(isEqual)(
    (state) => state.controls && state.controls.toolbar && state.controls.toolbar.active === 'toc',
    groupsSelector,
    layerSettingSelector,
    layerSwipeSettingsSelector,
    layerMetadataSelector,
    wfsDownloadSelector,
    mapSelector,
    currentLocaleSelector,
    currentLocaleLanguageSelector,
    selectedNodesSelector,
    layerFilterSelector,
    layersSelector,
    mapNameSelector,
    isActiveSelector,
    widgetBuilderAvailable,
    generalInfoFormatSelector,
    isCesium,
    userSelector,
    isLocalizedLayerStylesEnabledSelector,
    getSelectedAnnotationLayer,
    (enabled, groups, settings, swipeSettings, layerMetadata, layerdownload, map, currentLocale, currentLocaleLanguage, selectedNodes, filterText, layers, mapName, catalogActive, activateWidgetTool, generalInfoFormat, isCesiumActive, user, isLocalizedLayerStylesEnabled, selectedAnnotationLayer) => ({
        enabled,
        groups,
        settings,
        swipeSettings,
        layerMetadata,
        layerdownload,
        currentZoomLvl: map && map.zoom,
        scales: getScales(
            map && map.projection || 'EPSG:3857',
            map && map.mapOptions && map.mapOptions.view && map.mapOptions.view.DPI || null
        ),
        currentLocale,
        currentLocaleLanguage,
        selectedNodes,
        filterText,
        generalInfoFormat,
        layers,
        selectedLayers: layers.filter((l) => head(selectedNodes.filter(s => s === l.id))),
        noFilterResults: layers.filter((l) => filterLayersByTitle(l, filterText, currentLocale)).length === 0,
        updatableLayersCount: layers.filter(l => l.group !== 'background' && (l.type === 'wms' || l.type === 'wmts')).length,
        selectedGroups: selectedNodes.map(n => getNode(groups, n)).filter(n => n && n.nodes),
        mapName,
        filteredGroups: addFilteredAttributesGroups(groups, [
            {
                options: {showComponent: true},
                func: () => !filterText
            },
            {
                options: {loadingError: true},
                func: (node) => head((node.nodes || []).filter(n => n.loadingError && n.loadingError !== 'Warning'))
            },
            {
                options: {expanded: true, showComponent: true},
                func: (node) => filterText && head((node.nodes || []).filter(l => filterLayersByTitle(l, filterText, currentLocale) || l.nodes && head(node.nodes.filter(g => g.showComponent))))
            },
            {
                options: { showComponent: false },
                func: (node) => head((node.nodes || []).filter(l => l.hidden)) && node.nodes.length === 1
            },
            {
                options: { exclusiveMapType: true },
                func: (node) => (node.type === "3dtiles" && !isCesiumActive) || (node.type === "cog" && isCesiumActive)
            }
        ]),
        catalogActive,
        activateWidgetTool,
        user,
        isLocalizedLayerStylesEnabled,
        selectedAnnotationLayer
    })
);

import TOC from '../components/TOC/TOC';
import Header from '../components/TOC/Header';
import Toolbar from '../components/TOC/Toolbar';
import DefaultGroup from '../components/TOC/DefaultGroup';
import DefaultLayer from '../components/TOC/DefaultLayer';
import DefaultLayerOrGroup from '../components/TOC/DefaultLayerOrGroup';

class LayerTree extends React.Component {
    static propTypes = {
        id: PropTypes.number,
        items: PropTypes.array,
        layers: PropTypes.array,
        buttonContent: PropTypes.node,
        groups: PropTypes.array,
        settings: PropTypes.object,
        swipeSettings: PropTypes.object,
        layerMetadata: PropTypes.object,
        layerdownload: PropTypes.object,
        metadataTemplate: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object, PropTypes.func]),
        refreshMapEnabled: PropTypes.bool,
        groupStyle: PropTypes.object,
        groupPropertiesChangeHandler: PropTypes.func,
        layerPropertiesChangeHandler: PropTypes.func,
        onToggleGroup: PropTypes.func,
        onToggleLayer: PropTypes.func,
        onContextMenu: PropTypes.func,
        onBrowseData: PropTypes.func,
        onQueryBuilder: PropTypes.func,
        onDownload: PropTypes.func,
        onSelectNode: PropTypes.func,
        selectedNodes: PropTypes.array,
        onZoomToExtent: PropTypes.func,
        retrieveLayerData: PropTypes.func,
        onSort: PropTypes.func,
        onSettings: PropTypes.func,
        onRefreshLayer: PropTypes.func,
        onNewWidget: PropTypes.func,
        hideSettings: PropTypes.func,
        updateSettings: PropTypes.func,
        updateNode: PropTypes.func,
        removeNode: PropTypes.func,
        activateTitleTooltip: PropTypes.bool,
        showFullTitleOnExpand: PropTypes.bool,
        activateOpacityTool: PropTypes.bool,
        activateSortLayer: PropTypes.bool,
        activateFilterLayer: PropTypes.bool,
        activateMapTitle: PropTypes.bool,
        activateToolsContainer: PropTypes.bool,
        activateRemoveLayer: PropTypes.bool,
        activateRemoveGroup: PropTypes.bool,
        activateLegendTool: PropTypes.bool,
        activateZoomTool: PropTypes.bool,
        activateQueryTool: PropTypes.bool,
        activateDownloadTool: PropTypes.bool,
        activateSettingsTool: PropTypes.bool,
        activateMetedataTool: PropTypes.bool,
        activateWidgetTool: PropTypes.bool,
        activateLayerInfoTool: PropTypes.bool,
        maxDepth: PropTypes.number,
        visibilityCheckType: PropTypes.string,
        settingsOptions: PropTypes.object,
        chartStyle: PropTypes.object,
        currentZoomLvl: PropTypes.number,
        scales: PropTypes.array,
        layerOptions: PropTypes.object,
        metadataOptions: PropTypes.object,
        spatialOperations: PropTypes.array,
        spatialMethodOptions: PropTypes.array,
        groupOptions: PropTypes.object,
        currentLocale: PropTypes.string,
        currentLocaleLanguage: PropTypes.string,
        onFilter: PropTypes.func,
        filterText: PropTypes.string,
        generalInfoFormat: PropTypes.string,
        selectedLayers: PropTypes.array,
        selectedGroups: PropTypes.array,
        mapName: PropTypes.string,
        filteredGroups: PropTypes.array,
        noFilterResults: PropTypes.bool,
        onAddLayer: PropTypes.func,
        onAddGroup: PropTypes.func,
        onError: PropTypes.func,
        onGetMetadataRecord: PropTypes.func,
        hideLayerMetadata: PropTypes.func,
        activateAddLayerButton: PropTypes.bool,
        activateAddGroupButton: PropTypes.bool,
        activateLayerFilterTool: PropTypes.bool,
        catalogActive: PropTypes.bool,
        refreshLayerVersion: PropTypes.func,
        hideOpacityTooltip: PropTypes.bool,
        layerNodeComponent: PropTypes.func,
        groupNodeComponent: PropTypes.func,
        isLocalizedLayerStylesEnabled: PropTypes.bool,
        onLayerInfo: PropTypes.func,
        onSetSwipeActive: PropTypes.func,
        updatableLayersCount: PropTypes.number,
        onSetSwipeMode: PropTypes.func,
        resolutions: PropTypes.func
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        items: [],
        layers: [],
        groupPropertiesChangeHandler: () => {},
        layerPropertiesChangeHandler: () => {},
        retrieveLayerData: () => {},
        onToggleGroup: () => {},
        onToggleLayer: () => {},
        onContextMenu: () => {},
        onToggleQuery: () => {},
        onZoomToExtent: () => {},
        onSettings: () => {},
        onRefreshLayer: () => {},
        onNewWidget: () => {},
        updateNode: () => {},
        removeNode: () => {},
        onSelectNode: () => {},
        selectedNodes: [],
        activateOpacityTool: true,
        activateTitleTooltip: true,
        showFullTitleOnExpand: false,
        activateSortLayer: true,
        activateFilterLayer: true,
        activateMapTitle: true,
        activateToolsContainer: true,
        activateLegendTool: true,
        activateZoomTool: true,
        activateSettingsTool: true,
        activateMetedataTool: true,
        activateRemoveLayer: true,
        activateRemoveGroup: true,
        activateQueryTool: true,
        activateDownloadTool: true,
        activateWidgetTool: false,
        activateLayerFilterTool: false,
        activateLayerInfoTool: true,
        maxDepth: 3,
        visibilityCheckType: "glyph",
        settingsOptions: {
            includeCloseButton: false,
            closeGlyph: "1-close",
            buttonSize: "small",
            showFeatureInfoTab: true
        },
        layerOptions: {},
        metadataOptions: {},
        groupOptions: {},
        spatialOperations: [
            {"id": "INTERSECTS", "name": "queryform.spatialfilter.operations.intersects"},
            {"id": "BBOX", "name": "queryform.spatialfilter.operations.bbox"},
            {"id": "CONTAINS", "name": "queryform.spatialfilter.operations.contains"},
            {"id": "WITHIN", "name": "queryform.spatialfilter.operations.within"}
        ],
        spatialMethodOptions: [
            {"id": "Viewport", "name": "queryform.spatialfilter.methods.viewport"},
            {"id": "BBOX", "name": "queryform.spatialfilter.methods.box"},
            {"id": "Circle", "name": "queryform.spatialfilter.methods.circle"},
            {"id": "Polygon", "name": "queryform.spatialfilter.methods.poly"}
        ],
        currentLocale: 'en-US',
        filterText: '',
        selectedLayers: [],
        selectedGroups: [],
        mapName: '',
        filteredGroups: [],
        noFilterResults: false,
        onAddLayer: () => {},
        onAddGroup: () => {},
        onError: () => {},
        onGetMetadataRecord: () => {},
        hideLayerMetadata: () => {},
        activateAddLayerButton: false,
        activateAddGroupButton: false,
        catalogActive: false,
        refreshLayerVersion: () => {},
        metadataTemplate: null,
        onLayerInfo: () => {},
        onSetSwipeMode: () => {}
    };

    getNoBackgroundLayers = (group) => {
        return group.name !== 'background';
    };

    getDefaultGroup = () => {
        const GroupNode = this.props.groupNodeComponent || DefaultGroup;
        return (
            <GroupNode
                onSort={!this.props.filterText && this.props.activateSortLayer ? this.props.onSort : null}
                {...this.props.groupOptions}
                titleTooltip={this.props.activateTitleTooltip}
                propertiesChangeHandler={this.props.groupPropertiesChangeHandler}
                onToggle={this.props.onToggleGroup}
                style={this.props.groupStyle}
                groupVisibilityCheckbox
                visibilityCheckType={this.props.visibilityCheckType}
                currentLocale={this.props.currentLocale}
                selectedNodes={this.props.selectedNodes}
                onSelect={this.props.activateToolsContainer ? this.props.onSelectNode : null}/>);
    }
    getDefaultLayer = () => {
        const LayerNode = this.props.layerNodeComponent || DefaultLayer;
        const resolutions = this.props.resolutions || getResolutions();
        const resolution = resolutions[round(this.props.currentZoomLvl)];
        return (
            <LayerNode
                {...this.props.layerOptions}
                titleTooltip={this.props.activateTitleTooltip}
                showFullTitleOnExpand={this.props.showFullTitleOnExpand}
                onToggle={this.props.onToggleLayer}
                activateOpacityTool={this.props.activateOpacityTool}
                onContextMenu={this.props.onContextMenu}
                propertiesChangeHandler={this.props.layerPropertiesChangeHandler}
                onSelect={this.props.activateToolsContainer ? this.props.onSelectNode : null}
                visibilityCheckType={this.props.visibilityCheckType}
                activateLegendTool={this.props.activateLegendTool}
                currentZoomLvl={this.props.currentZoomLvl}
                scales={this.props.scales}
                currentLocale={this.props.currentLocale}
                selectedNodes={this.props.selectedNodes}
                filterText={this.props.filterText}
                onUpdateNode={this.props.updateNode}
                hideOpacityTooltip={this.props.hideOpacityTooltip}
                language={this.props.isLocalizedLayerStylesEnabled ? this.props.currentLocaleLanguage : null}
                resolution={resolution}
            />
        );
    }

    renderTOC = () => {
        const Group = this.getDefaultGroup();
        const Layer = this.getDefaultLayer();
        const sections = [this.props.activateToolsContainer, this.props.activateFilterLayer, this.props.activateMapTitle].filter(s => s);
        const bodyClass = sections.length > 0 ? ' toc-body-sections-' + sections.length : ' toc-body-sections';
        return (
            <div>
                <Header
                    title={this.props.mapName}
                    showTitle={this.props.activateMapTitle}
                    showFilter={this.props.activateFilterLayer && (this.props.groups.filter(g => (g.nodes || []).length) || []).length}
                    showTools={this.props.activateToolsContainer}
                    onClear={() => { this.props.onSelectNode(); }}
                    onFilter={this.props.onFilter}
                    filterTooltipClear={<Message msgId="toc.clearFilter" />}
                    filterPlaceholder={getMessageById(this.context.messages, "toc.filterPlaceholder")}
                    filterText={this.props.filterText}
                    toolbar={
                        <Toolbar
                            items={this.props.items.filter(({ target }) => target === "toolbar")}
                            groups={this.props.groups}
                            layers={this.props.layers}
                            selectedLayers={this.props.selectedLayers}
                            selectedGroups={this.props.selectedGroups}
                            generalInfoFormat={this.props.generalInfoFormat}
                            settings={this.props.settings}
                            swipeSettings={this.props.swipeSettings}
                            layerMetadata={this.props.layerMetadata}
                            layerdownload={this.props.layerdownload}
                            metadataTemplate={this.props.metadataTemplate}
                            maxDepth={this.props.maxDepth}
                            activateTool={{
                                activateToolsContainer: this.props.activateToolsContainer,
                                activateRemoveLayer: this.props.activateRemoveLayer,
                                activateRemoveGroup: this.props.activateRemoveGroup,
                                activateZoomTool: this.props.activateZoomTool,
                                activateQueryTool: this.props.activateQueryTool,
                                activateDownloadTool: this.props.activateDownloadTool,
                                activateSettingsTool: this.props.activateSettingsTool,
                                activateAddLayer: this.props.activateAddLayerButton && !this.props.catalogActive,
                                activateAddGroup: this.props.activateAddGroupButton,
                                includeDeleteButtonInSettings: false,
                                activateMetedataTool: this.props.activateMetedataTool,
                                activateWidgetTool: this.props.activateWidgetTool,
                                activateLayerFilterTool: this.props.activateLayerFilterTool,
                                activateLayerInfoTool: this.props.updatableLayersCount > 0 && this.props.activateLayerInfoTool
                            }}
                            options={{
                                modalOptions: {},
                                metadataOptions: this.props.metadataOptions,
                                settingsOptions: this.props.settingsOptions
                            }}
                            style={{
                                chartStyle: this.props.chartStyle
                            }}
                            text={{
                                settingsText: <Message msgId="layerProperties.windowTitle"/>,
                                opacityText: <Message msgId="opacity"/>,
                                elevationText: <Message msgId="elevation"/>,
                                saveText: <Message msgId="save"/>,
                                closeText: <Message msgId="close"/>,
                                confirmDeleteText: <Message msgId="layerProperties.deleteLayer" />,
                                confirmDeleteMessage: <Message msgId="layerProperties.deleteLayerMessage" />,
                                confirmDeleteLayerGroupText: <Message msgId="layerProperties.deleteLayerGroup" />,
                                confirmDeleteLayerGroupMessage: <Message msgId="layerProperties.deleteLayerGroupMessage" />,
                                confirmDeleteConfirmText: <Message msgId="layerProperties.delete"/>,
                                confirmDeleteCancelText: <Message msgId="cancel"/>,
                                addLayer: <Message msgId="toc.addLayer"/>,
                                addLayerTooltip: <Message msgId="toc.addLayer" />,
                                addLayerToGroupTooltip: <Message msgId="toc.addLayerToGroup" />,
                                addGroupTooltip: <Message msgId="toc.addGroup" />,
                                addSubGroupTooltip: <Message msgId="toc.addSubGroup" />,
                                createWidgetTooltip: <Message msgId="toc.createWidget"/>,
                                zoomToTooltip: {
                                    LAYER: <Message msgId="toc.toolZoomToLayerTooltip"/>,
                                    LAYERS: <Message msgId="toc.toolZoomToLayersTooltip"/>
                                },
                                settingsTooltip: {
                                    LAYER: <Message msgId="toc.toolLayerSettingsTooltip"/>,
                                    GROUP: <Message msgId="toc.toolGroupSettingsTooltip"/>
                                },
                                featuresGridTooltip: <Message msgId="toc.toolFeaturesGridTooltip"/>,
                                downloadToolTooltip: <Message msgId="toc.toolDownloadTooltip" />,
                                trashTooltip: {
                                    LAYER: <Message msgId="toc.toolTrashLayerTooltip"/>,
                                    LAYERS: <Message msgId="toc.toolTrashLayersTooltip"/>,
                                    GROUP: <Message msgId="toc.toolTrashGroupTooltip"/>
                                },
                                reloadTooltip: {
                                    LAYER: <Message msgId="toc.toolReloadLayerTooltip"/>,
                                    LAYERS: <Message msgId="toc.toolReloadLayersTooltip"/>
                                },
                                layerMetadataTooltip: <Message msgId="toc.layerMetadata.toolLayerMetadataTooltip"/>,
                                layerMetadataPanelTitle: <Message msgId="toc.layerMetadata.layerMetadataPanelTitle"/>,
                                layerFilterTooltip: <Message msgId="toc.layerFilterTooltip"/>,
                                layerInfoTooltip: <Message msgId="toc.layerInfoTooltip"/>
                            }}
                            onToolsActions={{
                                onZoom: this.props.onZoomToExtent,
                                onNewWidget: this.props.onNewWidget,
                                onBrowseData: this.props.onBrowseData,
                                onQueryBuilder: this.props.onQueryBuilder,
                                onDownload: this.props.onDownload,
                                onUpdate: this.props.updateNode,
                                onRemove: this.props.removeNode,
                                onClear: this.props.onSelectNode,
                                onSettings: this.props.onSettings,
                                onUpdateSettings: this.props.updateSettings,
                                onRetrieveLayerData: this.props.retrieveLayerData,
                                onHideSettings: this.props.hideSettings,
                                onReload: this.props.refreshLayerVersion,
                                onAddLayer: this.props.onAddLayer,
                                onAddGroup: this.props.onAddGroup,
                                onGetMetadataRecord: this.props.onGetMetadataRecord,
                                onHideLayerMetadata: this.props.hideLayerMetadata,
                                onShow: this.props.layerPropertiesChangeHandler,
                                onLayerInfo: this.props.onLayerInfo
                            }}/>
                    }/>
                <div className={'mapstore-toc' + bodyClass}>
                    {this.props.noFilterResults && this.props.filterText ?
                        <div>
                            <div className="toc-filter-no-results"><Message msgId="toc.noFilteredResults" /></div>
                        </div>
                        :
                        <TOC onError={this.props.onError} onSort={!this.props.filterText && this.props.activateSortLayer ? this.props.onSort : null} filter={this.getNoBackgroundLayers} nodes={this.props.filteredGroups}>
                            <DefaultLayerOrGroup groupElement={Group} layerElement={Layer}/>
                        </TOC>
                    }
                </div>
            </div>
        );
    };

    render() {
        if (!this.props.groups) {
            return <div />;
        }
        return this.renderTOC();
    }
}

/**
 * enhances the TOC to check `Permissions` properties and enable/disable
 * the proper tools.
 * @ignore
 */
const securityEnhancer = withPropsOnChange(
    [
        "user",
        "addLayersPermissions", "activateAddLayerButton",
        "removeLayersPermissions", "activateRemoveLayer",
        "sortingPermission", "activateRemoveLayer",
        "addGroupsPermissions", "activateAddGroupButton",
        "removeGroupsPermissions", "activateRemoveGroup",
        "layerInfoToolPermissions", "activateLayerInfoTool"
    ],
    (props) => {
        const {
            addLayersPermissions = true,
            removeLayersPermissions = true,
            sortingPermissions = true,
            addGroupsPermissions = true,
            removeGroupsPermissions = true,
            layerInfoToolPermissions = false,
            activateAddLayerButton,
            activateRemoveLayer,
            activateSortLayer,
            activateAddGroupButton,
            activateRemoveGroup,
            activateLayerInfoTool,
            user
        } = props;

        const activateParameter = (allow, activate) => {
            const isUserAdmin = user && user.role === 'ADMIN' || false;
            return (allow || isUserAdmin) ? activate : false;
        };

        return {
            activateAddLayerButton: activateParameter(addLayersPermissions, activateAddLayerButton),
            activateRemoveLayer: activateParameter(removeLayersPermissions, activateRemoveLayer),
            activateSortLayer: activateParameter(sortingPermissions, activateSortLayer),
            activateAddGroupButton: activateParameter(addGroupsPermissions, activateAddGroupButton),
            activateRemoveGroup: activateParameter(removeGroupsPermissions, activateRemoveGroup),
            activateLayerInfoTool: activateParameter(layerInfoToolPermissions, activateLayerInfoTool)
        };
    });


/**
 * enhances the TOC to check the presence of TOC plugins to display/add buttons to the toolbar.
 * NOTE: the flags are required because of old configurations about permissions.
 * TODO: delegate button rendering and actions to the plugins (now this is only a check and some plugins are dummy, only to allow plug/unplug). Also permissions should be delegated to the related plugins
 * @ignore
 */
const checkPluginsEnhancer = branch(
    ({ checkPlugins = true }) => checkPlugins,
    withPropsOnChange(
        [
            "items",
            "activateAddLayerButton",
            "activateAddGroupButton",
            "activateLayerFilterTool",
            "activateSettingsTool",
            "FeatureEditor",
            "activateLayerInfoTool",
            "selectedAnnotationLayer"
        ],
        ({
            items = [],
            activateAddLayerButton = true,
            activateAddGroupButton = true,
            activateQueryTool = true,
            activateSettingsTool = true,
            activateLayerFilterTool = true,
            activateWidgetTool = true,
            activateLayerInfoTool = true,
            activateDownloadTool = true,
            // TODO: we should extract the toolbar button that could be injected (eg. TOCItemsSettings)
            // in this way the logic could be moved in that plugin instead
            selectedAnnotationLayer
        }) => ({
            // activateAddLayerButton: activateAddLayerButton && !!find(items, { name: "MetadataExplorer" }) || false, // requires MetadataExplorer (Catalog)
            // activateAddGroupButton: activateAddGroupButton && !!find(items, { name: "AddGroup" }) || false,
            // activateSettingsTool: activateSettingsTool && !selectedAnnotationLayer && !!find(items, { name: "TOCItemsSettings"}) || false,
            // activateQueryTool: activateQueryTool && !!find(items, {name: "FeatureEditor"}) || false,
            // activateLayerFilterTool: activateLayerFilterTool && !!find(items, {name: "FilterLayer"}) || false,
            // NOTE: activateWidgetTool is already controlled by a selector. TODO: Simplify investigating on the best approach
            // the button should hide if also widgets plugins is not available. Maybe is a good idea to merge the two plugins
            // activateWidgetTool: activateWidgetTool && !!find(items, { name: "WidgetBuilder" }) && !!find(items, { name: "Widgets" }),
            // activateLayerInfoTool: activateLayerInfoTool && !!find(items, { name: "LayerInfo" }) || false,
            // activateDownloadTool: activateDownloadTool && !!find(items, { name: "LayerDownload" }) || false
        })
    )
);

const TOCPlugin = connect(tocSelector, {
    groupPropertiesChangeHandler: changeGroupProperties,
    layerPropertiesChangeHandler: changeLayerProperties,
    retrieveLayerData: getLayerCapabilities,
    onToggleGroup: toggleByType('groups', toggleNode),
    onToggleLayer: toggleByType('layers', toggleNode),
    onContextMenu: contextNode,
    onBrowseData: browseData,
    onQueryBuilder: openQueryBuilder,
    onDownload: download,
    onSort: moveNode,
    onSettings: showSettings,
    onZoomToExtent: zoomToExtent,
    hideSettings,
    updateSettings,
    updateNode,
    removeNode,
    onSelectNode: selectNode,
    onFilter: filterLayers,
    onAddLayer: setControlProperties.bind(null, "metadataexplorer", "enabled", true, "group"),
    onAddGroup: setControlProperties.bind(null, "addgroup", "enabled", true, "parent"),
    onGetMetadataRecord: getMetadataRecordById,
    onError: error,
    hideLayerMetadata,
    onNewWidget: () => createWidget(),
    refreshLayerVersion,
    onLayerInfo: setControlProperty.bind(null, 'layerinfo', 'enabled', true, false)
})(compose(
    securityEnhancer,
    checkPluginsEnhancer
)(LayerTree));

import API from '../api/catalog';

export default {
    TOCPlugin: assign(TOCPlugin, {
        Toolbar: {
            name: 'toc',
            position: 7,
            exclusive: true,
            panel: true,
            help: <Message msgId="helptexts.layerSwitcher"/>,
            tooltip: "layers",
            wrap: true,
            title: 'layers',
            icon: <Glyphicon glyph="1-layer"/>,
            priority: 1
        },
        DrawerMenu: {
            name: 'toc',
            position: 1,
            glyph: "1-layer",
            icon: <img src={layersIcon}/>,
            buttonConfig: {
                buttonClassName: "square-button no-border",
                tooltip: "toc.layers"
            },
            priority: 2
        }
    }),
    reducers: {
        queryform: require('../reducers/queryform').default,
        query: require('../reducers/query').default
    },
    // TODO: remove this dependency, it is needed only to use getMetadataRecordById and related actions that can be moved in the TOC
    epics: require("../epics/catalog").default(API)
};
