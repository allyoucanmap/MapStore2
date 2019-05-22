
const mapConfig = ({ center, zoom } = {}) => {

    return {
        map: {
            center: center ? center : {
                x: 8.953857421875089,
                y: 44.36313311380766,
                crs: 'EPSG:4326'
            },
            maxExtent: [
                -20037508.34,
                -20037508.34,
                20037508.34,
                20037508.34
            ],
            projection: 'EPSG:900913',
            units: 'm',
            zoom: zoom ? zoom : 6,
            mapOptions: {}
        },
        layers: [
            {
                "type": "osm",
                "title": "Open Street Map",
                "name": "mapnik",
                "source": "osm",
                "group": "background",
                "visibility": true
            },
            {
                id: 'gs:observatories__1',
                name: 'gs:observatories',
                description: 'observatories',
                title: 'observatories',
                type: 'wms',
                url: 'https://gs-stable.geo-solutions.it/geoserver/wms',
                bbox: {
                    crs: 'EPSG:4326',
                    bounds: {
                        minx: -156.2575,
                        miny: -90.0,
                        maxx: 123.33333333333333,
                        maxy: 46.5475
                    }
                },
                visibility: true,
                singleTile: true,
                allowedSRS: {
                    'EPSG:3785': true,
                    'EPSG:3857': true,
                    'EPSG:4269': true,
                    'EPSG:4326': true,
                    'EPSG:102113': true,
                    'EPSG:900913': true
                },
                dimensions: [],
                hideLoading: false,
                handleClickOnLayer: false,
                catalogURL: null,
                useForElevation: false,
                hidden: false,
                params: {}
            }
        ]
    };
};

export default mapConfig;
