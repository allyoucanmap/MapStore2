
export const parseNODATA = (value) => value === 'NODATA' ? '' : value;

export const resourceTypes = {
    MAP: {
        icon: { glyph: '1-map', type: 'glyphicon' },
        getTitle: (resource) => resource?.name || '',
        getThumbnailUrl: (resource) => parseNODATA(resource?.attributes?.thumbnail),
        formatViewerUrl: (resource) => {
            const extras = resource['@extras'];
            if (extras?.context?.name) {
                return `#/context/${extras.context.name}/${resource.pk}`;
            }
            return `#/viewer/${resource.pk}`;
        }
    },
    DASHBOARD: {
        icon: { glyph: 'dashboard', type: 'glyphicon' },
        getTitle: (resource) => resource?.name || '',
        getThumbnailUrl: (resource) => parseNODATA(resource?.attributes?.thumbnail),
        formatViewerUrl: (resource) => {
            return `#/dashboard/${resource.pk}`;
        }
    },
    GEOSTORY: {
        icon: { glyph: 'geostory', type: 'glyphicon' },
        getTitle: (resource) => resource?.name || '',
        getThumbnailUrl: (resource) => parseNODATA(resource?.attributes?.thumbnail),
        formatViewerUrl: (resource) => {
            return `#/geostory/${resource.pk}`;
        }
    },
    CONTEXT: {
        icon: { glyph: 'cogs' },
        getTitle: (resource) => resource?.name || '',
        getThumbnailUrl: (resource) => parseNODATA(resource?.attributes?.thumbnail),
        formatViewerUrl: (resource) => {
            return `#/context/${resource.name}`;
        }
    }
};

export const getResourceTypesInfo = (resource) => (resourceTypes[resource?.category?.name]);

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
