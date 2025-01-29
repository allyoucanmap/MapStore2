import {
    SHOW_HELLO_WORLD,
    ADD_CONTENT_TO_HELLO_WORLD
} from "../actions/helloworld";

const defaultState = {
    enabled: false
};
function helloworld(state = defaultState, action) {
    switch (action.type) {
    case SHOW_HELLO_WORLD: {
        return {
            ...state,
            enabled: action.enabled
        };
    }
    case ADD_CONTENT_TO_HELLO_WORLD: {
        return {
            ...state,
            content: action.content
        };
    }
    default:
        return state;
    }
}

export default helloworld;
