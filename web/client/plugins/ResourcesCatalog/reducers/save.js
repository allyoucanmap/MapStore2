import { LOCATION_CHANGE } from "connected-react-router";
import { SET_PENDING_CHANGES } from "../actions/save";

const defaultState = {
    pendingChanges: null
};

function save(state = defaultState, action) {
    switch (action.type) {
    // case LOCATION_CHANGE:
    //     return action.payload.action !== 'PUSH' ? state : {
    //         ...state,
    //         pendingChanges: null
    //     };
    case SET_PENDING_CHANGES:
        return {
            ...state,
            pendingChanges: action.pendingChanges
        };
    default:
        return state;
    }
}

export default save;
