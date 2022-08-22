

import React, { Suspense } from 'react';

const withSuspense = (activeFunc) => (Component) => (props) => {
    return activeFunc === undefined || activeFunc(props) ?  (
        <Suspense fallback={null}>
            <Component {...props}/>
        </Suspense>
    ) : null;
};

export default withSuspense;
