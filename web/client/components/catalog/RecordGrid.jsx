const PropTypes = require('prop-types');
/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

const {Grid, Row, Col} = require('react-bootstrap');

const RecordItem = require('./RecordItem');


class RecordGrid extends React.Component {
    static propTypes = {
        recordItem: PropTypes.element,
        catalogURL: PropTypes.string,
        catalogType: PropTypes.string,
        onZoomToExtent: PropTypes.func,
        zoomToLayer: PropTypes.bool,
        onLayerAdd: PropTypes.func,
        onError: PropTypes.func,
        records: PropTypes.array,
        authkeyParamNames: PropTypes.array,
        style: PropTypes.object,
        showGetCapLinks: PropTypes.bool,
        addAuthentication: PropTypes.bool,
        column: PropTypes.object,
        currentLocale: PropTypes.string,
        hideThumbnail: PropTypes.bool,
        hideIdentifier: PropTypes.bool,
        hideExpand: PropTypes.bool
    };

    static defaultProps = {
        column: {xs: 12},
        currentLocale: 'en-US',
        onLayerAdd: () => {},
        onError: () => {},
        records: [],
        zoomToLayer: true
    };

    renderRecordItem = (record, idx) => {
        let Item = this.props.recordItem || RecordItem;
        return (
			<Col {...this.props.column} key={record.identifier}>
                <Item
                    onLayerAdd={this.props.onLayerAdd}
                    onZoomToExtent={this.props.onZoomToExtent}
                    zoomToLayer={this.props.zoomToLayer}
                    hideThumbnail={this.props.hideThumbnail}
                    hideIdentifier={this.props.hideIdentifier}
                    hideExpand={this.props.hideExpand}
                    onError={this.props.onError}
                    catalogURL={this.props.catalogURL}
                    catalogType={this.props.catalogType}
                    record={idx === 0 ? {
                        ...record,
                        title: 'Test Title Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem ape',
                        description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit, amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt, ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit, qui in ea voluptate velit esse, quam nihil molestiae consequatur, vel illum, qui dolorem eum fugiat, quo voluptas nulla pariatur? [33] At vero eos et accusamus et iusto odio dignissimos ducimus, qui blanditiis praesentium voluptatum deleniti atque corrupti, quos dolores et quas molestias excepturi sint, obcaecati cupiditate non provident, similique sunt in culpa, qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio, cumque nihil impedit, quo minus id, quod maxime placeat, facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet, ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.'
                    } : record}
                    authkeyParamNames={this.props.authkeyParamNames}
                    style={{height: "215px", maxHeight: "215px"}}
                    showGetCapLinks={this.props.showGetCapLinks}
                    addAuthentication={this.props.addAuthentication}
                    currentLocale={this.props.currentLocale}/>
			</Col>
        );
    };

    render() {
        if (this.props.records) {
            let mapsList = this.props.records instanceof Array ? this.props.records : [this.props.records];
            return (
                <Grid className="record-grid" fluid style={this.props.style}>
                    <Row>
						{mapsList.map(this.renderRecordItem)}
					</Row>
				</Grid>
            );
        }

        return null;
    }
}

module.exports = RecordGrid;
