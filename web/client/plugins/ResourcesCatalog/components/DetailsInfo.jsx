/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import { Checkbox } from 'react-bootstrap';

import Button from './Button';
import Tabs from './Tabs';
import Message from '../../../components/I18N/Message';
import SelectInfiniteScroll from './SelectInfiniteScroll';
import ALink from './ALink';

const replaceTemplateString = (properties, str) => {
    return Object.keys(properties).reduce((updatedStr, key) => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        return updatedStr.replace(regex, properties[key]);
    }, str);
};

const getDateRangeValue = (startValue, endValue, format) => {
    if (startValue && endValue) {
        return `${moment(startValue).format(format)} - ${moment(endValue).format(format)}`;
    }
    return moment(startValue ? startValue : endValue).format(format);
};
const isEmptyValue = (value) => {
    if (Array.isArray(value)) {
        return isEmpty(value);
    }
    if (typeof value === 'object') {
        return isEmpty(value) || (isEmpty(value.start) && isEmpty(value.end));
    }
    return value === 'None' || !value;
};
const isStyleLabel = (style) => style === "label";
const isFieldLabelOnly = ({style, value}) => isEmptyValue(value) && isStyleLabel(style);

const DetailInfoFieldLabel = ({ field }) => {
    const label = field.labelId ? <Message msgId={field.labelId} /> : field.label;
    return isStyleLabel(field.style) && field.href
        ? (<a href={field.href} target={field.target}>{label}</a>)
        : label;
};

function DetailsInfoField({ field, children, className }) {
    const values = castArray(field.value);
    const isLinkLabel = isFieldLabelOnly(field);
    return (
        <div className={`ms-details-info-row${isLinkLabel ? ' link' : ''}${className ? ` ${className}` : ''}`}>
            <div className={`ms-details-info-label`}><DetailInfoFieldLabel field={field} /></div>
            {!isLinkLabel && <div className="ms-details-info-value">{children(values)}</div>}
        </div>
    );
}

function DetailsHTML({ value, placeholder }) {
    const [expand, setExpand] = useState(false);
    if (placeholder) {
        return (
            <div className={`ms-details-info-html${expand ? '' : ' collapsed'}`}>
                {expand
                    ? <div className="ms-details-info-html-value" dangerouslySetInnerHTML={{ __html: value }} />
                    : <div className="ms-details-info-html-value">{placeholder}</div>}
                <Button onClick={() => setExpand(!expand)}>
                    <Message msgId={expand ? 'resourcesCatalog.readLess' : 'resourcesCatalog.readMore'} />
                </Button>
            </div>);
    }
    return (
        <div dangerouslySetInnerHTML={{ __html: value }} />
    );
}


function DetailsInfoFieldEditing({ field, onChange }) {
    if (field.type === 'text') {
        return (
            <DetailsInfoField field={field}>
                {(values) => values.map((value, idx) => (
                    <input key={idx} value={value} onChange={(event) => onChange({ [field.path]: event.target.value })} />
                ))}
            </DetailsInfoField>
        );
    }
    if (field.type === 'boolean') {
        return (
            <div className={`ms-details-info-row`}>
                <div className={`ms-details-info-value`}>
                    <Checkbox checked={field.value} onChange={(event) => onChange({ [field.path]: event.target.checked })}>
                        <DetailInfoFieldLabel field={field} />
                    </Checkbox>
                </div>
            </div>
        );
    }
    if (field.type === 'tag' && field.loadItems) {
        return (
            <DetailsInfoField field={field} className="ms-details-info-tags">
                {() => <SelectInfiniteScroll
                    value={(field.value || []).map((value) => {
                        return {
                            item: value,
                            className: 'ms-tag',
                            style: { '--color': value[field.itemColor] },
                            value: value[field.itemValue || 'value'],
                            label: value[field.itemLabel || 'value']
                        };
                    })}
                    multi
                    placeholder={field.placeholderId}
                    onChange={(selected) => {
                        onChange({ [field.path]: selected.map(({ item }) => item )});
                    }}
                    loadOptions={({ q, config, ...params }) => field.loadItems({
                        config,
                        params: {
                            ...params,
                            ...(q && { q }),
                            page: params.page - 1
                        }
                    })
                        .then((response) => {
                            return {
                                ...response,
                                results: response.items.map((item) => ({
                                    selectOption: {
                                        item,
                                        className: 'ms-tag',
                                        style: { '--color': item[field.itemColor] },
                                        value: item[field.itemValue || 'value'],
                                        label: item[field.itemLabel || 'value']
                                    }
                                }))
                            };
                        })}
                />}
            </DetailsInfoField>
        );
    }
    return null;
}

function DetailsInfoFields({ fields, formatHref, editing, onChange, query = {} }) {
    return (<div className="ms-details-info-fields">
        {fields.map((field, filedIndex) => {

            if (editing && field.editable) {
                return <DetailsInfoFieldEditing key={filedIndex} field={field} onChange={onChange} />;
            }

            if (field.type === 'link') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => {
                            return field.href
                                ? <a key={idx} href={field.href}>{value}</a>
                                : <a key={idx} href={value.href}>{value.value}</a>;
                        })}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'query') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <a key={idx} href={formatHref({
                                query: field.queryTemplate
                                    ? Object.keys(field.queryTemplate)
                                        .reduce((acc, key) => ({
                                            ...acc,
                                            [key]: replaceTemplateString(value, field.queryTemplate[key])
                                        }), {})
                                    : field.query,
                                pathname: field.pathname
                            })}>{field.valueKey ? value[field.valueKey] : value}</a>
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'date') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <span key={idx}>{(value?.start || value?.end) ? getDateRangeValue(value.start, value.end, field.format || 'MMMM Do YYYY') : moment(value).format(field.format || 'MMMM Do YYYY')}</span>
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'html') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <DetailsHTML key={idx} value={value} placeholder={field.placeholder} />
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'text') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <span key={idx}>{value}</span>
                        ))}
                    </DetailsInfoField>
                );
            }
            if (field.type === 'tag') {
                return (
                    <DetailsInfoField key={filedIndex} field={field}>
                        {(values) => values.map((value, idx) => (
                            <ALink
                                key={idx}
                                className={`ms-tag${castArray(query[field.filter] || []).includes(value[field.itemValue || 'value']) ? ' active' : ''}`}
                                style={{ '--color': value[field.itemColor] }}
                                href={field.filter ? formatHref({
                                    query: {
                                        [field.filter]: value[field.itemValue || 'value']
                                    }
                                }) : undefined}
                            >
                                {value[field.itemValue || 'value']}
                            </ALink>
                        ))}
                    </DetailsInfoField>
                );
            }
            return null;
        })}
    </div>);
}

const defaultTabComponents = {
    'tab': DetailsInfoFields
};

const parseTabItems = (items) => {
    return (items || []).filter(({value, style}) => {
        return !(isEmptyValue(value) && !isStyleLabel(style));
    });
};
const isDefaultTabType = (type) => type === 'tab';

function DetailsInfo({
    tabs = [],
    tabComponents: tabComponentsProp,
    ...props
}) {

    const tabComponents = {
        ...tabComponentsProp,
        ...defaultTabComponents
    };

    const filteredTabs = tabs
        .filter((tab) => !tab?.disableIf)
        .map((tab) =>
            ({
                ...tab,
                items: isDefaultTabType(tab.type) && !props.editing ? parseTabItems(tab?.items) : tab?.items,
                Component: tabComponents[tab.type] || tabComponents.tab
            }))
        .filter(tab => !isEmpty(tab?.items));
    const [selectedTabId, onSelect] = useState(filteredTabs?.[0]?.id);
    return (
        <Tabs
            className="ms-details-info tabs-underline"
            selectedTabId={selectedTabId}
            onSelect={onSelect}
            tabs={filteredTabs.map(({Component, ...tab} = {}) => ({
                title: <DetailInfoFieldLabel field={tab} />,
                eventKey: tab?.id,
                component: <Component fields={tab?.items} {...props} />
            }))}
        />
    );
}

export default DetailsInfo;
