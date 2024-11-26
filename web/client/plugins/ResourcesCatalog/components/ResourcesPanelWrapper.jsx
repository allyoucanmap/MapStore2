import React, { forwardRef } from 'react';
import Box from './Box';

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
        <Box
            className="ms-resources-panel-wrapper"
            position="fixed"
            display="flex"
            pointerEvents="none"
            style={{
                top: top,
                bottom: bottom,
                width: '100%',
                visibility: show ? 'visible' : 'hidden',
                ...(editing && {
                    pointerEvents: 'auto',
                    background: 'rgba(0, 0, 0, 0.2)'
                })
            }}
        >
            <Box
                ref={ref}
                className={`ms-main-colors${className ? ` ${className}` : ''}${show ? ' _visible' : ''}`}
                pointerEvents="auto"
                overflow="auto"
                position="relative"
            >
                {show ? children : null}
            </Box>
        </Box>
    ) : null;
});

export default ResourcesPanelWrapper;
