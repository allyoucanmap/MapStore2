/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import Loader from '../../misc/Loader';
import { withResizeDetector } from 'react-resize-detector';
import { Glyphicon } from 'react-bootstrap';
import { Modes } from '../../../utils/GeoStoryUtils';

/**
 * Video component
 * @prop {string} src source of the video
 * @prop {number} resolution resolution of the video
 * @prop {string} fit one of `cover`, `contain` or undefined
 * (`cover` provides a video covering the available space provided by its own container
 * and it has loop enabled and controls disabled by default)
 * @prop {string} loop loop the video (loop has no effect for fit equal to `cover`)
 * @prop {string} volume change the volume of video, value between 0.0 and 1.0
 * @prop {string} muted mute the video audio
 * @prop {string} thumbnail source of thumbnail
 * @prop {boolean} controls enable/disable video controls (controls has no effect for fit equal to `cover`)
 * @prop {boolean} play play/stop the video
 * @prop {function} onPlay on playing event callback
 * @prop {function} onStart on start event callback
 */
const Video = withResizeDetector(({
    src,
    width,
    height,
    resolution,
    thumbnail,
    controls,
    play,
    onPlay = () => {},
    onStart = () => {},
    fit,
    loop,
    volume = 1,
    muted
}) => {

    const playing = play;
    const [started, setStarted] = useState(playing);
    const [error, setError] = useState();
    const [loading, setLoading] = useState(play);

    useEffect(() => {
        if (!started && playing) {
            setStarted(true);
            setLoading(true);
        }
        if (started) {
            onStart(started);
        }
    }, [started, playing]);

    function getSize() {
        const containerResolution = width / height;
        if (fit === 'cover') {
            return containerResolution < resolution
                ? [ height * resolution, height]
                : [ width, width / resolution ];
        }
        if (fit === 'contain') {
            return containerResolution < resolution
                ? [ width, width / resolution]
                : [ height * resolution, height];
        }
        return [ width, width / resolution];
    }

    const size = getSize();

    const containerHeight = (fit === 'contain' || fit === 'cover') ? height : size[1];

    const showControls = fit === 'cover' ? false : controls;
    const forceLoop = fit === 'cover' ? true : loop;

    return (
        <div
            className="ms-video"
            style={{
                position: 'relative',
                width,
                height: containerHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
            {src &&
            <>
            {started && <ReactPlayer
                url={src}
                width={size[0]}
                height={size[1]}
                playing={playing}
                loop={forceLoop}
                volume={volume}
                muted={muted}
                style={fit === 'cover'
                    ? {
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        position: 'absolute'
                    } : {}}
                controls={showControls}
                pip={false}
                fileConfig={{
                    attributes: {
                        controlsList: 'nodownload',
                        disablePictureInPicture: true
                    }
                }}
                youtubeConfig={{
                    playerVars: {
                        controls: showControls ? 2 : 0,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: fit === 'cover' ? 0 : 1
                    }
                }}
                onReady={() => setLoading(false)}
                onError={e => setError(e)}
                onPause={() => onPlay(false)}
                onPlay={() => onPlay(true)}
            />}
            {(!started || started && (loading || error)) && <div
                className="ms-video-cover"
                style={{
                    position: 'absolute',
                    width: size[0],
                    height: size[1],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 1.0)',
                    ...(!(loading || error) && { cursor: 'pointer' }),
                    ...(!playing && thumbnail && {
                        backgroundImage: `url(${thumbnail})`,
                        backgroundSize: fit === 'cover' ? 'cover' : '640px auto',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    })
                }}
                onClick={() => {
                    setStarted(true);
                    setLoading(true);
                    onPlay(true);
                }}>
                {loading && <Loader size={70}/>}
                {error && 'Error'}
                {!(loading || error) && !playing &&
                    <Glyphicon
                        glyph="play"
                        style={{
                            fontSize: size[1] / 4 > 100 ? 100 : size[1] / 4,
                            mixBlendMode: 'difference',
                            color: '#ffffff'
                        }}
                    />}
            </div>}
            </>}
            {!showControls && <div
                className="ms-video-mask-cover"
                style={{
                    position: 'absolute',
                    width: size[0],
                    height: size[1]
                }}>
            </div>}
        </div>
    );
});

/**
 * Video Media component
 * @prop {string} id unique id that represent the media
 * @prop {string} src source of the video
 * @prop {number} resolution resolution of the video
 * @prop {boolean} autoplay play the video when is in view
 * @prop {boolean} inView define if the video si in the window view
 * @prop {string} fit one of `cover`, `contain` or undefined
 * (`cover` provides a video covering the available space provided by its own container
 * and it has loop enabled and controls disabled by default)
 * @prop {string} loop loop the video (loop has no effect for fit equal to `cover`)
 * @prop {string} muted mute the video audio
 * @prop {string} description video description
 * @prop {boolean} descriptionEnabled display/hide description
 * @prop {string} thumbnail source of thumbnail
 * @prop {string} credits source of thumbnail
 * @prop {boolean} controls enable/disable video controls (controls has no effect for fit equal to `cover`)
 * @prop {function} onPlay on play callback
 * @prop {string} mode one of 'view' or 'edit'
 * @prop {boolean} containerInView define if the container is in view, useful for scrollable container with content with position sticky eg. Backgrounds
 */
const VideoMedia = ({
    id,
    src,
    resolution = 16 / 9,
    autoplay,
    inView,
    description,
    descriptionEnabled = true,
    thumbnail,
    credits,
    controls = true,
    fit,
    loop,
    muted,
    onPlay = () => {},
    mode,
    containerInView = true
}) => {

    // ensure both container and content are visible
    const isVisible = containerInView && inView;

    const [playing, setPlaying] = useState(false);
    const [started, setStarted] = useState(false);

    const handleOnPlay = (newPlaying) => {
        setPlaying(newPlaying);
        onPlay(newPlaying);
    };

    // reset player after switching from view to edit mode
    useEffect(() => {
        if (mode === Modes.EDIT) {
            handleOnPlay(false);
            setStarted(false);
        }
    }, [ mode ]);

    // enable autoplay only the first time the video is in view for fit undefined or contained
    // while fit cover should always trigger autoplay when in view
    useEffect(() => {
        if (mode === Modes.VIEW
        && isVisible
        && (fit === 'cover' || autoplay && !started)) {
            handleOnPlay(true);
        }
    }, [ isVisible, autoplay, started, fit, mode ]);

    // video should stop after when not in view
    useEffect(() => {
        if (mode === Modes.VIEW && !isVisible && playing) {
            handleOnPlay(false);
        }
    }, [isVisible, playing, mode]);

    return (
        <div
            id={id}
            key={`${id}-${fit}-${mode}`}
            className="ms-media ms-media-video">
            <Video
                src={src}
                play={playing && mode === Modes.VIEW}
                resolution={resolution}
                thumbnail={thumbnail}
                controls={controls && mode === Modes.VIEW}
                onPlay={handleOnPlay}
                onStart={setStarted}
                fit={fit}
                loop={loop}
                muted={muted}
            />
            {credits && <div className="ms-media-credits">
                <small>
                    {credits}
                </small>
            </div>}
            {descriptionEnabled && description && <div className="ms-media-description">
                <small>
                    {description}
                </small>
            </div>}
        </div>
    );
};

export default VideoMedia;
