/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { cloneElement, useState, useLayoutEffect, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Glyphicon, Button as ButtonRB, FormControl, FormGroup } from 'react-bootstrap';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';
import {
    moveNode,
    updateNode,
    changeGroupProperties,
    removeNode,
    selectNode
} from '../actions/layers';
import {
    layersSelector,
    groupsSelector,
    selectedNodesSelector
} from '../selectors/layers';
import { createPlugin } from '../utils/PluginsUtils';
import { createShallowSelectorCreator } from '../utils/ReselectUtils';
import isEqual from 'lodash/isEqual';
import Message from '../components/I18N/Message';
import DefaultLayerOrGroup from '../components/TOC/DefaultLayerOrGroup';
import { sortGroups } from '../reducers/layers';
import { getLayerTypeGlyph } from '../utils/LayersUtils';
import { getTitleAndTooltip } from '../utils/TOCUtils';
import WMSLegend from '../components/TOC/fragments/WMSLegend';
import OpacitySlider from '../components/TOC/fragments/OpacitySlider';
import StyleBasedLegend from '../components/TOC/fragments/StyleBasedLegend';
import ConfirmModal from '../components/maps/modals/ConfirmModal';
import usePluginItems from '../hooks/usePluginItems';
import { zoomToExtent } from '../actions/map';
import { getConfigProp } from '../utils/ConfigUtils';
import isFunction from 'lodash/isFunction';
import tooltip from '../components/misc/enhancers/tooltip';

const Button = tooltip(ButtonRB);

const NodeTypes = {
    LAYER: 'layers',
    GROUP: 'groups'
};

const ROOT_FOLDER_ID = 'root';

const ITEM_KEY = 'node';

const formatDataId = (_id, position, lastId) => {
    let id = _id;
    if (lastId) {
        // ensure to get the latest id from groups
        const parts = _id.split('.');
        id = parts[parts.length - 1];
    }
    return `node-${id.replace(/\.|\:| /g, '-')}${position ? `-${position}` : ''}`;
};


const drag = dragSource(ITEM_KEY,
    {
        beginDrag: ({ node, parentId, index, sort, containerNode }) => {

            if (sort.beginDrag) {
                sort.beginDrag(node.id);
            }

            return {
                id: node.id,
                parentId,
                index,
                nodeType: node?.nodes ? NodeTypes.GROUP : NodeTypes.LAYER,
                containerNode
            };
        }
    },
    (_connect, monitor) => ({
        connectDragSource: _connect.dragSource(),
        connectDragPreview: _connect.dragPreview(),
        isDragging: monitor.isDragging()
    })
);

const computeSorting = (props, monitor) => {
    const dragItem = monitor.getItem();
    const { id, parentId, index, position } = props;
    const containerNode = dragItem.containerNode;
    // Don't replace items with themselves
    if (id === dragItem.id || !containerNode) {
        return null;
    }
    const rootParentId = containerNode.getAttribute('data-root-parent-id');
    const hoverNode = containerNode.querySelector(`[data-id=${formatDataId(id || rootParentId, position, true)}]`);
    const dragNode = containerNode.querySelector(`[data-id=${formatDataId(dragItem.id || rootParentId, dragItem.position, true)}]`);

    if (!hoverNode?.getBoundingClientRect || !dragNode?.getBoundingClientRect) {
        return null;
    }

    const hoverNodeType = props?.nodeType;

    const hoverNodeId = hoverNode.getAttribute('data-node-id');
    const dragNodeId = dragNode.getAttribute('data-node-id');
    const dragParentNodeId = dragNode.getAttribute('data-parent-node-id');
    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    // ---
    // the id of group is dynamic based on the parent id
    // eg: parentGroupId.childGroupId
    // the dragItem is not updated until we drop
    // but while dragging we are also updating the nodes structure
    // this is needed to sync the correct id
    dragItem.id = dragNodeId;
    dragItem.parentId = dragParentNodeId;
    // Don't replace items with themselves
    if (hoverNodeId === dragNodeId) {
        return null;
    }

    const hoverBoundingRect = hoverNode.getBoundingClientRect();
    const dragBoundingRect = dragNode.getBoundingClientRect();
    const dragY = hoverBoundingRect.top;
    const hoverY = dragBoundingRect.top;
    const hoverIndex = index;
    // Determine rectangle on screen
    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
    // Determine mouse position
    const clientOffset = monitor.getClientOffset();
    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;
    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    if (position === 'before') {
        return [dragItem.id, id || rootParentId, 0];
    }

    if (position === 'after' && dragY > hoverY) {
        return [dragItem.id, parentId || rootParentId, hoverIndex];
    }

    if (position === 'after') {
        return null;
    }

    if (hoverNodeType === NodeTypes.GROUP && dragY > hoverY) {
        return null;
    }

    if (dragY < hoverY && hoverClientY > hoverMiddleY) {
        return null;
    }
    if (dragY > hoverY && hoverClientY < hoverMiddleY) {
        return null;
    }

    return [dragItem.id, parentId || rootParentId, hoverIndex];
};

const drop = dropTarget(ITEM_KEY,
    {
        drop: (props) => {
            const { sort = {} } = props;
            if (sort?.drop) {
                sort.drop();
            }
        },
        hover: (props, monitor) => {
            const { sort = {} } = props;
            const payload = computeSorting(props, monitor);
            if (payload && sort?.hover) {
                const [ id, groupId, index ] = payload;
                sort.hover(id, groupId, index);
            }
        }
    },
    (_connect, monitor) => ({
        connectDropTarget: _connect.dropTarget(),
        isOver: monitor.isOver({ shallow: false })
    })
);

const DropNode = drop(({
    id,
    parentId,
    position,
    style,
    children,
    connectDropTarget,
    isOver,
    nodeType,
    draggable
}) => {

    if (!draggable) {
        return children;
    }
    return connectDropTarget(
        <div
            data-id={formatDataId(id, position, true)}
            data-node-id={id}
            data-parent-node-id={parentId}
            style={{ ...style, ...(isOver ? { background: 'green' } : position === 'after' ? { background: 'yellow' } : position === 'before' ? { background: 'orange' } : nodeType === 'group' ? { background: 'pink' } : {}) }}
        >
            {children}
        </div>
    );
});

const Title = ({
    node,
    filterText = '',
    currentLocale
}) => {
    const { title: value } = getTitleAndTooltip({ node, currentLocale });
    if (!filterText) {
        return (<div className="node-title">{value}</div>);
    }
    const regularExpression = new RegExp(filterText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
    const matches = value.match(regularExpression);
    if (!matches) {
        return (<div className="node-title">{value}</div>);
    }
    return (<div className="node-title">
        {value.split(regularExpression)
            .map((split, idx) => {
                if (idx < matches.length) {
                    return (<React.Fragment key={idx}>
                        {split}
                        <mark >{matches[idx]}</mark>
                    </React.Fragment>);
                }
                return (<React.Fragment key={idx}>{split}</React.Fragment>);
            })}
    </div>);
};

const VisibilityCheck = ({
    value,
    onChange,
    exclusive
}) => {
    const ref = useRef();

    useEffect(() => {
        ref.current.indeterminate = value === null;
    }, [value]);

    return (
        <input
            key={`${value}`}
            type={exclusive ? 'radio' : "checkbox"}
            ref={ref}
            checked={!!value}
            onClick={(event) => {
                event.stopPropagation();
                onChange(value === null ? true : !value);
            }}
            onContextMenu={(event) => {
                event.stopPropagation();
            }}
        />
    );
};

const TreeNodeHeader = ({
    node,
    filterText,
    currentLocale,
    beforeTitle,
    afterTitle
}) => {
    return (
        <>
            <div className="ms-tree-node" style={{ display: 'flex' }}>
                {beforeTitle}
                <Title node={node} filterText={filterText} currentLocale={currentLocale}/>
                {afterTitle}
            </div>
        </>
    );
};

const DefaultGroup = drag(({
    node: nodeProp,
    parentId,
    children,
    connectDragPreview: connectDragPreviewProp,
    connectDragSource,
    ...props
}) => {

    const {
        sort,
        index,
        filter = () => true,
        replaceNodeOptions = (node) => node,
        filterText,
        onChange = () => {},
        onChangeGroupProperties = () => {},
        onContextMenu = () => {},
        onSelect = () => {},
        getNodeStyle = () => {}
    } = props;

    const node = replaceNodeOptions(nodeProp, NodeTypes.GROUP);

    function handleOnChange(options) {
        onChange(node.id, NodeTypes.GROUP, options);
    }

    function handleOnChangeGroupProperties(options) {
        onChangeGroupProperties(node.id, options);
    }

    function handleOnContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        onContextMenu(event, nodeProp, NodeTypes.GROUP, parentId);
    }

    function handleOnSelect(event) {
        event.stopPropagation();
        event.preventDefault();
        onSelect(event, nodeProp, NodeTypes.GROUP, parentId);
    }

    if (!filter(node, NodeTypes.GROUP)) {
        return null;
    }

    const isDraggable = !(node?.sortable === false);
    const expanded = node?.expanded;

    const connectDragPreview = isDraggable
        ? connectDragPreviewProp
        : cmp => cmp;

    const style = getNodeStyle(nodeProp, NodeTypes.LAYER);
    return (
        connectDragPreview(
            <li style={{ ...style, border: '1px solid #ddd' }} onContextMenu={handleOnContextMenu} onClick={handleOnSelect}>
                <DropNode
                    nodeType={NodeTypes.GROUP}
                    index={index}
                    id={node.id}
                    parentId={parentId}
                    sort={sort}
                    draggable={isDraggable}
                >
                    <TreeNodeHeader
                        node={node}
                        beforeTitle={<>
                            {isDraggable ? connectDragSource(
                                <div className="grab-handle" onClick={(event) => event.stopPropagation()}>
                                    <Glyphicon glyph="grab-handle" />
                                </div>
                            ) : null}
                            {<button
                                onClick={() => handleOnChange({ expanded: !expanded })}
                                style={expanded ? { transform: 'rotate(90deg)' } : {}}
                                disabled={!!filterText}
                            >
                                <Glyphicon glyph="next"/>
                            </button>}
                            <Glyphicon glyph={expanded ? 'folder-open' : 'folder-close'} />
                            {!node?.exclusive && <VisibilityCheck
                                value={node?.visibility}
                                onChange={(visibility) => {
                                    handleOnChangeGroupProperties({ visibility });
                                }}
                            />}
                        </>}
                    />
                </DropNode>
                {expanded ? <ul>
                    <DropNode
                        draggable={isDraggable}
                        sort={sort}
                        nodeType={NodeTypes.GROUP}
                        index={index}
                        id={node.id}
                        position="before"
                        parentId={parentId}
                    >
                        <div style={{ display: 'flex', height: 8 }}></div>
                    </DropNode>
                    {node?.nodes?.map?.((childNode, _index) => cloneElement(children, {
                        ...props,
                        key: childNode.id,
                        node: childNode,
                        parentId: node.id,
                        index: _index,
                        parentExclusive: node?.exclusive,
                        onChange: (nodeId, nodeType, options, nodeParentId) => {
                            if (nodeParentId === node?.id && options?.visibility !== undefined && node?.exclusive) {
                                node.nodes.forEach((cNode) => {
                                    if (cNode.id !== nodeId) {
                                        onChange(cNode.id, cNode?.nodes ? NodeTypes.GROUP : NodeTypes.LAYER, {
                                            visibility: false
                                        });
                                    }
                                });
                                return onChange(nodeId, nodeType, { ...options, visibility: true });
                            }
                            return onChange(nodeId, nodeType, options);
                        }
                    }))}
                </ul> : null}
                <DropNode
                    draggable={isDraggable}
                    sort={sort}
                    nodeType={NodeTypes.GROUP}
                    index={index}
                    id={node.id}
                    position="after"
                    parentId={parentId}
                >
                    <div style={{ display: 'flex', height: 8 }}></div>
                </DropNode>
            </li>
        )
    );
});

const DefaultLayerTypeNode = ({
    node,
    filterText,
    currentLocale,
    onChange,
    sortHandler,
    exclusive
}) => {

    const icon = getLayerTypeGlyph(node);

    if (['wms'].includes(node?.type)) {
        return (
            <>
                <TreeNodeHeader
                    node={node}
                    filterText={filterText}
                    currentLocale={currentLocale}
                    beforeTitle={
                        <>
                            {sortHandler}
                            <button
                                onClick={() => onChange({ expanded: !node?.expanded })}
                                style={node?.expanded ? { transform: 'rotate(90deg)' } : {}}
                            >
                                <Glyphicon glyph="next"/>
                            </button>
                            <Glyphicon glyph={icon} />
                            <VisibilityCheck
                                exclusive={exclusive}
                                value={!!node?.visibility}
                                onChange={(visibility) => {
                                    onChange({ visibility });
                                }}
                            />
                        </>
                    }
                />
                {node?.expanded ? <div>
                    <WMSLegend
                        node={node}
                        // currentZoomLvl={currentZoomLvl}
                        // scales={scales}
                        // language={language}
                        // {...legendOptions}
                    />
                </div> : null}
                <OpacitySlider
                    opacity={node?.opacity}
                    disabled={!node.visibility}
                    // hideTooltip={hideOpacityTooltip}
                    onChange={opacity => onChange({ opacity })}
                />
            </>
        );
    }

    if (['wfs', 'vector'].includes(node?.type)) {

        const expandable = node?.style?.format === 'geostyler' && node?.style?.body?.rules?.length > 0;

        return (
            <>
                <TreeNodeHeader
                    node={node}
                    filterText={filterText}
                    currentLocale={currentLocale}
                    beforeTitle={
                        <>
                            {sortHandler}
                            {expandable ? <button
                                onClick={() => onChange({ expanded: !node?.expanded })}
                                style={node?.expanded ? { transform: 'rotate(90deg)' } : {}}
                            >
                                <Glyphicon glyph="next"/>
                            </button> : null}
                            <Glyphicon glyph={icon} />
                            <VisibilityCheck
                                exclusive={exclusive}
                                value={!!node?.visibility}
                                onChange={(visibility) => {
                                    onChange({ visibility });
                                }}
                            />
                        </>
                    }
                />
                {expandable && node?.expanded ? <div>
                    <StyleBasedLegend
                        node={node}
                        style={node?.style}
                    />
                </div> : null}
                <OpacitySlider
                    opacity={node?.opacity}
                    disabled={!node.visibility}
                    // hideTooltip={hideOpacityTooltip}
                    onChange={opacity => onChange({ opacity })}
                />
            </>
        );
    }

    if (['3dtiles'].includes(node?.type)) {
        return (
            <>
                <TreeNodeHeader
                    node={node}
                    filterText={filterText}
                    currentLocale={currentLocale}
                    beforeTitle={
                        <>
                            {sortHandler}
                            <Glyphicon glyph={icon} />
                            <VisibilityCheck
                                exclusive={exclusive}
                                value={!!node?.visibility}
                                onChange={(visibility) => {
                                    onChange({ visibility });
                                }}
                            />
                        </>
                    }
                />
            </>
        );
    }

    return (
        <>
            <TreeNodeHeader
                node={node}
                filterText={filterText}
                currentLocale={currentLocale}
                beforeTitle={
                    <>
                        {sortHandler}
                        <Glyphicon glyph="1-layer" />
                        <VisibilityCheck
                            exclusive={exclusive}
                            value={!!node?.visibility}
                            onChange={(visibility) => {
                                onChange({ visibility });
                            }}
                        />
                    </>
                }
            />
            <OpacitySlider
                opacity={node?.opacity}
                disabled={!node.visibility}
                // hideTooltip={hideOpacityTooltip}
                onChange={opacity => onChange({ opacity })}
            />
        </>
    );
};

const DefaultLayer = drag(({
    node: nodeProp,
    parentId,
    connectDragPreview: connectDragPreviewProp,
    connectDragSource,
    index,
    sort,
    filter = () => true,
    filterText,
    currentLocale,
    replaceNodeOptions = node => node,
    onChange = () => {},
    onContextMenu = () => {},
    onSelect = () => {},
    getNodeStyle = () => {},
    parentExclusive
}) => {

    const node = replaceNodeOptions(nodeProp, NodeTypes.LAYER);

    function handleOnChange(options) {
        onChange(node.id, NodeTypes.LAYER, options, parentId);
    }

    function handleOnContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        onContextMenu(event, nodeProp, NodeTypes.LAYER, parentId);
    }

    function handleOnSelect(event) {
        event.stopPropagation();
        event.preventDefault();
        onSelect(event, nodeProp, NodeTypes.LAYER, parentId);
    }

    if (!filter(node, NodeTypes.LAYER)) {
        return null;
    }

    const isDraggable = !(node?.sortable === false);

    const connectDragPreview = isDraggable
        ? connectDragPreviewProp
        : cmp => cmp;

    const style = getNodeStyle(nodeProp, NodeTypes.LAYER);
    return (
        connectDragPreview(
            <li style={{ ...style, border: '1px solid #ddd' }} onContextMenu={handleOnContextMenu} onClick={handleOnSelect}>
                <DropNode
                    draggable={isDraggable}
                    sort={sort}
                    nodeType={NodeTypes.LAYER}
                    index={index}
                    id={node.id}
                    parentId={parentId}
                >
                    <DefaultLayerTypeNode
                        node={node}
                        filterText={filterText}
                        currentLocale={currentLocale}
                        onChange={handleOnChange}
                        exclusive={parentExclusive}
                        sortHandler={
                            isDraggable ? connectDragSource(
                                <div className="grab-handle" onClick={(event) => event.stopPropagation()}>
                                    <Glyphicon glyph="grab-handle" />
                                </div>
                            ) : null
                        }
                    />
                </DropNode>
            </li>
        )
    );
});

const filterTitle = ({
    node,
    filterText,
    currentLocale
}) => {
    const { title: currentTitle } = getTitleAndTooltip({ node, currentLocale });
    return currentTitle.toLowerCase().includes(filterText.toLocaleLowerCase());
};

const loopFilter = ({ node: groupNode, filterText, currentLocale }) => {
    return !!groupNode?.nodes?.find((node) => {
        if (node?.nodes) {
            return loopFilter({ node, filterText, currentLocale });
        }
        return filterTitle({
            node,
            filterText,
            currentLocale
        });
    });
};

const LayersTree = ({
    tree,
    filterText,
    currentLocale,
    onSort = () => {},
    onChange = () => {},
    onChangeGroupProperties = () => {},
    groupNodeComponent = DefaultGroup,
    layerNodeComponent = DefaultLayer,
    onContextMenu = () => {},
    onSelect = () => {},
    contextMenu,
    selectedNodes = []
}) => {

    const containerNode = useRef();
    const isSingleDefaultGroup = tree?.length === 1 && tree?.[0]?.nodes && tree?.[0]?.id === 'Default';
    const root = isSingleDefaultGroup ? tree[0].nodes : tree;
    const rootParentId = isSingleDefaultGroup ? 'Default' : ROOT_FOLDER_ID;

    const [isContainerEmpty, setIsContainerEmpty] = useState(false);
    useLayoutEffect(() => {
        setIsContainerEmpty(containerNode?.current?.children?.length === 0);
    });

    const getGroup = () => {
        const Group = groupNodeComponent;
        return (<Group />);
    };

    const getLayer = () => {
        const Layer = layerNodeComponent;
        return (<Layer />);
    };

    const getNodeStyle = (currentNode, nodeType) => {
        const selected = selectedNodes.find((selectedNode) => currentNode.id === selectedNode.id);
        const contextMenuHighlight = contextMenu?.id === currentNode.id;
        return {
            ...(contextMenuHighlight && { outline: '1px solid red' }),
            ...(selected && { backgroundColor: 'pink' })
        };
    };

    const getNodeClassName = (currentNode, nodeType) => {
        return {};
    };

    return (
        <ul
            ref={containerNode}
            data-root-parent-id={rootParentId}
            className="ms-layer-tree"
            onContextMenu={(event) => {
                event.preventDefault();
            }}
        >
            {(root || []).map((node, index) => {
                return (
                    <DefaultLayerOrGroup
                        containerNode={containerNode.current}
                        key={node.id}
                        index={index}
                        node={node}
                        groupElement={getGroup()}
                        layerElement={getLayer()}
                        replaceNodeOptions={(currentNode, nodeType) => ({
                            ...currentNode,
                            ...(filterText && { sortable: false }),
                            ...(nodeType === NodeTypes.GROUP && filterText && { expanded: true }),
                            ...(nodeType === NodeTypes.GROUP && currentNode?.id === 'Default' && { sortable: false })
                        })}
                        getNodeStyle={getNodeStyle}
                        getNodeClassName={getNodeClassName}
                        currentLocale={currentLocale}
                        filterText={filterText}
                        filter={(currentNode, nodeType) => {
                            if (nodeType === NodeTypes.GROUP && filterText) {
                                return loopFilter({ node: currentNode, filterText });
                            }
                            if (nodeType === NodeTypes.LAYER && filterText) {
                                return filterTitle({
                                    node: currentNode,
                                    filterText,
                                    currentLocale
                                });
                            }
                            return true;
                        }}
                        sort={{
                            hover: (id, groupId, newIndex) => {
                                onSort(id, groupId, newIndex);
                            }
                        }}
                        onChange={onChange}
                        onChangeGroupProperties={onChangeGroupProperties}
                        onContextMenu={onContextMenu}
                        onSelect={onSelect}
                    />
                );
            })}
            {isContainerEmpty ? 'no filter match' : null}
        </ul>
    );
};

const getRemoveNodes = (node) => {
    return [
        { id: node.id, type: node?.nodes ? NodeTypes.GROUP : NodeTypes.LAYER },
        ...(node?.nodes || []).map(getRemoveNodes).flat()
    ];
};

const getGroupLayers = (node) => {
    if (!node?.nodes) {
        return node;
    }
    return [
        ...(node?.nodes || []).map(getGroupLayers).flat()
    ];
};

function TableOfContentItemButton({
    contextMenu,
    onClick,
    label,
    labelId,
    glyph,
    buttonProps,
    tooltipId
}) {
    if (contextMenu) {
        return (
            <Button onClick={onClick}>
                {labelId ?  <Message msgId={labelId}/> : label}
            </Button>
        );
    }
    return (
        <Button
            {...buttonProps}
            tooltipId={tooltipId}
            onClick={onClick}>
            <Glyphicon glyph={glyph} />
        </Button>
    );
}

const StatusTypes = {
    DESELECT: 'DESELECT',
    GROUP: 'GROUP',
    LAYER: 'LAYER',
    BOTH: 'BOTH',
    GROUPS: 'GROUPS',
    LAYERS: 'LAYERS'
};

function TableOfContentToolbar({
    items = [],
    selectedNodes,
    buttonProps = {
        className: 'square-button-md',
        bsStyle: 'primary'
    }
}) {
    const selectedGroups = selectedNodes.filter((node) => node.type === NodeTypes.GROUP).map(({ node }) => node);
    const selectedLayers = selectedNodes.filter((node) => node.type === NodeTypes.LAYER).map(({ node }) => node);
    function getSelectedNodesStatus() {
        if (!selectedNodes?.length) {
            return StatusTypes.DESELECT;
        }
        if (selectedNodes?.length === 1) {
            return selectedGroups?.length === 1 ? StatusTypes.GROUP : StatusTypes.LAYER;
        }
        if (!!selectedGroups?.length && !!selectedLayers?.length) {
            return StatusTypes.BOTH;
        }
        return !!selectedGroups?.length ? StatusTypes.GROUPS : StatusTypes.LAYERS;
        // status = this.props.selectedLayers.length > 0 && this.props.selectedLayers.filter(l => l.loadingError === 'Error').length === this.props.selectedLayers.length ? `${status}_LOAD_ERROR` : status;
    }

    const status = getSelectedNodesStatus();

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {items
                .filter(({ selector = () => true }) => selector({
                    status,
                    selectedLayers,
                    selectedGroups,
                    selectedNodes,
                    statusTypes: StatusTypes
                })) // filter items that should not show
                .map(({ Component, name }, i) => {
                    return (
                        <Component
                            key={name ?? `item-${i}`}
                            buttonProps={buttonProps}
                            selectedLayers={selectedLayers}
                            selectedGroups={selectedGroups}
                            selectedNodes={selectedNodes}
                            status={status}
                            statusTypes={StatusTypes}
                            nodeTypes={NodeTypes}
                            rootFolderId={ROOT_FOLDER_ID}
                            itemComponent={TableOfContentItemButton}
                        />
                    );
                })}
        </div>
    );
}

function ContextMenu({
    children,
    onClick = () => {},
    onClose = () => {},
    show,
    position,
    containerNode: containerNodeProp = () => document.querySelector('.' + (getConfigProp('themePrefix') || 'ms2') + " > div") || document.body
}) {

    const containerNode = isFunction(containerNodeProp) ? containerNodeProp() : containerNodeProp;
    const ref = useRef();
    const [style, setStyle] = useState({});

    useEffect(() => {
        function handlePointerDownOut(event) {
            const nodeContains = ref?.current?.contains;
            if (nodeContains && !ref.current.contains(event.target)) {
                onClose();
            }
        }
        window.addEventListener('pointerdown', handlePointerDownOut);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDownOut);
        };
    }, [ ref ]);

    useLayoutEffect(() => {
        if (position) {
            const [left, top] = position;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const { height, width } = ref?.current?.getBoundingClientRect();
            const translateY = (top + height) > windowHeight ? '-100%' : '0';
            const translateX = (left + width) > windowWidth ? '-100%' : '0';
            setStyle({
                transform: `translate(${translateX}, ${translateY})`,
                top,
                left
            });
        }
    }, [position]);

    return show ? createPortal(
        <div
            ref={ref}
            className="shadow-soft"
            style={{
                ...style,
                position: 'fixed',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10
            }}
            onClick={onClick}
        >
            {children}
        </div>,
        containerNode
    ) : null;
}

function TOC({
    tree,
    onSort = () => {},
    onChange = () => {},
    onChangeGroupProperties = () => {},
    onRemove = () => {},
    onZoomTo = () => {},
    onSelectNode = () => {},
    groupNodeComponent,
    layerNodeComponent,
    items,
    selectedNodes
}, context) {

    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });
    const contextMenuItems = configuredItems.filter(item => item.target === 'context-menu');
    const toolbarMenuItems = configuredItems.filter(item => item.target === 'toolbar');
    const [filterText, setFilterText] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(null);

    function handleRemoveNodes() {
        const nodesToRemove = getRemoveNodes(showDeleteDialog?.node);
        nodesToRemove.forEach((node) => {
            onRemove(node.id, node.type);
        });
        setShowDeleteDialog(null);
    }

    function handleOnZoomTo(bbox) {
        onZoomTo(bbox.bounds, bbox.crs);
    }

    function computeBoundingBoxFromLayers(layers) {
        const layersBbox = layers
            .filter(l => l.bbox)
            .map(l => ({
                ...l.bbox,
                bounds: {
                    minx: parseFloat(l.bbox.bounds.minx),
                    miny: parseFloat(l.bbox.bounds.miny),
                    maxx: parseFloat(l.bbox.bounds.maxx),
                    maxy: parseFloat(l.bbox.bounds.maxy)
                }
            }));
        const bbox = layersBbox.length > 1 ? layersBbox.reduce((a, b) => {
            return {
                bounds: {
                    maxx: a.bounds.maxx > b.bounds.maxx ? a.bounds.maxx : b.bounds.maxx,
                    maxy: a.bounds.maxy > b.bounds.maxy ? a.bounds.maxy : b.bounds.maxy,
                    minx: a.bounds.minx < b.bounds.minx ? a.bounds.minx : b.bounds.minx,
                    miny: a.bounds.miny < b.bounds.miny ? a.bounds.miny : b.bounds.miny
                }, crs: b.crs};
        }, layersBbox[0]) : layersBbox[0];
        return bbox;
    }

    function getZoomBoundingBox(selected) {
        if (!selected) {
            return null;
        }
        if (selected?.type === NodeTypes.LAYER && selected?.node?.bbox) {
            return computeBoundingBoxFromLayers([selected.node]);
        }
        const layers = selected?.type === NodeTypes.GROUP
            ? getGroupLayers(selected?.node).filter(layer => layer?.bbox)
            : [];
        return layers.length ? computeBoundingBoxFromLayers(layers) : null;
    }

    const boundingBox = getZoomBoundingBox(contextMenu);

    return (
        <div
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                overflow: 'auto'
            }}
        >
            <FormGroup>
                <FormControl
                    value={filterText}
                    onChange={(event) => setFilterText(event?.target?.value)}
                />
            </FormGroup>
            <TableOfContentToolbar
                items={toolbarMenuItems}
                selectedNodes={selectedNodes}
            />
            <LayersTree
                tree={tree}
                filterText={filterText}
                onSort={onSort}
                onChange={onChange}
                onChangeGroupProperties={onChangeGroupProperties}
                groupNodeComponent={groupNodeComponent}
                layerNodeComponent={layerNodeComponent}
                contextMenu={contextMenu}
                onContextMenu={(event, currentNode, nodeType, parentId) => {
                    setContextMenu({
                        id: currentNode?.id,
                        node: currentNode,
                        type: nodeType,
                        parentId,
                        position: [event.clientX, event.clientY]
                    });
                }}
                selectedNodes={selectedNodes}
                onSelect={(event, currentNode, nodeType) => {
                    onSelectNode(currentNode.id, nodeType === 'groups' ? 'group' : 'layer', event?.ctrlKey);
                }}
            />
            <ContextMenu
                show={!!contextMenu}
                position={contextMenu?.position}
                onClick={() => setContextMenu(null)}
                onClose={() => setContextMenu(null)}
            >
                <button onClick={() => setShowDeleteDialog(contextMenu)}>Remove layer</button>
                {contextMenu?.type === NodeTypes.GROUP
                    ? <button onClick={() => onChange(contextMenu?.id, contextMenu?.type, {
                        exclusive: !contextMenu?.node?.exclusive
                    })}>Toggle</button>
                    : null}
                {boundingBox
                    ? <button onClick={() => handleOnZoomTo(boundingBox)}>Zoom to layer</button>
                    : null}
                {contextMenuItems.map(({ name, Component }) => {
                    return (
                        <Component
                            key={name}
                            selectedNodes={[contextMenu]}
                            contextMenu
                            itemComponent={TableOfContentItemButton}
                            statusTypes={StatusTypes}
                            nodeTypes={NodeTypes}
                            rootFolderId={ROOT_FOLDER_ID}
                        />);
                })}
            </ContextMenu>
            <ConfirmModal
                options={{
                    animation: false,
                    className: "modal-fixed"
                }}
                show= {!!showDeleteDialog}
                onHide={() => setShowDeleteDialog(null)}
                onClose={() => setShowDeleteDialog(null)}
                onConfirm={handleRemoveNodes}
                // titleText={this.props.selectedGroups && this.props.selectedGroups.length ? this.props.text.confirmDeleteLayerGroupText : this.props.text.confirmDeleteText}
                // confirmText={this.props.text.confirmDeleteConfirmText}
                // cancelText={this.props.text.confirmDeleteCancelText}
                // body={this.props.selectedGroups && this.props.selectedGroups.length ? this.props.text.confirmDeleteLayerGroupMessage : this.props.text.confirmDeleteMessage}
            />
        </div>
    );
}

const tocSelector = createShallowSelectorCreator(isEqual)(
    (state) => state.controls && state.controls.toolbar && state.controls.toolbar.active === 'toc',
    groupsSelector,
    layersSelector,
    selectedNodesSelector,
    (enabled, tree, layers, selectedNodes) => ({
        enabled,
        tree,
        layers,
        selectedNodes: selectedNodes.map(nodeId => {
            const layer = layers.find(({ id }) => nodeId === id);
            if (layer) {
                return { id: nodeId, node: layer, type: NodeTypes.LAYER };
            }
            return { id: nodeId, node: {}, type: NodeTypes.GROUP };
        })
    })
);

const ConnectedTOC = connect(tocSelector, {
    onSort: moveNode,
    onChange: updateNode,
    onChangeGroupProperties: changeGroupProperties,
    onRemove: removeNode,
    onZoomTo: zoomToExtent,
    onSelectNode: selectNode
})(TOC);

export default createPlugin('TOC', {
    component: ConnectedTOC,
    containers: {
        DrawerMenu: {
            name: 'toc',
            position: 1,
            glyph: '1-layer',
            buttonConfig: {
                buttonClassName: 'square-button no-border',
                tooltip: 'toc.layers'
            },
            priority: 2
        }
    }
});
