
import React, { useState } from 'react';
import MediaModal from './MediaModal';
import MediaSource from './MediaSource';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import { DropdownButton as DropdownButtonRB, Glyphicon, MenuItem } from 'react-bootstrap';
import tooltip from '@mapstore/components/misc/enhancers/tooltip';

const DropdownButton = tooltip(DropdownButtonRB);

const Media = ({
    id,
    src,
    type,
    cover,
    invert,
    position,
    credits,
    size,
    style = {},
    edit = true,
    onChange = () => {},
    forceHorizontal,
    fullscreenOnClick,
    disableContainerDimension,
    readOnly,
    simpleEdit
}) => {
    const [ show, onShow ] = useState();
    return (
        <MediaSource
            id={id}
            src={src}
            type={type}
            cover={cover}
            invert={invert}
            style={style}
            position={position}
            size={size}
            fullscreenOnClick={fullscreenOnClick}
            readOnly={readOnly}
            disableContainerDimension={disableContainerDimension}
            forceHorizontal={forceHorizontal}>
            {edit &&
            <div className="ms-background-tools">
                <Toolbar
                    btnDefaultProps={{
                        className: 'square-button-md no-border',
                        bsStyle: 'default',
                        style: { opacity: 0.9 }
                    }}
                    buttons={readOnly ? [] : [
                        {
                            glyph: 'pencil',
                            tooltip: 'Change media source',
                            onClick: () => onShow(true)
                        },
                        {
                            glyph: '1-map',
                            visible: type === 'map',
                            tooltip: 'Edit map zoom and center',
                            onClick: () => onChange({ invert: !invert })
                        },
                        {
                            glyph: 'fullscreen',
                            visible: !simpleEdit,
                            tooltip: cover ? 'Fit the container space' : 'Cover the container space',
                            onClick: () => onChange({ cover: !cover })
                        },
                        {
                            Element: () => {
                                const items = [
                                    {
                                        key: 'small',
                                        label: 'Small'
                                    },
                                    {
                                        key: 'medium',
                                        label: 'Medium'
                                    },
                                    {
                                        key: 'large',
                                        label: 'Large'
                                    },
                                    {
                                        key: 'full',
                                        label: 'Full'
                                    }
                                ];
                                return (
                                    <DropdownButton
                                        noCaret
                                        tooltip="Change size"
                                        className="square-button-md no-border"
                                        style={{ opacity: 0.9 }}
                                        title={<Glyphicon glyph="resize-horizontal"/>}>
                                        {items.map((item) => (
                                            <MenuItem
                                                key={item.key}
                                                active={size === item.key}
                                                onClick={() => onChange({ size: item.key })}>
                                                {item.label}
                                            </MenuItem>
                                        ))}
                                    </DropdownButton>
                                );
                            }
                        },
                        {
                            visible: (size === 'full' && !cover) || size !== 'full',
                            Element: () => {
                                const items = [
                                    {
                                        key: 'left',
                                        label: 'Align left',
                                        glyph: 'align-left'
                                    },
                                    {
                                        key: 'center',
                                        label: 'Align center',
                                        glyph: 'align-center'
                                    },
                                    {
                                        key: 'right',
                                        label: 'Align right',
                                        glyph: 'align-right'
                                    }
                                ];
                                return (
                                    <DropdownButton
                                        noCaret
                                        tooltip="Align content"
                                        className="square-button-md no-border"
                                        style={{ opacity: 0.9 }}
                                        title={<Glyphicon glyph={`align-${position || 'center'}`}/>}>
                                        {items.map((item) => (
                                            <MenuItem
                                                key={item.key}
                                                active={position === item.key}
                                                onClick={() => onChange({ position: item.key })}>
                                                <Glyphicon glyph={`align-${item.key}`}/> {item.label}
                                            </MenuItem>
                                        ))}
                                    </DropdownButton>
                                );
                            }
                        },
                        {
                            glyph: 'dropper',
                            visible: !simpleEdit && !cover,
                            onClick: () => onChange({ invert: !invert })
                        }
                    ]}/>
                <MediaModal
                    id={id}
                    src={src}
                    type={type}
                    show={show}
                    onShow={onShow}
                    onChange={onChange}/>
            </div>}
            {credits && <div className="ms-background-tools ms-background-credits">
                <small>{credits}</small>
            </div>}
        </MediaSource>
    );
};

export default Media;
