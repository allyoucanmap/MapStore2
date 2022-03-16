/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import * as API from '../WMS';
import MockAdapter from 'axios-mock-adapter';
import axios from '../../libs/ajax';
let mockAxios;

describe('Test correctness of the WMS APIs', () => {
    it('parseUrl uses the first array element', () => {
        expect(API.parseUrl(["http://first", "https://second"]).indexOf("http://first/")).toBe(0);
    });
    it('parseUrl uses the first string of a comma delimited list', () => {
        expect(API.parseUrl(["http://first,https://second"]).indexOf("http://first/")).toBe(0);
    });
    it('describeLayers', (done) => {
        API.describeLayers('base/web/client/test-resources/wms/DescribeLayers.xml', "workspace:vector_layer").then((result) => {
            try {
                expect(result).toExist();
                expect(result.length).toBe(2);
                expect(result[0].owsType).toBe("WFS");
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('describeLayer with OGC-SCHEMAS', (done) => {
        API.describeLayer('base/web/client/test-resources/wms/DescribeLayers.xml', "workspace:vector_layer").then((result) => {
            try {
                expect(result).toExist();
                expect(result.owsType).toBe("WFS");
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetCapabilities 1.3.0', (done) => {
        API.getCapabilities('base/web/client/test-resources/wms/GetCapabilities-1.3.0.xml').then((result) => {
            try {
                expect(result).toExist();
                expect(result.capability).toExist();
                expect(result.version).toBe("1.3.0");
                expect(result.capability.layer).toExist();
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetCapabilities 1.1.1', (done) => {
        API.getCapabilities('base/web/client/test-resources/wms/GetCapabilities-1.1.1.xml').then((result) => {
            try {
                expect(result).toExist();
                expect(result.capability).toExist();
                expect(result.version).toBe("1.1.1");
                expect(result.capability.layer).toExist();
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetCapabilities 1.3.0 RAW', (done) => {
        API.getCapabilities('base/web/client/test-resources/wms/GetCapabilities-1.3.0.xml', true).then((result) => {
            try {
                expect(result).toExist();
                expect(result.WMS_Capabilities).toExist();
                expect(result.WMS_Capabilities.Capability).toExist();
                expect(result.WMS_Capabilities.$.version).toBe("1.3.0");
                expect(result.WMS_Capabilities.Capability.Layer).toExist();
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetCapabilities 1.1.1 RAW', (done) => {
        API.getCapabilities('base/web/client/test-resources/wms/GetCapabilities-1.1.1.xml', true).then((result) => {
            try {
                expect(result).toExist();
                expect(result.WMT_MS_Capabilities).toExist();
                expect(result.WMT_MS_Capabilities.Capability).toExist();
                expect(result.WMT_MS_Capabilities.$.version).toBe("1.1.1");
                expect(result.WMT_MS_Capabilities.Capability.Layer).toExist();
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });

    it('GetBBOX', (done) => {
        API.getCapabilities('base/web/client/test-resources/wms/GetCapabilities-1.1.1.xml').then((result) => {
            try {
                expect(result).toExist();
                expect(result.capability).toExist();
                expect(result.capability.layer).toExist();
                const bbox = API.getBBox(result.capability.layer);
                expect(bbox.extent).toExist();
                expect(bbox.crs).toExist();
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetBBOX Bounds', (done) => {
        API.getCapabilities('base/web/client/test-resources/wms/GetCapabilities-1.1.1.xml').then((result) => {
            try {
                expect(result).toExist();
                expect(result.capability).toExist();
                expect(result.capability.layer).toExist();
                const bbox = API.getBBox(result.capability.layer, true);
                expect(bbox.bounds).toExist();
                expect(bbox.bounds.minx).toExist();
                expect(bbox.crs).toExist();
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetRecords', (done) => {
        API.getRecords('base/web/client/test-resources/wms/GetCapabilities-1.3.0.xml', 0, 2, '').then((result) => {
            try {
                expect(result).toExist();
                expect(result.service).toExist();
                expect(result.records[0].formats.length).toBe(20);
                expect(result.numberOfRecordsMatched).toBe(5);
                expect(result.layerOptions).toExist();
                expect(result.layerOptions.version).toBe('1.3.0');
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetRecords attribution creates the credits object', (done) => {
        // note: maxRecords = 2 because of strange pagination system. Need to restore this when fixed
        API.getRecords('base/web/client/test-resources/wms/attribution.xml', 0, 2, '').then((result) => {
            try {
                expect(result).toExist();
                expect(result.service).toExist();
                expect(result.numberOfRecordsMatched).toBe(2);
                expect(result.records[0]).toExist();
                expect(result.records[0].credits).toExist();
                expect(result.records[0].credits.imageUrl).toBe('logo.png');
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });
    it('GetRecords 1.1.1', (done) => {
        API.getRecords('base/web/client/test-resources/wms/GetCapabilities-1.1.1.xml', 0, 2, '').then((result) => {
            try {
                expect(result).toExist();
                expect(result.service).toExist();
                expect(result.records[0].formats.length).toBe(42);
                expect(result.numberOfRecordsMatched).toBe(7);
                expect(result.layerOptions).toExist();
                expect(result.layerOptions.version).toBe('1.1.1');
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });

    it('GetRecords transform SRS List to uppercase', (done) => {
        API.getRecords('base/web/client/test-resources/wms/GetCapabilities-1.3.0-lowercase-espg.xml', 0, 2, '').then((result) => {
            try {
                expect(result.records[0].SRS).toEqual(['EPSG:3857', 'EPSG:4326', 'CRS:84']);
                done();
            } catch (ex) {
                done(ex);
            }
        });
    });

    it('parseLayerCapabilities nested', () => {
        const capabilities = {
            capability: {
                layer: {
                    layer: {
                        layer: [
                            {
                                name: "mytest"
                            },
                            {
                                name: "mytest2"
                            }
                        ]
                    }
                }
            }
        };

        const capability = API.parseLayerCapabilities(capabilities, {name: 'mytest'});
        expect(capability).toExist();
    });
    it('wms dimensions without values', () => {
        const records = API.getCatalogRecords({
            records: [{
                Dimension: [{
                    $: {
                        name: 'elevation'
                    }
                }]
            }]
        }, {});
        expect(records.length).toBe(1);
        expect(records[0].dimensions.length).toBe(1);
        expect(records[0].dimensions[0].values.length).toBe(0);
    });

    it('wms dimensions with values', () => {
        const records = API.getCatalogRecords({
            records: [{
                Dimension: [{
                    $: {
                        name: 'elevation'
                    },
                    _: '1,2'
                }]
            }]
        }, {});
        expect(records.length).toBe(1);
        expect(records[0].dimensions.length).toBe(1);
        expect(records[0].dimensions[0].values.length).toBe(2);
    });
    // this is needed to avoid to show time values for timeline, until support for time values is fully implemented
    it('wms dimensions time is excluded', () => {
        const records = API.getCatalogRecords({
            records: [{
                Dimension: [{
                    $: {
                        name: 'time'
                    },
                    _: '2008-10-31T00:00:00.000Z,2008-11-04T00:00:00.000Z'
                }]
            }]
        }, {});
        expect(records.length).toBe(1);
        expect(records[0].dimensions.length).toBe(0);
    });

    it('wms limited srs', () => {
        const records = API.getCatalogRecords({
            records: [{
                SRS: ['EPSG:4326', 'EPSG:3857', 'EPSG:5041']
            }]
        }, { url: 'http://sample' });
        expect(records.length).toBe(1);
        const layer = API.recordToLayer(records[0]);
        expect(layer.allowedSRS['EPSG:4326']).toBe(true);
        expect(layer.allowedSRS['EPSG:3857']).toBe(true);
        expect(layer.allowedSRS['EPSG:5041']).toNotExist();
    });
    it('wms multiple urls', () => {
        const records = API.getCatalogRecords({
            records: [{}]
        }, { url: 'http://sample1, http://sample2' });
        expect(records.length).toBe(1);
        const layer = API.recordToLayer(records[0]);
        expect(layer.url.length).toBe(2);
        expect(layer.url[0]).toBe('http://sample1');
        expect(layer.url[1]).toBe('http://sample2');

    });

    it('wms layer options', () => {
        const records = API.getCatalogRecords({
            records: [{}]
        }, {
            url: 'http://sample',
            layerOptions: {
                tileSize: 512
            }
        });
        expect(records.length).toBe(1);
        const layer = API.recordToLayer(records[0]);
        expect(layer.tileSize).toBe(512);
    });

    it('wms layer with visibility limits', () => {
        const records = API.getCatalogRecords({
            records: [{
                MaxScaleDenominator: "78271",
                MinScaleDenominator: "1222"
            }]
        }, {
            url: 'http://sample'
        });
        const resolutions =  [156543, 78271, 39135, 19567, 9783, 4891, 2445, 1222];
        expect(records.length).toBe(1);
        const layer = API.recordToLayer(records[0], {map: {projection: "EPSG:900913", resolutions}});
        expect(Math.ceil(layer.minResolution)).toBe(1);
        expect(Math.ceil(layer.maxResolution)).toBe(21);
    });

    it('wms with no ogcServiceReference.url', () => {
        const records = API.getCatalogRecords(
            {
                records: [{
                    SRS: ['EPSG:4326', 'EPSG:3857', 'EPSG:5041']
                }]
            }, {
                url: undefined
            });
        expect(records.length).toBe(1);
        const sampleUrl = "http://sample";
        const layer = API.recordToLayer(records[0], {catalogURL: sampleUrl});

        expect(layer.url).toBe(sampleUrl);
    });
    it('wms check for reference url', () => {
        const records = API.getCatalogRecords({
            records: [{
                references: [{
                    type: "OGC:WMS",
                    // url: options && options.url,
                    SRS: ['EPSG:4326', 'EPSG:3857'],
                    params: {
                        name: "record.Name"
                    }
                }]
            }]
        }, {});
        expect(records[0].references.length).toBe(1);
        expect(records[0].references[0].url).toBe(undefined);
    });

    it('wms check for reference url, no options', () => {
        const wmsRecords = [{
            references: [{
                type: "OGC:WMS",
                SRS: ['EPSG:4326', 'EPSG:3857'],
                params: {
                    name: "record.Name"
                }
            }]
        }];
        const records = API.getCatalogRecords({records: wmsRecords });
        expect(records[0].references.length).toBe(1);
        expect(records[0].references[0].url).toBe(undefined);
    });

    it('wms check for reference url, options with no url', () => {
        const wmsRecords = [{
            references: [{
                type: "OGC:WMS",
                SRS: ['EPSG:4326', 'EPSG:3857'],
                params: {
                    name: "record.Name"
                }
            }]
        }];
        const records = API.getCatalogRecords({ records: wmsRecords }, {});
        expect(records[0].references.length).toBe(1);
        expect(records[0].references[0].url).toBe(undefined);
    });

    it('wms check for reference url, no options', () => {
        const wmsRecords = [{
            references: [{
                type: "OGC:WMS",
                SRS: ['EPSG:4326', 'EPSG:3857'],
                params: {
                    name: "record.Name"
                }
            }]
        }];
        const url = "http://some.url";
        const records = API.getCatalogRecords({records: wmsRecords }, {url});
        expect(records[0].references.length).toBe(1);
        expect(records[0].references[0].url).toBe(url);
    });
});

describe('Test correctness of the WMS APIs (mock axios)', () => {
    beforeEach(done => {
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach(done => {
        mockAxios.restore();
        setTimeout(done);
    });

    it('describeLayer with query option', (done) => {

        mockAxios.onGet(/\/geoserver/).reply((config) => {
            try {
                expect(!!config.url.match('token=value')).toBe(true);
            } catch (e) {
                done(e);
            }
            done();
            return [ 200, {}];
        });

        const url = 'localhost:8080/geoserver/wms';
        const layers = 'workspace:layer';
        const query = { token: 'value' };
        API.describeLayer(url, layers, { query });
    });
});
