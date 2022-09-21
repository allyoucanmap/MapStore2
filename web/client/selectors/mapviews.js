

export const getSelectedMapViewId = state => state?.mapviews?.selectedId;
export const getMapViews = state => state?.mapviews?.views;
export const isMapViewsActive = state => state?.mapviews?.active;
export const getSelectedMapView = state => {
    const selectedId = getSelectedMapViewId(state);
    const views = getMapViews(state) || [];
    const selectedView = views.find(view => view.id === selectedId);
    return selectedView;
};
