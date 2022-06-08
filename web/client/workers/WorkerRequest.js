import uuid from 'uuid';
import url from 'url';

function WorkerRequest(worker, params) {
    const id = uuid();
    const { protocol, host } = url.parse(window.location.href);
    const baseUrl = `${protocol}//${host}/`;
    return new Promise((resolve, reject) => {
        worker.postMessage(
            JSON.parse(
                JSON.stringify({
                    id,
                    params,
                    location: window.location,
                    localConfig: {
                        proxyUrl: {
                            url: `${baseUrl}proxy/?url=`
                        }
                    }
                })
            )
        );
        worker.addEventListener('message', ({ data }) => {
            if (data.id === id) {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data.payload);
                }
            }
        });
    });
}

export default WorkerRequest;
