
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
                id: 'undefined__4',
                group: 'background',
                source: 'ol',
                title: 'Empty Background',
                type: 'empty',
                visibility: true,
                singleTile: true,
                dimensions: [],
                hideLoading: false,
                handleClickOnLayer: false,
                useForElevation: false,
                hidden: false
            },
            {
                id: 'geonode:GRAY_HR_SR_OB_DR_tiled__6',
                name: 'geonode:GRAY_HR_SR_OB_DR_tiled',
                description: 'GRAY_HR_SR_OB_DR_tiled',
                title: 'GRAY_HR_SR_OB_DR_tiled',
                type: 'wms',
                url: 'http://dev.geonode.geo-solutions.it/gs/ows',
                bbox: {
                    crs: 'EPSG:4326',
                    bounds: {
                        minx: -180.0,
                        miny: -90.000000000036,
                        maxx: 180.00000000007202,
                        maxy: 90.00000000000001
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
            },
            {
                id: 'geonode:observatories__5',
                name: 'geonode:observatories',
                description: 'observatories',
                title: 'observatories',
                type: 'wms',
                url: 'http://dev.geonode.geo-solutions.it/gs/ows',
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
