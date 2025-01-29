
import {
    showHelloWorld,
    SHOW_HELLO_WORLD,
    addContentToHelloWorld,
    ADD_CONTENT_TO_HELLO_WORLD
} from '../helloworld';
import expect from 'expect';

describe('helloworld actions', () => {
    it('showHelloWorld', () => {
        const action = showHelloWorld(true);
        expect(action.type).toBe(SHOW_HELLO_WORLD);
        expect(action.enabled).toBe(true);
    });
    it('addContentToHelloWorld', () => {
        const action = addContentToHelloWorld('CONTENT');
        expect(action.type).toBe(ADD_CONTENT_TO_HELLO_WORLD);
        expect(action.content).toBe('CONTENT');
    });
});
