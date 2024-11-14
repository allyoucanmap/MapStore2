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
        getThumbnailUrl = () => undefined,
        getTitle = () => ''
    } = getResourceTypesInfo(resource) || {};

    const title = getTitle(resource);

    return (
        <>
            <div style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <div className="ms-details-panel-header" style={{ position: 'absolute', width: '100%', ...(titleInView && { background: 'transparent' }) }}>
                    <div className="ms-details-panel-header-title">
                        {(!titleInView && title) ? <><Icon {...icon} />{' '}</> : null}
                        {(!titleInView && title) ? title : null}
                    </div>
                    {(!titleInView && title) ? tools : null}
                    <Button
                        variant="default"
                        onClick={onClose}
                        className="square-button-md">
                        <Icon glyph="1-close" type="glyphicon" />
                    </Button>
                </div>
            </div>
            <div>
                <DetailsThumbnail
                    editing={editing}
                    icon={icon}
                    key={resource.pk}
                    thumbnail={getThumbnailUrl(resource)}
                    width={640}
                    height={130}
                    onChange={onChangeThumbnail}
                />
                <div ref={titleNodeRef}></div>
                <div className="ms-details-panel-title" >
                    <div>
                        {!loading ? <Icon {...icon} /> : <Spinner />}{' '}
                        {title}
                    </div>
                    {tools}
                </div>
            </div>
        </>
    );
}

export default DetailsHeader;
