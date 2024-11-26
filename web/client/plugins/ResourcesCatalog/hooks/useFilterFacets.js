import { useEffect, useRef, useState } from 'react';

const fieldsContainFacets = (fields) => {
    return fields.some(field => field.items ? fieldsContainFacets(field.items) : !!field.facet);
};

const useFilterFacets = ({
    query,
    fields,
    request,
    customFilters = []
}) => {

    const [updated, setUpdated] = useState(fields);
    const requestFacets = useRef();
    const containsFacets = fieldsContainFacets(fields);

    requestFacets.current = () => {
        if (containsFacets) {
            request({
                query,
                fields,
                customFilters
            })
                .then((response) => {
                    setUpdated(response?.fields || []);
                });
        }
    };

    useEffect(() => {
        requestFacets.current();
    }, [containsFacets]);

    return {
        fields: containsFacets ? updated : fields
    };
};

export default useFilterFacets;
