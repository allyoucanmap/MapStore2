/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const Rx = require('rxjs');
const {CHANGE_LOCALE} = require('../actions/locale');
const {layersSelector} = require('../selectors/layers');
const {updateNode} = require('../actions/layers');
const LayersUtils = require('../utils/LayersUtils');
const {currentLocaleSelector} = require('../selectors/locale');
const {head} = require('lodash');

const addLayersStyleLocalization = (action$, store) =>
    action$.ofType(CHANGE_LOCALE)
        .switchMap(() => {
            const layers = layersSelector(store.getState());
            const currentLocale = head(currentLocaleSelector(store.getState()).split('-'));
            return layers && layers.length > 0 ?
            Rx.Observable.from(layers)
                .filter((layer) => layer.availableStyles && layer.group !== 'background')
                .map((layer) => {
                    const style = LayersUtils.getLocalizedStyle(layer.style, layer.availableStyles, currentLocale || 'en');
                    return Rx.Observable.of(updateNode(layer.id, "id", {style}));
                })
                .mergeAll()
            : Rx.Observable.empty();
        });

module.exports = {
    addLayersStyleLocalization
};
