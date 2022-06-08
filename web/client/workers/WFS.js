
import WorkerRequest from './WorkerRequest';

const getFeatureWorker = new Worker(new URL('./modules/WFSGetFeature', import.meta.url));

export const getFeature = (url, typeName, params, config) => {
    return new WorkerRequest(getFeatureWorker, { url, typeName, params, config});
};
