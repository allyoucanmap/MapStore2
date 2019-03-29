import React from 'react';
import withScrollSpy from './mapstore/withScrollSpy';

const ScrollListener = withScrollSpy({})((props) => {
    const {
        children,
        id = '',
        className = '',
        style = {}
    } = props;
    return (
        <div
            id={id}
            className={className}
            style={style}>
            {children}
        </div>
    );
});

export default ScrollListener;
