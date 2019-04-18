import React, { useEffect, useState } from 'react';
import MapView from '@mapstore/components/widgets/widget/MapView';
import ContainerDimensions from 'react-container-dimensions';
import ReactPlayer from 'react-player';
import Portal from '@mapstore/components/misc/Portal';

const MediaBody = ({
    id,
    src,
    type,
    cover,
    invert,
    style = {},
    children,
    containerRatio,
    forceHorizontal,
    size,
    position,
    readOnly,
    fullscreenOnClick
}) => {

    const [ imageSize, setSize ] = useState({ });
    const [ orientation, onSetOrientation ] = useState('horizontal');
    const [ fullscreen, onFullscreen ] = useState();

    const onLoad = (event) => {
        const width = imageSize.width || event && event.target.naturalWidth;
        const height = imageSize.height || event && event.target.naturalHeight;
        if (containerRatio) {
            const mediaRatio = width / height;
            onSetOrientation(mediaRatio > containerRatio ? 'horizontal' : 'vertical');
        } else {
            onSetOrientation(width > height ? 'horizontal' : 'vertical');
        }
        setSize({
            width,
            height
        });
    };

    useEffect(() => {
        if (fullscreen) {
            onLoad();
        }
    }, [ fullscreen ]);

    const mediaSource = (
        <div
            className={fullscreen
                ? `ms-background ms-${orientation} ms-transparent ms-read-only`
                : `ms-background ms-${ forceHorizontal || size && size !== 'full' ? 'horizontal' : orientation}${cover ? ' cover' : ''}${invert ? ` ms-invert` : ''}${size ? ` ms-${size}` : ''}${position ? ` ms-${position}` : ''}${readOnly ? ' ms-read-only' : ''}`}
            style={{
                cursor: readOnly && type === 'image' && fullscreenOnClick ? 'pointer' : 'default',
                ...style
            }}
            onClick={readOnly && type === 'image' && fullscreenOnClick ? (event) => {
                event.stopPropagation();
                onFullscreen(!fullscreen);
            } : null}>
            {type === 'image' && <img
                src={src}
                onLoad={(event) => onLoad(event)}/>}
            {type === 'map' && src && src.layers && <MapView
                id={id}
                options={{
                    style: {
                        width: cover ? '100%' : '80%',
                        height: cover ? '100%' : '56%'
                    }
                }}
                { ...src } />}
            {type === 'video' && <ReactPlayer
                url={src}
                width={cover ? '100%' : '80%'}
                height={cover ? '100%' : '56%'}
                playing
                loop
                muted/>}
            {children}
        </div>
    );

    return fullscreen ? (
        <Portal>
            <div style={{
                position: 'fixed',
                width: '100%',
                height: '100%',
                padding: 32,
                backgroundColor: 'rgba(0, 0, 0, 0.75)'
            }}>
                {mediaSource}
            </div>
        </Portal>
    ) : mediaSource;
};

const MediaSource = ({ disableContainerDimension, ...props }) => {
    return disableContainerDimension ? <MediaBody {...props} /> : (
        <ContainerDimensions>
            {({ width, height }) =>
                <MediaBody
                    {...props}
                    containerRatio={width / height}/>
            }
        </ContainerDimensions>
    );
};

export default MediaSource;
