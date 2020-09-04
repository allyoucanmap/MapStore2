

import React from 'react';
import MapComponent from '../sdk/library/components/Map';

export default {
    title: 'library/components/Map',
    component: MapComponent,
    argTypes: {
        mapType: {
            control: {
                type: 'select',
                options: [
                    'openlayers',
                    'leaflet'
                ]
            }
        },
        layers: {
            control: 'object'
        },
        map: {
            control: 'object'
        },
        styleMap: {
            control: 'object'
        }
    }
};

const Template = (args) => (<MapComponent {...args} />);

export const WithWMSLayer = Template.bind({});
WithWMSLayer.args = {
    mapType: 'openlayers',
    layers: [
        {
            id: 'layer-1',
            format: 'image/jpeg',
            group: 'background',
            name: 's2cloudless:s2cloudless',
            opacity: 1,
            title: 'Sentinel 2 Cloudless',
            thumbURL: '',
            type: 'wms',
            url: [
                'https://maps1.geosolutionsgroup.com/geoserver/wms',
                'https://maps2.geosolutionsgroup.com/geoserver/wms',
                'https://maps3.geosolutionsgroup.com/geoserver/wms',
                'https://maps4.geosolutionsgroup.com/geoserver/wms',
                'https://maps5.geosolutionsgroup.com/geoserver/wms',
                'https://maps6.geosolutionsgroup.com/geoserver/wms'
            ],
            source: 's2cloudless',
            visibility: true,
            singleTile: false,
            credits: {
                title: '<a class=\"a-light\" xmlns:dct=\"http://purl.org/dc/terms/\" href=\"https://s2maps.eu\" property=\"dct:title\">Sentinel-2 cloudless 2016</a> by <a class=\"a-light\" xmlns:cc=\"http://creativecommons.org/ns#\" href=\"https://eox.at\" property=\"cc:attributionName\" rel=\"cc:attributionURL\">EOX IT Services GmbH</a>'
            }
        }
    ],
    map: {
        zoom: 3,
        center: { x: 13, y: 45, crs: 'EPSG:4326' }
    },
    styleMap: {
        width: '100%',
        height: 300
    }
};
