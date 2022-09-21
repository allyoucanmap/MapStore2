
import { useEffect } from 'react';
import { normalizeName } from '../utils/PluginsUtils';
import { getStore } from '../utils/StateUtils';

const useStoreManager = (name, {
    reducers,
    epics,
    removeReducers,
    muteEpics
}, dependencies = []) => {
    useEffect(() => {
        const key = normalizeName(name);
        const store = getStore();
        if (reducers) {
            Object.keys(reducers).forEach((reducerKey) => store.storeManager.addReducer(reducerKey, reducers[reducerKey]));
        }
        if (epics) {
            store.storeManager.addEpics(key, epics);
            store.storeManager.unmuteEpics(key);
        }
        return () => {
            if (reducers && removeReducers) {
                Object.keys(reducers).forEach((reducerKey) => store.storeManager.removeReducer(reducerKey));
            }
            if (epics && muteEpics) {
                store.storeManager.muteEpics(key);
            }
        };
    }, dependencies);
};

export default useStoreManager;
