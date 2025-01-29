
export const SHOW_HELLO_WORLD = 'HELLO_WORLD:SHOW_HELLO_WORLD';
export const ADD_CONTENT_TO_HELLO_WORLD = 'HELLO_WORLD:ADD_CONTENT_TO_HELLO_WORLD';

export function showHelloWorld(enabled) {
    return {
        type: SHOW_HELLO_WORLD,
        enabled
    };
}

export function addContentToHelloWorld(content) {
    return {
        type: ADD_CONTENT_TO_HELLO_WORLD,
        content
    };
}
