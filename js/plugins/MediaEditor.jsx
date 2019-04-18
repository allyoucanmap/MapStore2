
import React from 'react';
import Media from './Media';
import TextWrapper from './TextWrapper';

const MediaEditor = ({
    id,
    size,
    type = 'image',
    src,
    position,
    readOnly,
    onChange
}) => {

    return (
        <TextWrapper
            size="medium"
            position={'left'}
            size={'large'}
            style={{
                padding: 0,
                boxShadow: 'none'
            }}>
            <Media
                id={id}
                type={type}
                src={src}
                position={position}
                size={size}
                forceHorizontal
                disableContainerDimension
                readOnly={readOnly}
                onChange={onChange}
                fullscreenOnClick
                simpleEdit
                style={{
                    minHeight: type === 'video' ? 420 : 300,
                    position: 'relative'
                }}/>
        </TextWrapper>
    );
};

export default MediaEditor;
