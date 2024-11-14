import React from 'react';
import PropTypes from 'prop-types';
import ALink from './ALink';
import Icon from './Icon';

function AuthorInfo({
    resource,
    readOnly,
    registry
}) {

    const {
        formatHref,
        getAuthor
    } = registry;

    const author = getAuthor(resource);

    return (<>
        {author?.avatar
            ? (
                <img
                    src={author.avatar}
                    alt={author.username}
                    className="ms-card-author-image"
                />
            )
            : <Icon type="glyphicon" glyph="user" className="ms-card-author-image" />}
        <ALink
            readOnly={!author.query || readOnly}
            href={formatHref({
                replaceQuery: true,
                query: author.query
            })}>
            {author.username}
        </ALink>
    </>);
}

AuthorInfo.propTypes = {
    resource: PropTypes.object,
    readOnly: PropTypes.bool,
    formatHref: PropTypes.func,
    props: PropTypes.any
};

AuthorInfo.defaultProps = {
    resource: {},
    readOnly: false,
    formatHref: () => '#'
};

export default AuthorInfo;
