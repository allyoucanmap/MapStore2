const {get} = require('lodash');

module.exports = {
    queryPanelSelector: (state) => get(state, "controls.queryPanel.enabled"),
    wfsDownloadAvailable: state => !!get(state, "controls.wfsdownload.available"),
    cssStatusSelector: state => {
        const drawer = get(state, "controls.drawer.enabled") && ' ms2-drawer-open' || '';
        const annotation = get(state, "controls.annotations.enabled") && ' ms2-annotation-open' || '';
        const metadataexplorer = get(state, "controls.metadataexplorer.enabled") && ' ms2-metadataexplorer-open' || '';
        const featuregrid = get(state, "featuregrid.open") && ' ms2-featuregrid-open' || '';
        const queryPanel = get(state, "controls.queryPanel.open") && ' ms2-queryPanel-open' || '';

        const rightPanel = metadataexplorer || annotation ? ' ms2-right-panel-open' : '';

        return drawer + annotation + metadataexplorer + featuregrid + queryPanel + rightPanel;
    }
};
