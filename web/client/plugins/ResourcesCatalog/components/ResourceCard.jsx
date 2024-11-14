/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef, useState, useRef } from 'react';
import Message from '../../../components/I18N/Message';
import Icon from './Icon';
import Button from './Button';
import Spinner from './Spinner';
import ResourceStatus from './ResourceStatus';
import AuthorInfo from './AuthorInfo';
import ActionButtons from './ActionButtons';
import ALink from './ALink';
import moment from 'moment';
import castArray from 'lodash/castArray';
import { isObject } from 'lodash';

const ResourceCardButton = ({
    glyph,
    iconType,
    labelId,
    onClick,
    ...props
}) => {
    function handleOnClick(event) {
        event.stopPropagation();
        onClick(event);
    }
    return (
        <Button
            variant="primary"
            size="xs"
            {...props}
            onClick={handleOnClick}
        >
            {glyph ? <><Icon type={iconType} glyph={glyph}/></> : null}
            {glyph && labelId ? ' ' : null}
            {labelId ? <Message msgId={labelId} /> : null}
        </Button>
    );
};

const ResourceCardWrapper = ({
    children,
    viewerUrl,
    readOnly,
    resource,
    ...props
}) => {
    const showViewerLink = !!(!readOnly && viewerUrl);
    return (
        <div {...props}>
            {showViewerLink ? (
                <a
                    className="ms-resource-card-link"
                    href={viewerUrl}
                />
            ) : null}
            {children}
        </div>
    );
};

const ResourceCardMetadataValue = ({
    value,
    entry,
    readOnly,
    formatHref,
    query
}) => {

    const getFilterActiveClassName = (filter, val) => {
        const filters = castArray(query[filter] || []);
        return filters.includes(val) ? ' active' : '';
    };

    const getProperties = () => {
        if (isObject(value)) {
            return {
                value: value[entry.itemValue],
                color: value[entry.itemColor]
            };
        }
        return {
            value
        };
    };

    const properties = getProperties();

    return (
        <ALink
            className={`ms-${entry.type || 'string'}${getFilterActiveClassName(entry.filter, properties.value)}`}
            style={{
                '--color': properties.color
            }}
            readOnly={readOnly}
            href={entry.filter ? formatHref({
                query: {
                    [entry.filter]: properties.value
                }
            }) : undefined}
        >
            {entry.type === 'date' && entry.format && properties.value
                ? moment(properties.value).format(entry.format)
                : properties.value}
        </ALink>
    );
};

const ResourceCardMetadataEntry = ({
    entry,
    value,
    formatHref,
    readOnly,
    query,
    column
}) => {
    return (
        <div key={entry.key} className={`ms-card-text${entry.showFullContent ? ' expanded' : ''}`} style={column?.width ? { width: `${column.width}%` } : {}}>
            {entry.icon ? <><Icon {...entry.icon}/>{' '}</> : null}
            {Array.isArray(value)
                ? value.map((val, idx) => {
                    return (<ResourceCardMetadataValue key={idx} value={val} entry={entry} formatHref={formatHref} readOnly={readOnly} query={query}/>);
                })
                : <ResourceCardMetadataValue value={value} entry={entry} formatHref={formatHref} readOnly={readOnly} query={query}/>}
        </div>
    );
};


const ResourceCardGridBody = ({
    icon,
    loading,
    downloading,
    metadata,
    resource,
    formatHref,
    readOnly,
    query,
    viewerUrl,
    buttons,
    statusItems,
    options,
    thumbnailUrl
}) => {

    const [imgError, setImgError] = useState(false);

    const imageNode = (imgError || !thumbnailUrl) ? (
        <div className={`ms-card-img ms-card-img-placeholder`}>
            <Icon {...icon} />
        </div>
    ) : (
        <img
            className={`ms-card-img`}
            src={thumbnailUrl}
            onError={() => setImgError(true)}
        />
    );

    const headerEntry = metadata.find(entry => entry.target === 'header');
    const footerEntry = metadata.find(entry => entry.target === 'footer');
    return (
        <>
            {imageNode}
            <div className="ms-resource-card-body-wrapper">
                <div className="ms-card-body">
                    <div className="ms-card-header">
                        <div className="ms-card-title-content">
                            {(icon && !loading && !downloading) && (
                                <Icon {...icon} />
                            )}
                            {(loading || downloading) && <Spinner />}
                            <span className="ms-card-title">
                                {headerEntry?.key ? <ResourceCardMetadataValue
                                    entry={headerEntry}
                                    value={resource[headerEntry.key]}
                                    formatHref={formatHref}
                                    readOnly={readOnly}
                                    query={query}
                                /> : null}
                            </span>
                        </div>
                        <ResourceStatus statusItems={statusItems} />
                    </div>
                    <div className="ms-card-metadata">
                        {metadata.filter(entry => !['header', 'footer'].includes(entry.target)).map((entry) => {
                            const value = resource[entry.key];
                            return (
                                <ResourceCardMetadataEntry
                                    key={entry.key}
                                    entry={entry}
                                    value={value}
                                    formatHref={formatHref}
                                    readOnly={readOnly}
                                    query={query}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="ms-card-footer-wrapper">
                    <div className="ms-card-footer">
                        {footerEntry?.key ? <ResourceCardMetadataEntry
                            entry={footerEntry}
                            value={resource[footerEntry.key]}
                            formatHref={formatHref}
                            readOnly={readOnly}
                            query={query}
                        /> : null}
                        <div className="ms-card-actions">
                            {buttons.map(({ Component, name }) => {
                                return (
                                    <Component
                                        key={name}
                                        resource={resource}
                                        viewerUrl={viewerUrl}
                                        component={ResourceCardButton}
                                        readOnly={readOnly}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {!readOnly && options?.length > 0
                ? (
                    <ActionButtons
                        resource={resource}
                        viewerUrl={viewerUrl}
                        options={options}
                        readOnly={readOnly}
                    />
                )
                : null}
        </>
    );
};

const ResourceCardListBody = ({
    icon,
    loading,
    downloading,
    metadata,
    resource,
    formatHref,
    readOnly,
    query,
    viewerUrl,
    options,
    columns,
    statusItems
}) => {
    return (
        <>
            <div className="ms-card-title-content">
                {(icon && !loading && !downloading) && (
                    <Icon {...icon} />
                )}
                {(loading || downloading) && <Spinner />}
            </div>
            <div className="ms-resource-card-body-wrapper">
                <div className="ms-card-metadata">
                    {metadata.map((entry) => {
                        const value = resource[entry.key];
                        const column = columns.find(col => col.key === entry.key);
                        return (
                            <ResourceCardMetadataEntry
                                key={entry.key}
                                entry={entry}
                                value={value}
                                column={column}
                                formatHref={formatHref}
                                readOnly={readOnly}
                                query={query}
                            />
                        );
                    })}
                </div>
            </div>
            {!readOnly && options?.length > 0
                ? (
                    <ActionButtons
                        resource={resource}
                        viewerUrl={viewerUrl}
                        options={options}
                        readOnly={readOnly}
                    />
                )
                : null}
        </>
    );
};

const cardBody = {
    grid: ResourceCardGridBody,
    list: ResourceCardListBody
};

const ResourceCard = forwardRef(({
    data,
    active,
    options = [],
    layoutCardsStyle,
    readOnly,
    className,
    loading,
    downloading,
    statusItems,
    registry,
    buttons = [],
    component,
    query,
    metadata = [],
    columns = []
}, ref) => {

    const {
        formatHref,
        getResourceTypesInfo
    } = registry;

    const resource = data;
    const {
        icon,
        formatViewerUrl,
        getThumbnailUrl = () => undefined
    } = getResourceTypesInfo(resource) || {};

    const viewerUrl = resource?.pk && formatViewerUrl ? formatViewerUrl(resource) : undefined;
    const CardComponent = component || ResourceCardWrapper;
    const CardBody = cardBody[layoutCardsStyle];
    return (
        <CardComponent
            ref={ref}
            resource={resource}
            viewerUrl={viewerUrl}
            readOnly={readOnly}
            className={[
                'ms-resource-card',
                active ? 'active' : '',
                readOnly ? 'read-only' : '',
                className ? ` ${className}` : ''
            ].join(' ')}
        >
            <div className={`ms-card-resource-${layoutCardsStyle}`}>
                {CardBody ? <CardBody
                    icon={icon}
                    loading={loading}
                    downloading={downloading}
                    metadata={metadata}
                    resource={resource}
                    formatHref={formatHref}
                    readOnly={readOnly}
                    query={query}
                    viewerUrl={viewerUrl}
                    buttons={buttons}
                    statusItems={statusItems}
                    options={options}
                    columns={columns}
                    thumbnailUrl={getThumbnailUrl(resource)}
                /> : null}
            </div>
        </CardComponent>
    );
});

ResourceCard.defaultProps = {
    links: [],
    theme: 'light',
    formatHref: () => '#',
    featured: false
};

export default ResourceCard;
