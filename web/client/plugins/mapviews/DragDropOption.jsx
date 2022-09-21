/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { DragSource as dragSource, DropTarget as dropTarget } from 'react-dnd';

const itemSource = {
    beginDrag: props => ({...props})
};

const itemTarget = {
    drop: (props, monitor) => {
        const item = monitor.getItem();
        if (item.sortId !== props.sortId) {
            props.onSort(props.sortId, item.sortId, {
                id: props.id,
                containerId: props.containerId
            },
            {
                id: item.id,
                containerId: item.containerId
            });
        }
    }
};

const sourceCollect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
    draggingItem: monitor.getItem() || null
});

const targetCollect = (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
});

const blockEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if ((event.target.tagName !== 'A') || !('href' in event.target)) {
        return;
    }
    if (event.target.target) {
        window.open(event.target.href, event.target.target);
    } else {
        window.location.href = event.target.href;
    }
};

class DragDropOption extends React.Component {

    constructor(props) {
        super(props);

        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.onFocus = this.onFocus.bind(this);
    }

    handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onSelect(this.props.option, event);
    }

    handleMouseEnter(event) {
        this.onFocus(event);
    }

    handleMouseMove(event) {
        this.onFocus(event);
    }

    handleTouchEnd(event) {
        // Check if the view is being dragged, In this case
        // we don't want to fire the click event (because the user only wants to scroll)
        if (!this.dragging) {
            this.handleMouseDown(event);
        }
    }

    handleTouchMove() {
        // Set a flag that the view is being dragged
        this.dragging = true;
    }

    handleTouchStart() {
        // Set a flag that the view is not being dragged
        this.dragging = false;
    }

    onFocus(event) {
        if (!this.props.isFocused) {
            this.props.onFocus(this.props.option, event);
        }
    }

    render() {
        const {
            option,
            instancePrefix,
            optionIndex,
            connectDragPreview,
            connectDropTarget,
            connectDragSource,
            isDragging
        } = this.props;
        const className = classNames(this.props.className, option.className);
        console.log(connectDragPreview, connectDropTarget, connectDragSource, isDragging);
        return option.disabled ? (
            <div className={className}
                onMouseDown={blockEvent}
                onClick={blockEvent}>
                {this.props.children}
            </div>
        ) : (
            
                <div style={{ display: 'flex' }}>
                    {
                    connectDragPreview(connectDropTarget(connectDragSource(

                    <div tabIndex={1} style={{ width: 30, height: 30, backgroundColor: 'red', cursor: 'move', pointerEvents: 'auto' }}>AA</div>
                    ))
                    )}
                    <div className={className}
                        style={{ ...option.style, flex: 1 }}
                        role="option"
                        aria-label={option.label}
                        onMouseDown={this.handleMouseDown}
                        onMouseEnter={this.handleMouseEnter}
                        onMouseMove={this.handleMouseMove}
                        onTouchStart={this.handleTouchStart}
                        onTouchMove={this.handleTouchMove}
                        onTouchEnd={this.handleTouchEnd}
                        id={`${instancePrefix}-option-${optionIndex}`}
                        title={option.title}>
                        {this.props.children}
                    </div>
                </div>

        );
    }
}

DragDropOption.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,             // className (based on mouse position)
    instancePrefix: PropTypes.string.isRequired,  // unique prefix for the ids (used for aria)
    isDisabled: PropTypes.bool,              // the option is disabled
    isFocused: PropTypes.bool,               // the option is focused
    isSelected: PropTypes.bool,              // the option is selected
    onFocus: PropTypes.func,                 // method to handle mouseEnter on option element
    onSelect: PropTypes.func,                // method to handle click on option element
    onUnfocus: PropTypes.func,               // method to handle mouseLeave on option element
    option: PropTypes.object.isRequired,     // object that is base for that option
    optionIndex: PropTypes.number           // index of the option, used to generate unique ids for aria
};

export default dragSource('option', itemSource, sourceCollect)(
    dropTarget('option', itemTarget, targetCollect)(DragDropOption)
);
