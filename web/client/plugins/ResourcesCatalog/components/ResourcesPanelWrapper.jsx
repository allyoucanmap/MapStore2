import React, { forwardRef } from 'react';

const ResourcesPanelWrapper = forwardRef(({
    top,
    bottom,
    show,
    enabled,
    children,
    className,
    editing
}, ref) => {
    return enabled ? (
        <div
            className="ms-resources-panel-wrapper"
            style={{
                top: top,
                bottom: bottom,
                visibility: show ? 'visible' : 'hidden',
                ...(editing && {
                    pointerEvents: 'auto',
                    background: 'rgba(0, 0, 0, 0.2)'
                })
            }}
        >
            <div
                ref={ref}
                className={className}
            >
                {show ? children : null}
            </div>
        </div>
    ) : null;
});

export default ResourcesPanelWrapper;
