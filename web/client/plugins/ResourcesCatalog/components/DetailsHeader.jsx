/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { useInView } from 'react-intersection-observer';
import Button from './Button';
import Icon from './Icon';
import Spinner from './Spinner';
import DetailsThumbnail from './DetailsThumbnail';
import Box from './Box';
import Text from './Text';

function DetailsHeader({
    resource,
    editing,
    onChangeThumbnail,
    onClose,
    tools,
    loading,
    getResourceTypesInfo = () => ({})
}) {

    const [titleNodeRef, titleInView] = useInView();
    const {
        icon,
        thumbnailUrl,
        title
    } = getResourceTypesInfo(resource) || {};


    return (
        <>
            <Box position="sticky" style={{ zIndex: 1 }}>
                <Box
                    position="absolute"
                    display="flex"
                    flexVerticalAlign
                    flexGap="sm"
                    className="ms-main-colors"
                    pointerEvents={titleInView ? 'none' : undefined}
                    p="md"
                    style={{ width: '100%', ...(titleInView && { background: 'transparent' }) }}>
                    <Box flexFill>
                        <Text ellipsis >
                            {(!titleInView && title) ? <><Icon {...icon} />{' '}</> : null}
                            {(!titleInView && title) ? title : null}
                        </Text>
                    </Box>
                    {(!titleInView && title) ? tools : null}
                    <Box pointerEvents="auto">
                        <Button
                            variant="default"
                            onClick={onClose}
                            className="square-button-md">
                            <Icon glyph="1-close" type="glyphicon" />
                        </Button>
                    </Box>
                </Box>
            </Box>
            <DetailsThumbnail
                editing={editing}
                icon={icon}
                key={resource.pk}
                thumbnail={thumbnailUrl}
                width={640}
                height={130}
                onChange={onChangeThumbnail}
            />
            <div ref={titleNodeRef}></div>
            <Box display="flex" flexGap="sm" p="md">
                <Box flexFill>
                    <Text fontSize="lg">
                        {!loading ? <Icon {...icon} /> : <Spinner />}{' '}
                        {title}
                    </Text>
                </Box>
                {tools}
            </Box>
        </>
    );
}

export default DetailsHeader;
