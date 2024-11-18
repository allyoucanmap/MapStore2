
import { searchListByAttributes, getResource } from '../../../observables/geostore';
import { castArray } from 'lodash';
import isString from 'lodash/isString';

const getFilter = ({
    q,
    user,
    query
}) => {
    const f = castArray(query.f || []);
    const ctx = castArray(query['filter{ctx}'] || []);
    // const owner = castArray(query['filter{owner.username.in}'] || []);
    const categories = ['MAP', 'DASHBOARD', 'GEOSTORY', 'CONTEXT'];
    const categoriesFilters = categories.filter(category => f.includes(category.toLocaleLowerCase()));
    return {
        AND: {
            FIELD: [
                ...(q ? [{
                    field: ['NAME'],
                    operator: ['ILIKE'],
                    value: ['%' + q + '%']
                }] : []),
                // not available
                ...(query['filter{date.gte}'] ? [{
                    field: ['CREATION'],
                    operator: ['GREATER_THAN_OR_EQUAL_TO'],
                    value: [query['filter{date.gte}']]
                }] : []),
                ...(query['filter{date.lte}'] ? [{
                    field: ['CREATION'],
                    operator: ['LESS_THAN_OR_EQUAL_TO'],
                    value: [query['filter{date.lte}']]
                }] : [])
            ],
            ATTRIBUTE: [
                ...(f.includes('featured') ? [{
                    name: ['featured'],
                    operator: ['EQUAL_TO'],
                    type: ['STRING'],
                    value: [true]
                }] : [])
            ],
            OR: [
                {
                    CATEGORY: categories
                        .map(name => {
                            return (!categoriesFilters.length || categoriesFilters.includes(name))
                                ? {
                                    operator: ['EQUAL_TO'],
                                    name: [name]
                                }
                                : null;
                        }).filter(value => value)
                },
                {
                    ATTRIBUTE: [
                        ...(ctx.map((value) => {
                            const parts = value.split(':');
                            return {
                                name: ['context'],
                                operator: ['EQUAL_TO'],
                                type: ['STRING'],
                                value: [parts[0]]
                            };
                        }))
                    ]
                },
                {
                    FIELD: [
                        ...(user && f.includes('my-resources') ? [{
                            field: ['creator'],
                            operator: ['EQUAL_TO'],
                            value: [user.name]
                        }] : []),
                        /*
                        ...(owner.map((value) => {
                            return {
                                field: ['creator'],
                                operator: ['EQUAL_TO'],
                                value: [value]
                            };
                        }))
                        */
                    ]
                }
            ]
        }
    };
};

const tags = [
    { color: '#297cdf', value: 'in progress' },
    { color: '#dfaf2e', value: 'in review' },
    { color: '#29df89', value: 'complete' },
    { color: '#fd37a1', value: 'blocked' },
    { color: '#7ee7d6', value: 'done' },
    { color: '#d773d2', value: 'ready' }
];
const organizations = ['Acme', 'Initech',  'Globex Corporation'];

const mockData = (resources) => {
    return resources.map((resource) => {
        return {
            ...resource,
            tags: tags.filter(() => Math.random() > 0.5),
            organization: organizations[Math.floor(Math.random() * 3)]
        };
    });
};

export const requestResources = ({
    page = 1,
    pageSize,
    sort,
    customFilters,
    q,
    ...query
}, { user }) => {
    return searchListByAttributes(getFilter({
        q,
        user,
        query
    }),
    {
        params: {
            includeAttributes: true,
            start: parseFloat(page - 1) * pageSize,
            limit: pageSize
        }
    })
        .toPromise()
        .then((response) => {
            // missing canCopy, canDelete, canEdit
            // missing filter by user
            const resources = (response.results || [])
                .map((resource) => {
                    return {
                        pk: resource.id,
                        ...resource
                    };
                });

            const associatedContextsIds = resources.map(resource => resource?.attributes?.context).filter(contextId => contextId !== undefined);

            return (associatedContextsIds.length
                ? searchListByAttributes({
                    OR: {
                        FIELD: associatedContextsIds.map((contextId) => {
                            return {
                                field: ['ID'],
                                operator: ['EQUAL_TO'],
                                value: [contextId]
                            };
                        })
                    }
                })
                    .toPromise().then((contextsResponse) => contextsResponse.results)
                : Promise.resolve([])
            )
                .then((contexts) => {
                    return {
                        total: response.totalCount,
                        isNextPageAvailable: page < (response?.totalCount / pageSize),
                        resources: mockData(resources.map((resource) => {
                            console.log(resource);
                            const context = contexts.find(ctx => ctx.id === resource?.attributes?.context);
                            if (context) {
                                return {
                                    ...resource,
                                    attributes: {
                                        ...resource?.attributes,
                                        context
                                    }
                                };
                            }
                            return resource;
                        }))
                    };
                });
        });
};

const parseDetailsSettings = (detailsSettings) => {
    if (isString(detailsSettings)) {
        try {
            return JSON.parse(detailsSettings);
        } catch (e) {
            return {};
        }
    }
    return detailsSettings || {};
};

export const requestResource = ({ resource, user, config }) => {
    return getResource(resource.pk, { includeAttributes: true, withData: false, withPermissions: !!user })
        .toPromise()
        .then(({ permissions, attributes, data, ...res }) => {
            const detailsSettings = parseDetailsSettings(resource?.attributes?.detailsSettings);
            return {
                ...resource,
                pk: res.id,
                ...res,
                permissions: permissions || [],
                attributes: {
                    ...attributes,
                    detailsSettings
                }
            };
        });
};

export const facets = [
    {
        id: 'context',
        type: 'select',
        // labelId: 'Context',
        label: 'Context',
        key: 'filter{ctx}',
        getLabelValue: (item) => {
            const parts = item.label.split(':');
            return parts[parts.length - 1];
        },
        getFilterById: ({ value }) => {
            return { label: value, value };
        },
        loadItems: ({ page, pageSize, q }) => {
            return searchListByAttributes(
                {
                    AND: {
                        FIELD: [
                            ...(q ? [{
                                field: ['NAME'],
                                operator: ['ILIKE'],
                                value: ['%' + q + '%']
                            }] : [])
                        ],
                        CATEGORY: {
                            operator: ['EQUAL_TO'],
                            name: ['CONTEXT']
                        }
                    }
                },
                {
                    params: {
                        start: parseFloat(page) * pageSize,
                        limit: pageSize
                    }
                })
                .toPromise()
                .then((response) => {
                    return {
                        items: response.results.map((item) => {
                            // can a name has :
                            const value = `${item.id}:${item.name}`;
                            return {
                                ...item,
                                filterValue: value,
                                label: `${item.name}`
                            };
                        }),
                        isNextPageAvailable: (page + 1) < (response?.totalCount / pageSize)
                    };
                });
        }
    },
    {
        id: 'tag',
        type: 'select',
        // labelId: 'Context',
        label: 'Tags',
        key: 'filter{tag}',
        /*
        getLabelValue: (item) => {
            const parts = item.label.split(':');
            return parts[parts.length - 1];
        },
        getFilterById: ({ value }) => {
            return { label: value, value };
        },
        */
        loadItems: ({ params }) => {
            const q = params?.q || '';
            console.log(q);
            return Promise.resolve({
                items: tags.filter(tag => (tag.value.toLowerCase()).includes(q.toLowerCase())),
                isNextPageAvailable: false
            });
        }
    }
];


export const facetsRequest = ({
    fields
}) => {
    return Promise.resolve({
        fields: fields.map((field) => {
            if (field.facet) {
                const facet = facets.find(f => f.id === field.facet);
                return {
                    ...facet,
                    ...field
                };
            }
            return field;
        })
    });
};
