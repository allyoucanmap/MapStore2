/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';

import API from '../WMTS';
import { getGetTileURL } from '../../utils/WMTSUtils';

describe('Test correctness of the WMTS APIs', () => {
    it('GetRecords KVP', (done) => {
        API.getRecords('base/web/client/test-resources/wmts/GetCapabilities-1.0.0.xml', 0, 3, '').then((result) => {
            try {
                expect(result).toExist();
                expect(result.numberOfRecordsMatched).toBe(3);
                expect(result.records[0].style).toBe("");
                result.records.map(record => {
                    expect(record.requestEncoding).toBe('KVP');
                    expect(record.queryable).toBe(true);
                    expect(record.GetTileURL).toBe("http://sample.server/geoserver/gwc/service/wmts?");
                    expect(getGetTileURL(record)).toBe(record.GetTileURL);
                });

                expect(result.records[0].format).toBe("image/png");
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetRecords RESTful', (done) => {
        API.getRecords('base/web/client/test-resources/wmts/GetCapabilities-rest.xml', 0, 7, '').then((result) => {
            try {
                expect(result).toExist();
                expect(result.numberOfRecordsMatched).toBe(7);
                // all records should be RESTful with same GetTileURL
                result.records.map(record => {
                    expect(record.requestEncoding).toBe('RESTful');
                    expect(record.queryable).toBe(false);
                    expect(getGetTileURL(record)).toEqual(record.ResourceURL.map(({$: v}) => v.template));
                });
                expect(result.records[0].style).toBe("normal");
                expect(result.records[0].format).toBe("image/png");
                expect(result.records[1].style).toBe("normal");
                expect(result.records[1].style).toBe("normal");
                expect(result.records[4].format).toBe("image/jpeg");

                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetRecords KVP for GeoServer 2.15', (done) => {
        // GS 2.15 has ResourceURLs together with KVP. This checks that the proper URL is returned by getTileURL, used to generate the layer. See #3796
        API.getRecords('base/web/client/test-resources/wmts/GetCapabilities-1.0.0_gs_2.15.xml', 0, 3, '').then((result) => {
            try {
                expect(result).toExist();
                expect(result.numberOfRecordsMatched).toBe(3);
                expect(result.records[0].style).toBe("");
                result.records.map(record => {
                    expect(record.requestEncoding).toBe('KVP');
                    expect(record.queryable).toBe(true);
                    expect(record.GetTileURL).toBe("http://sample.server/geoserver/gwc/service/wmts?");
                    expect(getGetTileURL(record)).toBe(record.GetTileURL);
                });
                expect(result.records[0].format).toBe("image/png");
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('wmts', () => {
        const records = API.getCatalogRecords({
            records: [{}]
        }, {});
        expect(records.length).toBe(1);
    });

    it('wmts with tilematrix', () => {
        const records = API.getCatalogRecords({
            records: [{
                "ows:WGS84BoundingBox": {
                    "ows:LowerCorner": "-180.0 -90.0",
                    "ows:UpperCorner": "180.0 90.0"
                },
                TileMatrixSetLink: [{
                    TileMatrixSet: 'EPSG:4326',
                    TileMatrixSetLimits: {
                        TileMatrixSetLimits: [{
                            TileMatrix: 'EPSG:4326:0',
                            MinTileCol: 0,
                            MaxTileCol: 10,
                            MinTileRow: 0,
                            MaxTileRow: 10
                        }]
                    }
                }],
                TileMatrixSet: [{
                    "ows:Identifier": "EPSG:4326",
                    "ows:SupportedCRS": "EPSG:4326"
                }]
            }]
        }, {});
        expect(records.length).toBe(1);

    });

    it('wmts with tilematrix filtered', () => {
        const records = API.getCatalogRecords({
            records: [{
                "ows:WGS84BoundingBox": {
                    "ows:LowerCorner": "-180.0 -90.0",
                    "ows:UpperCorner": "180.0 90.0"
                },
                TileMatrixSetLink: [{
                    TileMatrixSet: 'EPSG:4326',
                    TileMatrixSetLimits: {
                        TileMatrixSetLimits: [{
                            TileMatrix: 'EPSG:4326:0',
                            MinTileCol: 0,
                            MaxTileCol: 10,
                            MinTileRow: 0,
                            MaxTileRow: 10
                        }]
                    }
                }],
                TileMatrixSet: [{
                    "ows:Identifier": "EPSG:4326",
                    "ows:SupportedCRS": "EPSG:4326"
                }],
                SRS: ['EPSG:4326', 'EPSG:3857']
            }]
        }, {});
        expect(records.length).toBe(1);
        expect(records[0].references.length).toBe(1);
        expect(records[0].references[0].SRS.length).toBe(1);
    });

    it('wmts with tilematrix not filtered', () => {
        const records = API.getCatalogRecords({
            records: [{
                "ows:WGS84BoundingBox": {
                    "ows:LowerCorner": "-180.0 -90.0",
                    "ows:UpperCorner": "180.0 90.0"
                },
                TileMatrixSetLink: [{
                    TileMatrixSet: 'EPSG:4326',
                    TileMatrixSetLimits: {
                        TileMatrixSetLimits: [{
                            TileMatrix: 'EPSG:4326:0',
                            MinTileCol: 0,
                            MaxTileCol: 10,
                            MinTileRow: 0,
                            MaxTileRow: 10
                        }]
                    }
                }, {
                    TileMatrixSet: 'EPSG:3857',
                    TileMatrixSetLimits: {
                        TileMatrixSetLimits: [{
                            TileMatrix: 'EPSG:3857:0',
                            MinTileCol: 0,
                            MaxTileCol: 10,
                            MinTileRow: 0,
                            MaxTileRow: 10
                        }]
                    }
                }],
                TileMatrixSet: [{
                    "ows:Identifier": "EPSG:4326",
                    "ows:SupportedCRS": "EPSG:4326"
                }, {
                    "ows:Identifier": "EPSG:3857",
                    "ows:SupportedCRS": "EPSG:3857"
                }],
                SRS: ['EPSG:4326', 'EPSG:3857']
            }]
        }, {});
        expect(records.length).toBe(1);
        expect(records[0].references.length).toBe(1);
        expect(records[0].references[0].SRS.length).toBe(2);
    });
    it('wmts, with url, with options', () => {
        const url = "http://some.url";
        const wmtsRecords = [{}];
        const records = API.getCatalogRecords({ records: wmtsRecords }, {url});
        expect(records.length).toBe(1);
        expect(records[0].references[0].url).toBe(url);
    });

    it('wmts, NO url, with options', () => {
        const wmtsRecords = [{}];
        const records = API.getCatalogRecords({ records: wmtsRecords }, {});
        expect(records.length).toBe(1);
        expect(records[0].references[0].url).toBe(undefined);
    });
    it('wmts, NO url, no options', () => {
        const wmtsRecords = [{}];
        const records = API.getCatalogRecords({ records: wmtsRecords });
        expect(records.length).toBe(1);
        expect(records[0].references[0].url).toBe(undefined);
    });
    it('wmts capabilities url', () => {
        const wmtsRecords = [{ GetTileURL: "tileURL"}];
        const records = API.getCatalogRecords({ records: wmtsRecords });
        expect(records.length).toBe(1);
        expect(records[0].capabilitiesURL).toBe("tileURL");
        const wmtsRecords2 = [{ GetTileURL: "tileURL", capabilitiesURL: "capURL" }];
        const records2 = API.getCatalogRecords({ records: wmtsRecords2 });
        expect(records2.length).toBe(1);
        expect(records2[0].capabilitiesURL).toBe("capURL");
    });
});
