/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon, Button } from 'react-bootstrap';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';

function DragDropItem({
    id,
    title,
    onSelect,
    onRemove,
    isDragging,
    connectDragPreview,
    connectDropTarget,
    connectDragSource
}) {
    const opacity = isDragging ? 0 : 1;
    const handler = connectDragSource(
        <div onClick={(event) => event.stopPropagation()}>
            <Glyphicon glyph="grab-handle"/>
        </div>
    );

    return (
        connectDragPreview(connectDropTarget(
            <li
                data-id={`item-${id}`}
                style={{
                    opacity,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    marginBottom: 4
                }}
                onClick={onSelect}
                tabIndex={0}
            >
                {handler}
                <div style={{ flex: 1 }}>{title}</div>
                <div onClick={(event) => event.stopPropagation()}>
                    <Button
                        className="square-button-md no-border"
                        onClick={onRemove}
                    >
                        <Glyphicon glyph="trash"/>
                    </Button>
                </div>
            </li>
        ))
    );
}

const ITEM_KEY = 'option';
const drag = dragSource(ITEM_KEY,
    {
        beginDrag: ({ id, index }) => ({
            id,
            index
        })
    },
    (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    })
);
const drop = dropTarget('option',
    {
        drop: (props) => {
            const { onMoveEnd = () => {} } = props;
            onMoveEnd();
        },
        hover: (props, monitor) => {
            // console.log(component);
            const item = monitor.getItem();
            const { id, index, onMove = () => {} } = props;
            const node = document.querySelector(`[data-id=item-${id}]`);

            if (!node?.getBoundingClientRect) {
                return null;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return null;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = node.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return null;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return null;
            }
            // Time to actually perform the action
            onMove(dragIndex, hoverIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
            return null;
        }
    },
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver()
    })
);


export default drag(drop(DragDropItem));
