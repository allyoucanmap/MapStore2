
import React, { forwardRef } from 'react';

const addPrefix = (value) => {
    return value ? `_${value}` : undefined;
};

const Box = forwardRef(({
    children,
    className,
    display,
    position,
    fill,
    component = 'div',
    flexItemsCenter,
    flexColumn,
    flexFill,
    flexGap,
    flexWrap,
    flexVerticalAlign,
    active,
    interactive,
    p,
    plr,
    ptb,
    pl,
    pr,
    pt,
    pb,
    m,
    mlr,
    mtb,
    ml,
    mr,
    mt,
    mb,
    pointerEvents,
    overflow,
    row,
    overlay,
    ...props
}, ref) => {
    const Component = component;
    return (
        <Component
            {...props}
            ref={ref}
            className={[
                className,
                'ms-box',
                addPrefix(position),
                addPrefix(display),
                flexItemsCenter ? addPrefix('flex-items-center') : undefined,
                fill ? addPrefix('fill') : undefined,
                flexColumn ? addPrefix('flex-column') : undefined,
                flexFill ? addPrefix('flex-fill') : undefined,
                active ? addPrefix('active') : undefined,
                interactive ? addPrefix('interactive') : undefined,
                flexGap ? addPrefix(`flex-gap-${flexGap}`) : undefined,
                flexWrap ? addPrefix(`flex-wrap`) : undefined,
                flexVerticalAlign ? addPrefix(`flex-vertical-align`) : undefined,
                p ? addPrefix(`p-${p}`) : undefined,
                plr ? addPrefix(`plr-${plr}`) : undefined,
                ptb ? addPrefix(`ptb-${ptb}`) : undefined,
                pl ? addPrefix(`pl-${pl}`) : undefined,
                pr ? addPrefix(`pr-${pr}`) : undefined,
                pt ? addPrefix(`pt-${pt}`) : undefined,
                pb ? addPrefix(`pb-${pb}`) : undefined,
                m ? addPrefix(`m-${m}`) : undefined,
                mlr ? addPrefix(`plr-${mlr}`) : undefined,
                mtb ? addPrefix(`ptb-${mtb}`) : undefined,
                ml ? addPrefix(`ml-${ml}`) : undefined,
                mr ? addPrefix(`mr-${mr}`) : undefined,
                mt ? addPrefix(`mt-${mt}`) : undefined,
                mb ? addPrefix(`mb-${mb}`) : undefined,
                pointerEvents ? addPrefix(`pointer-events-${pointerEvents}`) : undefined,
                overflow ? addPrefix(`overflow-${overflow}`) : undefined,
                row ? addPrefix('row') : undefined,
                overlay ? addPrefix('overlay') : undefined,
                props.onClick ? addPrefix('pointer') : undefined
            ].filter(cls => cls).join(' ')}
        >
            {children}
        </Component>
    );
});

export default Box;
