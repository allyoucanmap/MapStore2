import React, { useRef } from 'react';
import MapView from '@mapstore/components/widgets/widget/MapView';

const Media = ({ id, src, type, cover, invert, style = {} }) => {
    const mediaRef = useRef(null);
    return (
        <div className={`ms-background${cover ? ' cover' : ''}${invert ? ` ms-invert` : ''}`} style={style}>
            {type === 'image' && <img src={src} />}
            {type === 'map' && <MapView
                id={id}
                options={{
                    style: {
                        width: '100%',
                        height: '100%'
                    }
                }}
                { ...src } />}
            {type === 'video' && <video
                src={src}
                ref={videoRef => {
                    mediaRef.current = videoRef;
                }}
                onClick={() => {
                    if (mediaRef.current) {
                        if (mediaRef.current.paused) {
                            mediaRef.current.play();
                        } else {
                            mediaRef.current.pause();
                        }
                    }
                }} />}
        </div>
    );
};

export default Media;
