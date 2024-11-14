
import { useEffect, useState, useRef } from 'react';
import axios from '../../../libs/ajax';

const useRequestResource = ({
    user,
    request,
    resource,
    setResource
}) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const requestResource = useRef();
    const requestTimeout = useRef();
    const source = useRef();

    const createToken = () => {
        if (source.current) {
            source.current?.cancel();
            source.current = undefined;
        }
        const cancelToken = axios.CancelToken;
        source.current = cancelToken.source();
    };

    requestResource.current = () => {
        if (requestTimeout.current) {
            clearTimeout(requestTimeout.current);
            requestTimeout.current = undefined;
        }
        createToken();
        setLoading(true);
        requestTimeout.current = setTimeout(() => {
            request({
                user,
                resource,
                config: {
                    cancelToken: source.current.token
                }
            })
                .then((updatedResource) => {
                    setResource(updatedResource);
                })
                .catch((e) => {
                    if (!axios.isCancel(e)) {
                        setError(e);
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        }, 300);
    };

    useEffect(() => {
        if (resource?.pk) {
            requestResource.current();
        }
    }, [resource?.pk]);

    return {
        resource,
        error,
        loading
    };
};

export default useRequestResource;

