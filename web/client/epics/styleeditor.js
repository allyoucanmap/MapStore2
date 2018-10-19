/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Rx = require('rxjs');
const { head, isArray, template } = require('lodash');
const { success } = require('../actions/notifications');
const { UPDATE_NODE, updateNode } = require('../actions/layers');
const { updateAdditionalLayer, removeAdditionalLayer, updateOptionsByOwner } = require('../actions/additionallayers');
const { getDescribeLayer, getLayerCapabilities } = require('../actions/layerCapabilities');

const {
    SELECT_STYLE_TEMPLATE,
    updateTemporaryStyle,
    TOGGLE_STYLE_EDITOR,
    resetStyleEditor,
    UPDATE_STATUS,
    loadingStyle,
    LOADED_STYLE,
    loadedStyle,
    CREATE_STYLE,
    updateStatus,
    selectStyleTemplate,
    errorStyle,
    selectStyle,
    UPDATE_STYLE_CODE,
    EDIT_STYLE_CODE,
    DELETE_STYLE
} = require('../actions/styleeditor');

const StylesAPI = require('../api/geoserver/Styles');
const LayersAPI = require('../api/geoserver/Layers');

const {
    temporaryIdSelector,
    codeStyleSelector,
    formatStyleSelector,
    statusStyleSelector,
    selectedStyleSelector,
    enabledStyleEditorSelector,
    loadingStyleSelector
} = require('../selectors/styleeditor');

const { additionalLayersByOwnerSelector } = require('../selectors/additionallayers');
const { getSelectedLayer } = require('../selectors/layers');
const { extractLayerSettings, generateTemporaryStyleId, generateStyleId, STYLE_OWNER_NAME } = require('../utils/StyleEditorUtils');

const getStyleCodeObservable = (status, styleName) =>
    status === 'edit' ?
        Rx.Observable.defer(() =>
            StylesAPI.getStyleCodeByName({
                baseUrl: '/geoserver/',
                styleName
            })
        )
        .switchMap(style => Rx.Observable.of(
            selectStyleTemplate({
                code: style.code,
                templateId: '',
                format: style.format,
                init: true
            })
        ))
        .catch(err => Rx.Observable.of(errorStyle('edit', err)))
        : Rx.Observable.empty();


const deleteStyleObservable = ({format, styleName} /*, silent*/) =>
    Rx.Observable.defer(() =>
        StylesAPI.deleteStyle({
            baseUrl: '/geoserver/',
            format,
            styleName
        })
    )
    .switchMap(() => Rx.Observable.empty())
    .catch(() => Rx.Observable.empty());

const resetStyleEditorObservable = state => {
    const styleName = temporaryIdSelector(state);
    const format = formatStyleSelector(state);
    return Rx.Observable.of(
            resetStyleEditor(),
            removeAdditionalLayer({ owner: STYLE_OWNER_NAME })
        )
        .merge(styleName ? deleteStyleObservable({format, styleName}) : Rx.Observable.empty());
};

const updateAvailableStylesObservable = ({settings, styleName, format, title, _abstract}) =>
    Rx.Observable.defer(() =>
        LayersAPI.updateAvailableStyles({
            baseUrl: '/geoserver/',
            layerName: settings.name,
            styles: [{ name: styleName }]
        })
    )
    .switchMap(() => {
        const newStyle = {
            filename: `${styleName}.${format}`,
            format,
            name: styleName,
            title,
            _abstract
        };
        const defaultStyle = head(settings.availableStyles);
        const availableStyles = settings.availableStyles && [defaultStyle, newStyle, ...settings.availableStyles.filter((sty, idx) => idx > 0)] || [newStyle];
        return Rx.Observable.of(
            updateNode(settings.id, 'layer', { availableStyles }),
            updateAdditionalLayer(settings.id, STYLE_OWNER_NAME, 'override', { ...settings, availableStyles }, {}),
            loadedStyle()
        );
    })
    .catch(() => Rx.Observable.of(loadedStyle()))
    .startWith(loadingStyle('global'));

const createUpdateStyleObservable = ({update, code, format, styleName, status}, successActions = [], errorActions = []) =>
    Rx.Observable.defer(() =>
        StylesAPI[update ? 'updateStyle' : 'createStyle']({
            baseUrl: '/geoserver/',
            style: code,
            format,
            styleName
        })
    )
    .switchMap(() => isArray(successActions) && Rx.Observable.of(loadedStyle(), ...successActions) || successActions)
    .catch((err) => Rx.Observable.of(errorStyle(status, err), loadedStyle(), ...errorActions))
    .startWith(loadingStyle(status));

const updateLayerSettingsObservable = (action$, store, filter = () => true, startActions = [], endObservable = () => {}) =>
    Rx.Observable.of(loadingStyle('global'), ...startActions)
    .merge(
        action$.ofType(UPDATE_NODE)
            .filter(() => {
                const layer = getSelectedLayer(store.getState());
                return filter(layer);
            })
            .switchMap(() => {
                const layer = getSelectedLayer(store.getState());
                const settings = extractLayerSettings(layer);
                return endObservable(layer, settings);
            })
            .takeUntil(action$.ofType(LOADED_STYLE))
    );

module.exports = {

    toggleStyleEditorEpic: (action$, store) =>
        action$.ofType(TOGGLE_STYLE_EDITOR)
            .filter(() => !loadingStyleSelector(store.getState()))
            .switchMap((action) => {

                const state = store.getState();

                if (!action.enabled) return resetStyleEditorObservable(state);
                if (enabledStyleEditorSelector(state)) return Rx.Observable.empty();

                const layer = action.layer || getSelectedLayer(state);
                if (!layer || layer && !layer.url) return Rx.Observable.empty();

                return updateLayerSettingsObservable(action$, store,
                    updatedLayer => updatedLayer && updatedLayer.capabilities,
                    [ getLayerCapabilities(layer) ],
                    (updatedLayer, updatedSettings) => {
                        return Rx.Observable.defer(() =>
                            StylesAPI.getStylesInfo({
                                baseUrl: '/geoserver/',
                                styles: updatedSettings && updatedSettings.availableStyles || []
                            })
                        )
                        .switchMap(availableStyles => {
                            return Rx.Observable.of(
                                selectStyle(updatedLayer.style || availableStyles && availableStyles[0] && availableStyles[0].name),
                                updateAdditionalLayer(updatedLayer.id, STYLE_OWNER_NAME, 'override', { ...updatedSettings, availableStyles }, {}),
                                loadedStyle()
                            );
                        });
                    }
                );
            }),

    updateLayerOnStatusChangeEpic: (action$, store) =>
        action$.ofType(UPDATE_STATUS)
            .filter(({ status }) => !!status)
            .switchMap((action) => {

                const state = store.getState();

                const layerItem = head(additionalLayersByOwnerSelector(STYLE_OWNER_NAME, state));
                const settings = layerItem && layerItem.settings;

                const descAction = settings && !settings.properties && getDescribeLayer(settings.url, settings);
                const selectedStyle = selectedStyleSelector(state);
                const styleName = selectedStyle || settings.availableStyles && settings.availableStyles[0] && settings.availableStyles[0].name;

                return descAction && updateLayerSettingsObservable(action$, store,
                        updatedLayer => updatedLayer && updatedLayer.describeLayer,
                        [ descAction ],
                        (updatedLayer, updatedSettings) => {
                            return Rx.Observable.concat(
                                getStyleCodeObservable(action.status, styleName),
                                Rx.Observable.of(
                                    updateAdditionalLayer(updatedLayer.id, STYLE_OWNER_NAME, 'override', {...updatedSettings, availableStyles: settings.availableStyles}, {}),
                                    loadedStyle()
                                )
                            );
                        }
                    ) || getStyleCodeObservable(action.status, styleName);
            }),

    updateTemporaryStyleEpic: (action$, store) =>
        action$.ofType(SELECT_STYLE_TEMPLATE, EDIT_STYLE_CODE)
            .switchMap(action => {

                const state = store.getState();
                const temporaryId = temporaryIdSelector(state);
                const styleName = temporaryId || generateTemporaryStyleId();
                const format = action.format || formatStyleSelector(state);
                const status = statusStyleSelector(state);

                const updateTmpCode = createUpdateStyleObservable(
                    {
                        update: true,
                        code: action.code,
                        format,
                        styleName,
                        status
                    },
                    [
                        updateOptionsByOwner(STYLE_OWNER_NAME, [{ style: styleName, _v_: Date.now(), singleTile: true }]),
                        updateTemporaryStyle({
                            temporaryId: styleName,
                            templateId: action.templateId || '',
                            code: action.code,
                            format,
                            init: action.init
                        })
                    ]
                );

                return temporaryId && updateTmpCode ||
                    createUpdateStyleObservable({
                        code: '* { stroke: #888888; }',
                        format: 'css',
                        styleName,
                        status
                    },
                    updateTmpCode
                );
            }),

    createStyleEpic: (action$, store) =>
        action$.ofType(CREATE_STYLE)
            .switchMap(action => {

                const state = store.getState();
                const code = codeStyleSelector(state);
                const styleName = generateStyleId(action.settings);
                const layerItem = head(additionalLayersByOwnerSelector(STYLE_OWNER_NAME, state));
                const settings = layerItem && layerItem.settings;
                const format = formatStyleSelector(state);
                const { title = '', _abstract = '' } = action.settings || {};

                return createUpdateStyleObservable(
                        {
                            code: template(code)({styleTitle: title, styleAbstract: _abstract}),
                            format,
                            styleName,
                            status
                        },
                        Rx.Observable.of(
                            updateOptionsByOwner(STYLE_OWNER_NAME, [{}]),
                            selectStyle(styleName),
                            updateNode(settings.id, 'layer', { style: styleName }),
                            updateStatus(''),
                            loadedStyle()
                        ).merge(updateAvailableStylesObservable({settings, styleName, format, title, _abstract}))
                    );
            }),

    updateStyleCodeEpic: (action$, store) =>
        action$.ofType(UPDATE_STYLE_CODE)
            .switchMap(() => {

                const state = store.getState();

                const format = formatStyleSelector(state);
                const code = codeStyleSelector(state);
                const styleName = selectedStyleSelector(state);
                const temporaryId = temporaryIdSelector(state);
                const layerItem = head(additionalLayersByOwnerSelector(STYLE_OWNER_NAME, state));
                const settings = layerItem && layerItem.settings;

                return createUpdateStyleObservable(
                    {
                        update: true,
                        code,
                        format,
                        styleName,
                        status: 'global'
                    },
                    [
                        updateNode(settings.id, 'layer', { _v_: Date.now() }),
                        updateTemporaryStyle({
                            temporaryId: temporaryId,
                            templateId: '',
                            code,
                            format,
                            init: true
                        }),
                        success({
                            title: "styleeditor.savedStyleTitle",
                            message: "styleeditor.savedStyleMessage",
                            uid: "savedStyleTitle",
                            autoDismiss: 5
                        })
                    ]
                );
            }),

    deleteStyleEpic: (action$, store) =>
        action$.ofType(DELETE_STYLE)
            .filter(({styleName}) => !!styleName)
            .switchMap(({styleName}) => {

                const layerItem = head(additionalLayersByOwnerSelector(STYLE_OWNER_NAME, store.getState()));
                const settings = layerItem && layerItem.settings;

                return Rx.Observable.defer(() =>
                    LayersAPI.removeStyles({
                        baseUrl: '/geoserver/',
                        layerName: settings.name,
                        styles: [{ name: styleName }]
                    })
                )
                .switchMap(() => {
                    const availableStyles = settings.availableStyles && settings.availableStyles.filter(({name}) => name !== styleName) || [];
                    return Rx.Observable.concat(
                        Rx.Observable.of(
                            updateNode(settings.id, 'layer', { style: availableStyles[0].name, availableStyles }),
                            selectStyle(availableStyles[0] && availableStyles[0].name),
                            updateAdditionalLayer(settings.id, STYLE_OWNER_NAME, 'override', {...settings, availableStyles}, {}),
                            loadedStyle()
                        ),
                        deleteStyleObservable({styleName})
                    );
                })
                .catch(() => Rx.Observable.of(loadedStyle()))
                .startWith(() => Rx.Observable.of(loadingStyle('global')));
            })
};

