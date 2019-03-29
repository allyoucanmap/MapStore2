
const React = require('react');
const dragDropContext = require('react-dnd').DragDropContext;
const html5Backend = require('react-dnd-html5-backend');
const {compose, branch} = require('recompose');

module.exports = compose(
    dragDropContext(html5Backend),
    branch(
        ({isDraggable = true}) => isDraggable,
        Component => ({onSort, isDraggable, items, containerId, ...props}) => {
            const draggableItems = items.map((item, sortId) => ({ ...item, onSort, isDraggable, sortId, key: item.id || sortId, containerId }));
            return <Component {...{...props, isDraggable}} items={draggableItems}/>;
        }
    )
);
