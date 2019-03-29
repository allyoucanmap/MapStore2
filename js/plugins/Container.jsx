import React from 'react';

const Container = ({
    id,
    children,
    transparent,
    type,
    height,
    width,
    contentCentered,
    ...props
}) => {

    const styles = {
        fixed: {
            width,
            height
        },
        stretch: {
            minHeight: height
        },
        auto: {
            width: '100%'
        }
    };

    const style = styles[type] || {};

    return (
        <div
            {...props}
            className="ms-cascade-field"
            data-field-id={id}
            data-type="field"
            style={{
                ...style,
                backgroundColor: transparent ? 'transparent' : undefined
            }}>
            {children}
            {contentCentered &&
                <div className="ms-cascade-field-centered">
                    <div>
                        {contentCentered}
                    </div>
                </div>}
        </div>
    );
};

export default Container;
