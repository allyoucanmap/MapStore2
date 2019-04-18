import React from 'react';

const TextWrapper = (props) => {
    const alignClass = ` text-${props.align || 'center'}`;
    const positionClass = `${props.position ? ` ms-${props.position}` : ''}`;
    const sizeClass = `${props.size ? ` ms-${props.size}` : ''}`;
    const invertClass = `${props.invert ? ` ms-invert` : ''}`;
    const transparentClass = `${props.transparent ? ` ms-transparent` : ''}`;
    return (
        <div
            className={`ms-cascade-field-text${positionClass}${sizeClass}${invertClass}${transparentClass}${alignClass}`}
            style={props.style || {}}>
            {props.children}
        </div>
    );
};

export default TextWrapper;
