/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const PropTypes = require('prop-types');
const React = require('react');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
// const {Glyphicon} = require('react-bootstrap');

const {changeLayerProperties, changeGroupProperties, toggleNode, contextNode,
       sortNode, showSettings, hideSettings, updateSettings, updateNode, removeNode,
       browseData, selectNode, filterLayers, refreshLayerVersion, hideLayerMetadata,
    download} = require('../actions/layers');
const {getLayerCapabilities} = require('../actions/layerCapabilities');
const {zoomToExtent} = require('../actions/map');
const {groupsSelector, layersSelector, selectedNodesSelector, layerFilterSelector, layerSettingSelector, layerMetadataSelector, wfsDownloadSelector} = require('../selectors/layers');
const {mapSelector, mapNameSelector} = require('../selectors/map');
const {currentLocaleSelector} = require("../selectors/locale");
const {widgetBuilderAvailable} = require('../selectors/controls');
const {generalInfoFormatSelector} = require("../selectors/mapInfo");

const LayersUtils = require('../utils/LayersUtils');
const mapUtils = require('../utils/MapUtils');
const LocaleUtils = require('../utils/LocaleUtils');

const Message = require('../components/I18N/Message');
const assign = require('object-assign');

// const layersIcon = require('./toolbar/assets/img/layers.png');

const {isObject, head} = require('lodash');

const { setControlProperties} = require('../actions/controls');
const {createWidget} = require('../actions/widgets');

const {getMetadataRecordById} = require("../actions/catalog");

const {activeSelector} = require("../selectors/catalog");
const {isCesium} = require('../selectors/maptype');

const addFilteredAttributesGroups = (nodes, filters) => {
    return nodes.reduce((newNodes, currentNode) => {
        let node = assign({}, currentNode);
        if (node.nodes) {
            node = assign({}, node, {nodes: addFilteredAttributesGroups(node.nodes, filters)});
        }
        filters.forEach(filter => {
            if (node.nodes && filter.func(node)) {
                node = assign({}, node, filter.options);
            } else if (node.nodes) {
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
    return title.toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
};

const tocSelector = createSelector(
    [
        (state) => state.controls && state.controls.toolbar && state.controls.toolbar.active === 'toc',
        groupsSelector,
        layerSettingSelector,
        layerMetadataSelector,
        wfsDownloadSelector,
        mapSelector,
        currentLocaleSelector,
        selectedNodesSelector,
        layerFilterSelector,
        layersSelector,
        mapNameSelector,
        activeSelector,
        widgetBuilderAvailable,
        generalInfoFormatSelector,
        isCesium
    ], (enabled, groups, settings, layerMetadata, wfsdownload, map, currentLocale, selectedNodes, filterText, layers, mapName, catalogActive, activateWidgetTool, generalInfoFormat, isCesiumActive) => ({
        enabled,
        groups,
        settings,
        layerMetadata,
        wfsdownload,
        currentZoomLvl: map && map.zoom,
        scales: mapUtils.getScales(
            map && map.projection || 'EPSG:3857',
            map && map.mapOptions && map.mapOptions.view && map.mapOptions.view.DPI || null
        ),
        currentLocale,
        selectedNodes,
        filterText,
        generalInfoFormat,
        selectedLayers: layers.filter((l) => head(selectedNodes.filter(s => s === l.id))),
        noFilterResults: layers.filter((l) => filterLayersByTitle(l, filterText, currentLocale)).length === 0,
        selectedGroups: selectedNodes.map(n => LayersUtils.getNode(groups, n)).filter(n => n && n.nodes),
        mapName,
        filteredGroups: addFilteredAttributesGroups(groups, [
            {
                options: {showComponent: true},
                func: () => !filterText
            },
            {
                options: {loadingError: true},
                func: (node) => head(node.nodes.filter(n => n.loadingError && n.loadingError !== 'Warning'))
            },
            {
                options: {expanded: true, showComponent: true},
                func: (node) => filterText && head(node.nodes.filter(l => filterLayersByTitle(l, filterText, currentLocale) || l.nodes && head(node.nodes.filter(g => g.showComponent))))
            },
            {
                options: { showComponent: false },
                func: (node) => head(node.nodes.filter(l => l.hidden || l.id === "annotations" && isCesiumActive))
            }
        ]),
        catalogActive,
        activateWidgetTool
    })
);

const TOC = require('../components/TOC/TOC');
const Header = require('../components/TOC/Header');
// const Toolbar = require('../components/TOC/Toolbar');
const Toolbar = require('../components/misc/toolbar/Toolbar');
const DefaultGroup = require('../components/TOC/DefaultGroup');
const DefaultLayer = require('../components/TOC/DefaultLayer');
const DefaultLayerOrGroup = require('../components/TOC/DefaultLayerOrGroup');
const BorderLayout = require('../components/layout/BorderLayout');

class LayerTree extends React.Component {
    static propTypes = {
        id: PropTypes.number,
        buttonContent: PropTypes.node,
        groups: PropTypes.array,
        settings: PropTypes.object,
        layerMetadata: PropTypes.object,
        wfsdownload: PropTypes.object,
        metadataTemplate: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object, PropTypes.func]),
        refreshMapEnabled: PropTypes.bool,
        groupStyle: PropTypes.object,
        groupPropertiesChangeHandler: PropTypes.func,
        layerPropertiesChangeHandler: PropTypes.func,
        onToggleGroup: PropTypes.func,
        onToggleLayer: PropTypes.func,
        onContextMenu: PropTypes.func,
        onBrowseData: PropTypes.func,
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
        activateLegendTool: PropTypes.bool,
        activateZoomTool: PropTypes.bool,
        activateQueryTool: PropTypes.bool,
        activateDownloadTool: PropTypes.bool,
        activateSettingsTool: PropTypes.bool,
        activateMetedataTool: PropTypes.bool,
        activateWidgetTool: PropTypes.bool,
        maxDepth: PropTypes.number,
        visibilityCheckType: PropTypes.string,
        settingsOptions: PropTypes.object,
        chartStyle: PropTypes.object,
        currentZoomLvl: PropTypes.number,
        scales: PropTypes.array,
        layerOptions: PropTypes.object,
        spatialOperations: PropTypes.array,
        spatialMethodOptions: PropTypes.array,
        groupOptions: PropTypes.object,
        currentLocale: PropTypes.string,
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
        onGetMetadataRecord: PropTypes.func,
        hideLayerMetadata: PropTypes.func,
        activateAddLayerButton: PropTypes.bool,
        activateAddGroupButton: PropTypes.bool,
        catalogActive: PropTypes.bool,
        refreshLayerVersion: PropTypes.func,
        hideOpacityTooltip: PropTypes.bool,
        items: PropTypes.array,
        buttons: PropTypes.array
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
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
        activateQueryTool: false,
        activateDownloadTool: false,
        activateWidgetTool: false,
        maxDepth: 3,
        visibilityCheckType: "glyph",
        settingsOptions: {
            includeCloseButton: false,
            closeGlyph: "1-close",
            buttonSize: "small",
            showFeatureInfoTab: true
        },
        layerOptions: {},
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
        onGetMetadataRecord: () => {},
        hideLayerMetadata: () => {},
        activateAddLayerButton: false,
        activateAddGroupButton: false,
        catalogActive: false,
        refreshLayerVersion: () => {},
        metadataTemplate: null,
        items: [],
        buttons: []
    };

    getStatus = () => {
        const {selectedLayers, selectedGroups} = this.props;
        const isSingleGroup = this.isNestedGroup();
        let status = selectedLayers.length === 0 & selectedGroups.length === 0 ? 'DESELECT' : '';
        status = selectedLayers.length === 1 & selectedGroups.length === 0 ? 'LAYER' : status;
        status = isSingleGroup ? 'GROUP' : status;
        status = selectedLayers.length > 1 & selectedGroups.length === 0 ? 'LAYERS' : status;
        status = selectedGroups.length > 1 && !isSingleGroup ? 'GROUPS' : status;
        status = this.props.selectedLayers.length > 0 && this.props.selectedLayers.filter(l => l.loadingError === 'Error').length === this.props.selectedLayers.length ? `${status}_LOAD_ERROR` : status;
        return status;
    }

    getNoBackgroundLayers = (group) => {
        return group.name !== 'background';
    };

    getDefaultGroup = () => {
        return (
            <DefaultGroup
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
        return (
            <DefaultLayer
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
                />);
    }

    renderTOC = () => {
        const Group = this.getDefaultGroup();
        const Layer = this.getDefaultLayer();
        const sections = [this.props.activateToolsContainer, this.props.activateFilterLayer, this.props.activateMapTitle].filter(s => s);
        const bodyClass = sections.length > 0 ? ' toc-body-sections-' + sections.length : ' toc-body-sections';
        const buttons = this.props.buttons;
        return (
            <div className="ms-toc-container">
            <div>
                <Header
                    title={this.props.mapName}
                    showTitle={this.props.activateMapTitle}
                    showFilter={this.props.activateFilterLayer}
                    showTools={this.props.activateToolsContainer}
                    onClear={() => { this.props.onSelectNode(); }}
                    onFilter={this.props.onFilter}
                    filterTooltipClear={<Message msgId="toc.clearFilter" />}
                    filterPlaceholder={LocaleUtils.getMessageById(this.context.messages, "toc.filterPlaceholder")}
                    filterText={this.props.filterText}
                    toolbar={
                        <Toolbar
                            buttons={buttons
                                .map((Element) => ({
                                    status: this.getStatus(),
                                    className: 'square-button-md',
                                    bsStyle: 'primary',
                                    Element,
                                    activateTool: {
                                        activateToolsContainer: this.props.activateToolsContainer,
                                        activateRemoveLayer: this.props.activateRemoveLayer,
                                        activateZoomTool: this.props.activateZoomTool,
                                        activateQueryTool: this.props.activateQueryTool,
                                        activateDownloadTool: this.props.activateDownloadTool,
                                        activateSettingsTool: this.props.activateSettingsTool,
                                        activateAddLayer: this.props.activateAddLayerButton && !this.props.catalogActive,
                                        activateAddGroup: this.props.activateAddGroupButton,
                                        includeDeleteButtonInSettings: false,
                                        activateMetedataTool: this.props.activateMetedataTool,
                                        activateWidgetTool: this.props.activateWidgetTool
                                    }
                                })
                            )}/>
                        /*<Toolbar
                            groups={this.props.groups}
                            selectedLayers={this.props.selectedLayers}
                            selectedGroups={this.props.selectedGroups}
                            generalInfoFormat={this.props.generalInfoFormat}
                            settings={this.props.settings}
                            layerMetadata={this.props.layerMetadata}
                            wfsdownload={this.props.wfsdownload}
                            metadataTemplate={this.props.metadataTemplate}
                            maxDepth={this.props.maxDepth}
                            activateTool={{
                                activateToolsContainer: this.props.activateToolsContainer,
                                activateRemoveLayer: this.props.activateRemoveLayer,
                                activateZoomTool: this.props.activateZoomTool,
                                activateQueryTool: this.props.activateQueryTool,
                                activateDownloadTool: this.props.activateDownloadTool,
                                activateSettingsTool: this.props.activateSettingsTool,
                                activateAddLayer: this.props.activateAddLayerButton && !this.props.catalogActive,
                                activateAddGroup: this.props.activateAddGroupButton,
                                includeDeleteButtonInSettings: false,
                                activateMetedataTool: this.props.activateMetedataTool,
                                activateWidgetTool: this.props.activateWidgetTool
                            }}
                            options={{
                                modalOptions: {},
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
                                    LAYERS: <Message msgId="toc.toolTrashLayersTooltip"/>
                                },
                                reloadTooltip: {
                                    LAYER: <Message msgId="toc.toolReloadLayerTooltip"/>,
                                    LAYERS: <Message msgId="toc.toolReloadLayersTooltip"/>
                                },
                                layerMetadataTooltip: <Message msgId="toc.layerMetadata.toolLayerMetadataTooltip"/>,
                                layerMetadataPanelTitle: <Message msgId="toc.layerMetadata.layerMetadataPanelTitle"/>
                            }}
                            onToolsActions={{
                                onZoom: this.props.onZoomToExtent,
                                onNewWidget: this.props.onNewWidget,
                                onBrowseData: this.props.onBrowseData,
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
                                onShow: this.props.layerPropertiesChangeHandler}}/> */
                    }/>
                <div className={'mapstore-toc' + bodyClass}>
                    {this.props.noFilterResults && this.props.filterText ?
                        <div>
                            <div className="toc-filter-no-results"><Message msgId="toc.noFilteredResults" /></div>
                        </div>
                        :
                        <TOC onSort={!this.props.filterText && this.props.activateSortLayer ? this.props.onSort : null} filter={this.getNoBackgroundLayers} nodes={this.props.filteredGroups}>
                            <DefaultLayerOrGroup groupElement={Group} layerElement={Layer}/>
                        </TOC>
                    }
                </div>
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

    isNestedGroup = () => {
        const splitIdGroups = this.props.selectedGroups.map(g => g.id.split('.'));
        return head(splitIdGroups.reduce((a, b) => a[0] === b[0] ? b : [false], splitIdGroups[0]));
    }
}

/**
 * Provides Table Of Content visualization.
 * @memberof plugins
 * @name TOC
 * @class
 * @prop {boolean} cfg.activateFilterLayer: activate filter layers tool, default `true`
 * @prop {boolean} cfg.activateMapTitle: show map title, default `true`
 * @prop {boolean} cfg.activateTitleTooltip: show tooltip with full title on layers and groups, default `true`
 * @prop {boolean} cfg.activateOpacityTool: show opacity slider in collapsible panel of layer, default `true`
 * @prop {boolean} cfg.activateToolsContainer: activate layers and group global toolbar, default `true`
 * @prop {boolean} cfg.activateLegendTool: show legend in collapsible panel, default `true`
 * @prop {boolean} cfg.activateZoomTool: activate zoom to extension tool, default `true`
 * @prop {boolean} cfg.activateSettingsTool: activate settings of layers and groups, default `true`
 * @prop {boolean} cfg.activateRemoveLayer: activate remove layer tool, default `true`
 * @prop {boolean} cfg.activateQueryTool: activate query tool options, default `false`
 * @prop {boolean} cfg.activateDownloadTool: activate a button to download layer data through wfs, default `false`
 * @prop {boolean} cfg.activateSortLayer: activate drag and drop to sort layers, default `true`
 * @prop {boolean} cfg.activateAddLayerButton: activate a button to open the catalog, default `false`
 * @prop {boolean} cfg.activateAddGroupButton: activate a button to add a new group, default `false`
 * @prop {boolean} cfg.showFullTitleOnExpand shows full length title in the legend. default `false`.
 * @prop {boolean} cfg.hideOpacityTooltip hide toolip on opacity sliders
 * @prop {string[]|string|object|function} cfg.metadataTemplate custom template for displaying metadata
 * example :
 * ```
 * {
 * "name": "TOC",
 *      "cfg": {
 *          "metadataTemplate": ["<div id={model.identifier}>",
 *              "<Bootstrap.Table className='responsive'>",
 *                  "<thead>",
 *                  "<tr>",
 *                      "<th>Campo</th><th>Valore</th>",
 *                  "</tr>",
 *                  "</thead>",
 *                  "<tbody>",
 *                      "<tr>",
 *                          "<td>Identifier</td><td>{model.identifier}</td>",
 *                      "</tr>",
 *                      "<tr>",
 *                          "<td>Title</td><td>{model.title}</td>",
 *                      "</tr>",
 *                      "<tr>",
 *                          "<td>Abstract</td><td>{model.abstract}</td>",
 *                      "</tr>",
 *                      "<tr>",
 *                          "<td>Subject</td><td>{Array.isArray(model.subject) ? model.subject.map((value, i) => <ul key={'meta'+i}><li key={i}>{value}</li></ul>) : model.subject}</td>",
 *                      "</tr>",
 *                      "<tr>",
 *                          "<td>Type</td><td>{model.type}</td>",
 *                      "</tr>",
 *                      "<tr>",
 *                          "<td>Creator</td><td>{model.creator}</td>",
 *                      "</tr>",
 *                  "</tbody>",
 *              "</Bootstrap.Table>",
 *          "</div>"]
 *      }
 *  }
 * ```
 *
 * @prop {object} cfg.layerOptions: options to pass to the layer.
 * Some of the layerOptions are: `legendContainerStyle`, `legendStyle`. These 2 allow to customize the legend:
 * For instance you can pass some styling props to the legend.
 * this example is to make the legend scrollable horizontally
 * ```
 * "layerOptions": {
 *  "legendOptions": {
 *    "legendContainerStyle": {
 *     "overflowX": "auto"
 *    },
 *    "legendStyle": {
 *      "maxWidth": "250%"
 *    }
 *   }
 *  }
 * ```
 * Another layerOptions entry can be `indicators`. `indicators` is an array of icons to add to the TOC. They must satisfy a condition to be shown in the TOC.
 * For the moment only indicators of type `dimension` are supported.
 * example :
 * ```
 * "layerOptions" : {
 *   "indicators: [{
 *      "key": "dimension", // key: required id for the entry to render
 *      "type": "dimension", // type: only one supported is dimension
 *      "glyph": "calendar", // glyph to use
 *      "props": { // props to pass to the indicator
 *          "style": {
 *               "color": "#dddddd",
 *               "float": "right"
 *          },
 *          "tooltip": "dateFilter.supportedDateFilter", // tooltip (can be also a localized msgId)
 *          "placement": "bottom" // tooltip position
 *      },
 *      "condition": { // condition (lodash style) to satisfy ( for type dimension, the condition is to match at least one of the "dimensions" )
 *          "name": "time"
 *      }
 *   }]
 * }
 * ```
 *
 * Another layerOptions entry is `tooltipOptions` which contains options for customizing the tooltip
 * You can customize the max length for the tooltip with `maxLength` (Default is 807)
 * You can change the conjuction string in the "both" case with `separator` (Default is " - ")
 * for example
 * ```
 * "layerOptions" : {
 *   "tooltipOptions": {
 *     "maxLength": 200,
 *     "separator": " : "
 *   }
 * }
 * ```
 */
const TOCPlugin = connect(tocSelector, {
    groupPropertiesChangeHandler: changeGroupProperties,
    layerPropertiesChangeHandler: changeLayerProperties,
    retrieveLayerData: getLayerCapabilities,
    onToggleGroup: LayersUtils.toggleByType('groups', toggleNode),
    onToggleLayer: LayersUtils.toggleByType('layers', toggleNode),
    onContextMenu: contextNode,
    onBrowseData: browseData,
    onDownload: download,
    onSort: LayersUtils.sortUsing(LayersUtils.sortLayers, sortNode),
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
    hideLayerMetadata,
    onNewWidget: () => createWidget(),
    refreshLayerVersion
})(LayerTree);

class TOCContainer extends React.Component {
    static propTypes = {
        items: PropTypes.array
    }
    render() {
        const { items = [] } = this.props;
        const panels = items.map(({ panel }) => panel).filter(val => val);
        const buttons = items.map(({ tool }) => tool).filter(val => val);
        return (
            <BorderLayout
                columns={panels.map( (Panel, idx) => <Panel key={idx}/>)}>
                <div style={{ position: 'relative', width: 300, height: '100%' }}>
                    <TOCPlugin { ...this.props } buttons={buttons}/>
                </div>
            </BorderLayout>
        );
    }
}

const API = {
    csw: require('../api/CSW'),
    wms: require('../api/WMS'),
    wmts: require('../api/WMTS'),
    wfs3: require('../api/WFS3')
};

module.exports = {
    TOCPlugin: assign(TOCContainer, {
        Layout: {
            priority: 1,
            glyph: '1-layer',
            position: 2,
            size: 'auto',
            // hide: ({user} = {}) => !user,
            tooltipId: 'mps.tocTooltip',
            container: 'left-menu'
        }
        /*Toolbar: {
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
        }*/
    }),
    reducers: {
        queryform: require('../reducers/queryform'),
        query: require('../reducers/query')
    },
    epics: require("../epics/catalog")(API)
};
