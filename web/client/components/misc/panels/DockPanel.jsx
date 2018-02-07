/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const Dock = require('react-dock').default;
const BorderLayout = require('../../layout/BorderLayout');
const {withState} = require('recompose');
const PanelHeader = require('./PanelHeader');

module.exports = withState('fullscreen', 'onFullscreen', false)(
    ({
        fluid,
        className = '',
        fullscreen = false,
        position,
        open,
        size = 550,
        style = {},
        zIndex = 1030,
        onClose,
        bsStyle,
        title,
        showFullscreen = false,
        glyph,
        header,
        footer,
        children,
        onFullscreen = () => {}
    }) =>
        <span className={'ms-side-panel ' + className}>
            <Dock
                fluid={fluid || fullscreen}
                position={position}
                dimMode="none"
                isVisible={open}
                size={fullscreen ? 1 : size}
                dockStyle={style}
                zIndex={zIndex}>
                <BorderLayout
                    header={
                        <PanelHeader
                            position={position}
                            onClose={onClose}
                            bsStyle={bsStyle}
                            title={title}
                            fullscreen={fullscreen}
                            showFullscreen={showFullscreen}
                            glyph={glyph}
                            additionalRows={header}
                            onFullscreen={onFullscreen}/>
                    }
                    footer={footer}>
                    {children}
                </BorderLayout>
            </Dock>
        </span>
);
