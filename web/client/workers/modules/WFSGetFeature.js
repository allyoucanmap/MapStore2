

import { getFeature } from '../../api/WFS';
import { setConfigProp } from '../../utils/ConfigUtils';

self.onmessage = ({ data: { id, location, localConfig, params: workerParams } }) => {

    self.window = { location };

    Object.keys(localConfig).forEach(key => {
        setConfigProp(key, localConfig[key]);
    });

    const { url, typeName, params, config } = workerParams || {};
    getFeature(url, typeName, params, config)
        .then((response) => {
            self.postMessage({
                id,
                payload: {
                    data: response.data
                }
            });
        })
        .catch(() => {
            self.postMessage({
                id,
                error: true
            });
        });
};
