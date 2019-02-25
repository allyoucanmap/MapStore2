
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
let mockCntDontCopy = 0;
module.exports = props => [
    {
        glyph: 'arrow-left',
        tooltipId: 'wizard.prev',
        visible: !props.viewerOptions.header && props.validResponses.length > 1 && props.index > 0,
        onClick: () => {
            props.onPrevious();
        }
    },
    {
        glyph: 'info-sign',
        tooltipId: 'identifyRevGeocodeSubmitText',
        visible: props.latlng && props.enableRevGeocode && props.lngCorrected,
        onClick: () => {
            props.showRevGeocode({lat: props.latlng.lat, lng: props.lngCorrected});
        }
    },
    {
        glyph: 'map-filter',
        bsStyle: props.showHighlighted ? 'success' : 'primary',
        tooltip: props.showHighlighted ? 'Hide highlighted features' : 'Show highlighted features',
        visible: true,
        onClick: () => {
            props.onShowHighlighted(mockCntDontCopy === 0 ? 'modal' : !props.showHighlighted);
            mockCntDontCopy++;
        }
    },
    {
        glyph: 'zoom-to',
        tooltip: 'Zoom to all features',
        visible: true
    },
    {
        glyph: 'arrow-right',
        tooltipId: 'wizard.next',
        visible: !props.viewerOptions.header && props.validResponses.length > 1 && props.index < props.validResponses.length - 1,
        onClick: () => {
            props.onNext();
        }
    }
].filter(btn => btn && btn.visible);
