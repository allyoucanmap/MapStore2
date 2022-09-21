
import { Observable } from 'rxjs';
import isString from 'lodash/isString';
import {
    SELECT_VIEW,
    UPDATE_VIEWS,
    ACTIVATE_VIEWS,
    SETUP_VIEWS
} from '../actions/mapviews';
import {
    removeAdditionalLayer,
    updateAdditionalLayer
} from '../actions/additionallayers';
import {
    getSelectedMapView,
    getResourceById
} from '../selectors/mapviews';

const LAYERS_OWNER = 'MAP_VIEWS';

export const updateMapViewsLayers = (action$, store) =>
    action$.ofType(
        SELECT_VIEW,
        UPDATE_VIEWS,
        ACTIVATE_VIEWS,
        SETUP_VIEWS
    )
        .filter((action) => action.type !== ACTIVATE_VIEWS || action.active)
        .switchMap(() => {
            const state = store.getState();
            const { layers = [], mask = {}, id: viewId } = getSelectedMapView(state) || {};
            const maskLayerResource = isString(mask.layer) ? getResourceById(state, mask.layer) : mask.layer;
            return Observable.of(
                removeAdditionalLayer({ owner: LAYERS_OWNER }),
                ...layers
                    .map((layer) => {
                        const clipPolygonLayerResource = isString(layer.clippingLayerSource)
                            ? getResourceById(state, layer.clippingLayerSource)
                            : layer.clippingLayerSource;
                        const clippingPolygon = isString(layer.clippingPolygon)
                            ? clipPolygonLayerResource?.data?.collection?.features?.find(feature => feature.id === layer.clippingPolygon)
                            : layer.clippingPolygon;
                        return updateAdditionalLayer(
                            layer.id,
                            LAYERS_OWNER,
                            'override',
                            {
                                ...layer,
                                clippingPolygon
                            }
                        );
                    }),
                ...(maskLayerResource?.data?.collection?.features
                    ? [updateAdditionalLayer(
                        `${viewId}-mask`,
                        LAYERS_OWNER,
                        'overlay',
                        {
                            id: `${viewId}-mask`,
                            type: 'vector',
                            features: maskLayerResource.data.collection.features,
                            visibility: true
                        }
                    )]
                    : [])
            );
        });

export const removeMapViewsLayersWhenDeactivated = (action$) =>
    action$.ofType(ACTIVATE_VIEWS)
        .filter((action) => !action.active)
        .switchMap(() => {
            return Observable.of(
                removeAdditionalLayer({ owner: LAYERS_OWNER })
            );
        });

export default {
    updateMapViewsLayers,
    removeMapViewsLayersWhenDeactivated
};
