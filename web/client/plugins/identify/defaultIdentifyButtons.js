
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
        glyph: 'arrow-right',
        tooltipId: 'wizard.next',
        visible: !props.viewerOptions.header && props.validResponses.length > 1 && props.index < props.validResponses.length - 1,
        onClick: () => {
            props.onNext();
        }
    }
];
