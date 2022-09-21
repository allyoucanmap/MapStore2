
import { Observable } from 'rxjs';
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
    getSelectedMapView
} from '../selectors/mapviews';

const LAYERS_OWNER = 'MAP_VIEWS';

export const updateMapViewsLayers = (action$, store) =>
    action$.ofType(SELECT_VIEW, UPDATE_VIEWS, ACTIVATE_VIEWS, SETUP_VIEWS)
        .filter((action) => action.type !== ACTIVATE_VIEWS || action.active)
        .switchMap(() => {
            const { layers = [] } = getSelectedMapView(store.getState()) || {};
            return Observable.of(
                removeAdditionalLayer({ owner: LAYERS_OWNER }),
                ...layers.map((layer) => updateAdditionalLayer(
                    layer.id,
                    LAYERS_OWNER,
                    'override',
                    layer
                ))
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
