
import { Observable } from 'rxjs';
import { SHOW_HELLO_WORLD, addContentToHelloWorld } from '../actions/helloworld';
import axios from '../../../libs/ajax';

export const initializeHelloWorldOnSelectLayer = (action$) => {
    return action$.ofType(SHOW_HELLO_WORLD)
        .filter(action => action.enabled)
        .switchMap(() => {
            return Observable.defer(() => axios.get('/test'))
                .switchMap(() => {
                    return Observable.of(addContentToHelloWorld('SUCCESS'));
                })
                .catch(() => {
                    return Observable.of(addContentToHelloWorld('ERROR'));
                });
        });
};

export default {
    initializeHelloWorldOnSelectLayer
};
