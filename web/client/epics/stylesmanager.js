/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Rx from 'rxjs';
import { head } from 'lodash';
import { MAP_CONFIG_LOADED } from '../actions/config';
import { push } from 'react-router-redux';
import uuidv1 from 'uuid/v1';
import { addLayer } from '../actions/layers';

const getStyleType = (type) => {
    return type.indexOf('mapbox') !== -1
        ? 'mbs'
        : type.indexOf('sld') !== -1
            ? 'sld'
            : type.indexOf('geocss') !== -1
                ? 'geocss'
                : '';
};

export const ogcInitMapConfiguration = (action$) =>
    action$.ofType('OGC:INIT_MAP')
        .switchMap((action) => {
            return Rx.Observable.concat(
                Rx.Observable.of(push('/editor')),
                action$.ofType(MAP_CONFIG_LOADED)
                    .take(1)
                    .switchMap(() => {
                        const { layers = [], styles = [] } = action.config || {};

                        const splittedStyles = styles
                            .map((style) => {
                                const type = getStyleType(style && style.link && style.link.type);
                                if (type === 'sld') {

                                    const splitB = style.styleBody
                                        .split(/\<\w+:NamedLayer\>|\<\/\w+:NamedLayer\>|\<\/NamedLayer\>|\<\/NamedLayer\>/);

                                    const namedLayerWrapper = (body) => {
                                        const prefix = style.styleBody.match(/\<(.*):NamedLayer\>/);
                                        if (prefix && prefix[1]) {
                                            return `<${prefix[1]}:NamedLayer>${body}</${prefix[1]}:NamedLayer>`;
                                        }
                                        return `<NamedLayer>${body}</NamedLayer>`;
                                    };

                                    const splitStyleBody = splitB
                                        .filter((namedLayer) => namedLayer.indexOf('Name') !== -1 && namedLayer.indexOf('StyledLayerDescriptor') === -1);

                                    const sldWrapper = splitB
                                        .filter((val, idx) => idx === 0 || idx === splitB.length - 1);

                                    const styleObj = splitStyleBody.reduce((acc, splitStyle) => {
                                        const idx = head(splitStyle.replace(/\s/g, '')
                                            .split(/\<\w+:Name\>|\<\/\w+:Name\>|\<\/Name\>|\<\/Name\>/)
                                            .filter((val => val)));
                                        const [ start, end ] = sldWrapper;
                                        return {
                                            ...acc,
                                            [idx]: start + namedLayerWrapper(splitStyle) + end
                                        };
                                    }, {});

                                    return {
                                        ...style,
                                        styleObj
                                    };
                                }
                                return {
                                    ...style
                                };
                            });
                        return Rx.Observable.of(
                            ...layers
                                .map((layer) => {
                                    const availableStyles = splittedStyles
                                        .map(({ styleObj, ...style }) => {

                                            return {
                                                ...style,
                                                styleBody: styleObj && styleObj[layer.name]
                                            };
                                        });
                                    return addLayer({
                                        ...layer,
                                        id: uuidv1(),
                                        availableStyles
                                    });
                                })
                        );
                    })
                );
        });
