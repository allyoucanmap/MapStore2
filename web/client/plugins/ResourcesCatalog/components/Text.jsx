
import React, { forwardRef } from 'react';

const addPrefix = (value) => {
    return value ? `_${value}` : undefined;
};

const Text = forwardRef(({
    children,
    className,
    component = 'div',
    fontSize,
    ellipsis,
    textAlign,
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
    ...props
}, ref) => {
    const Component = component;
    return (
        <Component
            {...props}
            ref={ref}
            className={[
                className,
                'ms-text',
                fontSize ? addPrefix(`font-size-${fontSize}`) : undefined,
                ellipsis ? addPrefix('ellipsis') : undefined,
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
                addPrefix(textAlign)
            ].filter(cls => cls).join(' ')}
        >
            {children}
        </Component>
    );
});

export default Text;
