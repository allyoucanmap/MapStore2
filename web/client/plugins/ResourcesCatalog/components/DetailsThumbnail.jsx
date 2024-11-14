/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from 'react';
import Thumbnail from '../../../components/misc/Thumbnail';
import Icon from './Icon';
import Button from './Button';
import tooltip from '../../../components/misc/enhancers/tooltip';
const ButtonWithToolTip = tooltip(Button);

function DetailsThumbnail({
    icon,
    editing,
    thumbnail,
    width,
    height,
    onChange
}) {
    const thumbnailRef = useRef(null);
    const handleUpload = () => {
        const input = thumbnailRef?.current?.querySelector('input');
        if (input) {
            input.click();
        }
    };

    return (
        <div ref={thumbnailRef} className="ms-details-thumbnail">
            {icon ? <Icon {...icon} /> : null}
            {editing
                ? <>
                    <Thumbnail
                        thumbnail={thumbnail}
                        onUpdate={(data) => {
                            onChange(data);
                        }}
                        thumbnailOptions={{
                            contain: false,
                            width,
                            height,
                            type: 'image/jpg',
                            quality: 0.5
                        }}
                    />
                    <div className="ms-details-thumbnail-tools">
                        <ButtonWithToolTip
                            variant="primary"
                            size="xs"
                            onClick={() => handleUpload()}
                            tooltipId="resourcesCatalog.uploadImage"
                            tooltipPosition={"top"}
                        >
                            <Icon glyph="upload" />
                        </ButtonWithToolTip>
                        <ButtonWithToolTip
                            variant="primary"
                            size="xs"
                            onClick={() => onChange('')}
                            tooltipId="resourcesCatalog.removeThumbnail"
                            tooltipPosition={"top"}
                        >
                            <Icon glyph="trash" />
                        </ButtonWithToolTip>
                    </div>
                </>
                : <>
                    {thumbnail ? <img src={thumbnail}/> : null}
                </>}
        </div>
    );
}

export default DetailsThumbnail;
