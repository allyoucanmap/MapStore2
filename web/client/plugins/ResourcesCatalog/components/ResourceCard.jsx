/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef, useState } from 'react';
import Message from '../../../components/I18N/Message';
import Icon from './Icon';
import Button from './Button';
import Spinner from './Spinner';
import ResourceStatus from './ResourceStatus';
import ResourceCardActionButtons from './ResourceCardActionButtons';
import ALink from './ALink';
import moment from 'moment';
import castArray from 'lodash/castArray';
import { isObject } from 'lodash';
import Box from './Box';
import Text from './Text';
import tooltip from '../../../components/misc/enhancers/tooltip';
const ButtonWithTooltip = tooltip(Button);

const ResourceCardButton = ({
    glyph,
    iconType,
    labelId,
    onClick,
    square,
    ...props
}) => {
    function handleOnClick(event) {
        event.stopPropagation();
        onClick(event);
    }
    return (
        <ButtonWithTooltip
            variant="primary"
            {...(square ? { square: "md" } : { size: "sm"  })}
            {...props}
            tooltipId={square && labelId ? labelId : null}
            onClick={handleOnClick}
        >
            {glyph ? <><Icon type={iconType} glyph={glyph}/></> : null}
            {glyph && labelId ? ' ' : null}
            {labelId && !square ? <Message msgId={labelId} /> : null}
        </ButtonWithTooltip>
    );
};

const ResourceCardWrapper = ({
    children,
    viewerUrl,
    readOnly,
    resource,
    active,
    interactive,
    ...props
}) => {
    const showViewerLink = !!(!readOnly && viewerUrl);
    return (
        <Box
            position="relative"
            display="flex"
            flexColumn
            active={active}
            interactive={interactive}
            {...props}
        >
            {showViewerLink ? (
                <Box
                    component="a"
                    position="absolute"
                    fill
                    href={viewerUrl}
                />
            ) : null}
            {children}
        </Box>
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
                '--tag-color': properties.color
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
    column,
    ...props
}) => {
    return (
        <Text
            key={entry.key}
            fontSize="sm"
            ellipsis={!entry.showFullContent}
            style={column?.width ? { width: `${column.width}%` } : {}}
            {...props}
        >
            {entry.icon ? <><Icon {...entry.icon}/>{' '}</> : null}
            {Array.isArray(value)
                ? value.map((val, idx) => {
                    return (<ResourceCardMetadataValue key={idx} value={val} entry={entry} formatHref={formatHref} readOnly={readOnly} query={query}/>);
                })
                : <ResourceCardMetadataValue value={value} entry={entry} formatHref={formatHref} readOnly={readOnly} query={query}/>}
        </Text>
    );
};

const ResourceCardImage = ({
    icon,
    src,
    className
}) => {
    const [imgError, setImgError] = useState(false);
    return (imgError || !src) ? (
        <Box
            className={className}
            display="flex"
            flexItemsCenter
            pointerEvents="none"
        >
            <Text fontSize="xxl">
                <Icon {...icon} />
            </Text>
        </Box>
    ) : (
        <img
            className={className}
            src={src}
            onError={() => setImgError(true)}
        />
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

    const headerEntry = metadata.find(entry => entry.target === 'header');
    const footerEntry = metadata.find(entry => entry.target === 'footer');

    return (
        <Box>
            <ResourceCardImage
                className="ms-resource-card-img ms-image-colors"
                src={thumbnailUrl}
                icon={icon}
            />
            <Box
                display="flex"
                flexColumn
                flexGap="sm"
                p="sm"
            >
                <Box display="flex" flexGap="sm" flexVerticalAlign>
                    <Box display="flex" flexFill>
                        <Text fontSize="md" ellipsis>
                            {(icon && !loading && !downloading) && (
                                <><Icon {...icon} />{' '}</>
                            )}
                            {headerEntry?.key ? <ResourceCardMetadataValue
                                entry={headerEntry}
                                value={resource[headerEntry.key]}
                                formatHref={formatHref}
                                readOnly={readOnly}
                                query={query}
                            /> : null}
                        </Text>
                    </Box>
                    <ResourceStatus statusItems={statusItems} />
                </Box>
                {metadata.filter(entry => !['header', 'footer'].includes(entry.target)).map((entry) => {
                    const value = resource[entry.key];
                    if (!value) {
                        return null;
                    }
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
                <Box display="flex" flexGap="sm" flexVerticalAlign>
                    <Box display="flex" flexFill>
                        {footerEntry?.key ? <ResourceCardMetadataEntry
                            entry={footerEntry}
                            value={resource[footerEntry.key]}
                            formatHref={formatHref}
                            readOnly={readOnly}
                            query={query}
                        /> : null}
                    </Box>
                    <Box display="flex" position="relative">
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
                    </Box>
                </Box>
            </Box>
            {!readOnly && options?.length > 0
                ? (
                    <ResourceCardActionButtons
                        resource={resource}
                        viewerUrl={viewerUrl}
                        options={options}
                        readOnly={readOnly}
                        position="absolute"
                        m="sm"
                    />
                )
                : null}
        </Box>
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
    options: optionsProp,
    buttons,
    columns
}) => {
    const options = [
        ...(buttons || []),
        ...(optionsProp || [])
    ];
    return (
        <Box display="flex" flexVerticalAlign>
            <div className="ms-resource-card-limit">
                {(icon && !loading && !downloading) && (
                    <Icon {...icon} />
                )}
                {(loading || downloading) && <Spinner />}
            </div>
            <Box display="flex" flexFill flexVerticalAlign>
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
                            p="sm"
                        />
                    );
                })}
            </Box>
            <div className="ms-resource-card-limit">
                {!readOnly && options?.length > 0
                    ? (
                        <ResourceCardActionButtons
                            resource={resource}
                            viewerUrl={viewerUrl}
                            options={options}
                            readOnly={readOnly}
                        />
                    )
                    : null}
            </div>
        </Box>
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
        viewerUrl,
        thumbnailUrl
    } = getResourceTypesInfo(resource) || {};

    const CardComponent = component || ResourceCardWrapper;
    const CardBody = cardBody[layoutCardsStyle];
    return (
        <CardComponent
            ref={ref}
            resource={resource}
            viewerUrl={viewerUrl}
            readOnly={readOnly}
            active={active}
            interactive={!readOnly}
            className={`ms-resource-card ms-resource-card-type-${layoutCardsStyle} ms-main-colors${className ? ` ${className}` : ''}`}
        >
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
                thumbnailUrl={thumbnailUrl}
            /> : null}
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
