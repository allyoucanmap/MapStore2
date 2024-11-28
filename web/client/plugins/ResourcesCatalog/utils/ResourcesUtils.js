import { isEmpty, isEqual, omit, isArray, isObject } from 'lodash';
import merge from 'lodash/fp/merge';

const NODATA = 'NODATA';

export const parseNODATA = (value) => value === NODATA ? '' : value;

export const resourceTypes = {
    MAP: {
        icon: { glyph: '1-map', type: 'glyphicon' },
        formatViewerPath: (resource) => {
            const extras = resource['@extras'];
            if (extras?.context?.name) {
                return `/context/${extras.context.name}/${resource.pk}`;
            }
            return `/viewer/${resource.pk}`;
        }
    },
    DASHBOARD: {
        icon: { glyph: 'dashboard', type: 'glyphicon' },
        formatViewerPath: (resource) => {
            return `/dashboard/${resource.pk}`;
        }
    },
    GEOSTORY: {
        icon: { glyph: 'geostory', type: 'glyphicon' },
        formatViewerPath: (resource) => {
            return `/geostory/${resource.pk}`;
        }
    },
    CONTEXT: {
        icon: { glyph: 'cogs' },
        formatViewerPath: (resource) => {
            return `/context/${resource.name}`;
        }
    }
};

export const getResourceTypesInfo = (resource) => {
    const thumbnailUrl = parseNODATA(resource?.attributes?.thumbnail);
    const title = resource?.name || '';
    const { icon, formatViewerPath } = resourceTypes[resource?.category?.name] || {};
    const pk = resource?.pk || resource?.id;
    const viewerPath = pk && formatViewerPath ? formatViewerPath({ pk, ...resource }) : undefined;
    return {
        title,
        icon,
        thumbnailUrl,
        viewerPath,
        viewerUrl: `#${viewerPath}`
    };
};

export const getResourceStatus = (resource) => {
    const extras = resource['@extras'];
    return {
        items: [
            ...(resource.advertised === false ? [{
                type: 'icon',
                tooltipId: 'resourcesCatalog.unadvertised',
                variant: 'warning',
                glyph: 'eye-slash'
            }] : []),
            ...(extras?.context?.name ? [{
                type: 'icon',
                glyph: 'cogs',
                tooltip: extras.context.name
            }] : [])
        ]
    };
};

const recursivePendingChanges = (a, b) => {
    return Object.keys(a).reduce((acc, key) => {
        if (!isArray(a[key]) && isObject(a[key])) {
            const obj = recursivePendingChanges(a[key], b[key]);
            return isEmpty(obj) ? acc : { ...acc, [key]: obj };
        }
        return !isEqual(a[key], b[key])
            ? { ...acc, [key]: a[key] }
            : acc;
    }, {});
};


export const computePendingChanges = (initialResource, resource, resourceData) => {
    const { attributes: pendingAttributes = {}, ...pendingChanges } = recursivePendingChanges(resource, initialResource);
    const attributesKeys = [
        'thumbnail',
        'details'
    ];
    const categoryOptions = {
        'thumbnail': {
            tail: '/raw?decode=datauri',
            category: 'THUMBNAIL'
        },
        'details': {
            category: 'DETAILS'
        }
    };
    const linkedResources = attributesKeys.reduce((acc, key) => {
        const value = initialResource?.attributes?.[key] || NODATA;
        const data = pendingAttributes?.[key] || NODATA;
        if (pendingAttributes?.[key] !== undefined && value !== data) {
            return {
                ...acc,
                [key]: {
                    ...categoryOptions[key],
                    value,
                    data
                }
            };
        }
        return acc;
    }, {});
    const attributes = omit(pendingAttributes, attributesKeys);
    const excludedMetadata = ['pk', 'permissions', 'attributes', 'data', 'category'];
    const metadata = merge(omit(initialResource, excludedMetadata), omit(pendingChanges, excludedMetadata));
    const mergedAttributes = merge(initialResource.attributes, attributes) || {};

    return {
        initialResource,
        resource,
        saveResource: {
            id: initialResource.pk || initialResource.id,
            ...(resourceData?.payload && { data: resourceData.payload }),
            permission: pendingChanges.permissions ?? initialResource.permissions,
            category: initialResource?.category?.name,
            metadata: {
                ...metadata,
                attributes: Object.fromEntries(Object.keys(mergedAttributes || {}).map((key) => {
                    return [key, isObject(mergedAttributes[key])
                        ? JSON.stringify(mergedAttributes[key])
                        : mergedAttributes[key]];
                }))
            },
            ...(!isEmpty(linkedResources) && { linkedResources })
        },
        changes: {
            ...pendingChanges,
            ...(!isEmpty(attributes) && { attributes }),
            ...(!isEmpty(linkedResources) && { linkedResources }),
            ...(resourceData?.pending && { data: true })
        }
    };
};
