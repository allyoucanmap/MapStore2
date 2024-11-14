
export const parseNODATA = (value) => value === 'NODATA' ? '' : value;

export const resourceTypes = {
    MAP: {
        icon: { glyph: '1-map', type: 'glyphicon' },
        getTitle: (resource) => resource?.name || '',
        getThumbnailUrl: (resource) => parseNODATA(resource?.attributes?.thumbnail),
        formatViewerUrl: (resource) => {
            if (resource?.attributes?.context?.name) {
                return `#/context/${resource.attributes.context.name}/${resource.pk}`;
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
        icon: { glyph: 'cog', type: 'glyphicon' },
        getTitle: (resource) => resource?.name || '',
        getThumbnailUrl: (resource) => parseNODATA(resource?.attributes?.thumbnail),
        formatViewerUrl: (resource) => {
            return `#/context/${resource.name}`;
        }
    }
};

export const getResourceTypesInfo = (resource) => (resourceTypes[resource?.category?.name]);

export const getResourceStatus = () => (resource) => {
    return {
        items: [
            ...(resource.advertised === false ? [{
                type: 'icon',
                tooltipId: 'resourcesCatalog.unadvertised',
                variant: 'warning',
                glyph: 'eye-slash'
            }] : [])/* ,
            ...(resource?.attributes?.context?.name ? [{
                type: 'icon',
                glyph: 'cog',
                tooltip: `Context: ${resource.attributes.context.name}`,
                iconType: 'glyphicon'
            }] : []),
            ...(resource?.attributes?.featured === true ? [{
                type: 'icon',
                glyph: 'star',
                iconType: 'glyphicon'
            }] : [])*/
        ]
    };
};
