const PropTypes = require('prop-types');
/**
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
const React = require('react');

const Message = require('../I18N/Message');
const LocaleUtils = require('../../utils/LocaleUtils');

const {FormControl, FormGroup, Alert, Pagination, Button, Panel} = require('react-bootstrap');
const Spinner = require('react-spinkit');

const RecordGrid = require('./RecordGrid');

class Catalog extends React.Component {
    static propTypes = {
        active: PropTypes.bool,
        formats: PropTypes.array,
        format: PropTypes.string,
        searchOnStartup: PropTypes.bool,
        onSearch: PropTypes.func,
        onReset: PropTypes.func,
        onChangeFormat: PropTypes.func,
        onLayerAdd: PropTypes.func,
        onZoomToExtent: PropTypes.func,
        zoomToLayer: PropTypes.bool,
        onError: PropTypes.func,
        pageSize: PropTypes.number,
        displayURL: PropTypes.bool,
        initialCatalogURL: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        result: PropTypes.object,
        loadingError: PropTypes.object,
        layerError: PropTypes.string,
        searchOptions: PropTypes.object,
        chooseCatalogUrl: PropTypes.bool,
        showGetCapLinks: PropTypes.bool,
        addAuthentication: PropTypes.bool,
        records: PropTypes.array,
        gridOptions: PropTypes.object,
        includeSearchButton: PropTypes.bool,
        includeResetButton: PropTypes.bool,
        wrapOptions: PropTypes.bool,
        buttonStyle: PropTypes.object,
        buttonClassName: PropTypes.string,
        currentLocale: PropTypes.string
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        pageSize: 6,
        onSearch: () => {},
        onReset: () => {},
        onChangeFormat: () => {},
        onLayerAdd: () => {},
        onZoomToExtent: () => {},
        zoomToLayer: true,
        onError: () => {},
        chooseCatalogUrl: true,
        records: [],
        formats: [{name: 'csw', label: 'CSW'}],
        format: 'csw',
        includeSearchButton: true,
        includeResetButton: false,
        wrapOptions: false,
        buttonStyle: {
            marginBottom: "10px"
        },
        buttonClassName: "search-button",
        currentLocale: 'en-US'
    };

    state = {
        loading: false,
        catalogURL: null
    };

    componentDidMount() {
        if (this.props.searchOnStartup) {
            this.props.onSearch(this.props.format, this.getCatalogUrl(), 1, this.props.pageSize, "");
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            this.setState({
                loading: false
            });
        }
    }

    onSearchTextChange = (event) => {
        this.setState({searchText: event.target.value});
    };

    onKeyDown = (event) => {
        if (event.keyCode === 13) {
            this.search();
        }
    };

    getCatalogUrl = () => {
        return this.state.catalogURL || this.props.searchOptions && this.props.searchOptions.url ||
         (this.props.initialCatalogURL && this.props.initialCatalogURL[this.props.format] || this.props.initialCatalogURL);
    };

    renderResult = () => {
        if (this.props.result) {
            if (this.props.result.numberOfRecordsMatched === 0) {
                return (<div>
                    <Message msgId="catalog.noRecordsMatched" />
                </div>);
            }
            return this.renderRecords();
        } else if (this.props.loadingError) {
            return this.renderError();
        }
    };

    renderError = (error) => {
        return (<Alert bsStyle="danger">
            <Message msgId={error || 'catalog.error'} />
          </Alert>);
    };

    renderLoading = () => {
        return this.state.loading ? <Spinner spinnerName="circle" noFadeIn overrideSpinnerClassName="spinner"/> : null;
    };

    renderPagination = () => {
        let total = this.props.result.numberOfRecordsMatched;
        let returned = this.props.result.numberOfRecordsReturned;
        let start = this.props.searchOptions.startPosition;
        // let next = this.props.result.nextRecord;
        let pageSize = this.props.pageSize;
        let page = Math.floor( start / pageSize);
        let pageN = Math.ceil(total / pageSize);
        return (<div><Pagination
          prev next first last ellipsis boundaryLinks
          bsSize="small"
          items={pageN}
          maxButtons={5}
          activePage={page + 1}
          onSelect={this.handlePage} />
            <div className="push-right">
                <Message msgId="catalog.pageInfo" msgParams={{start, end: start + returned - 1, total}} />
                {this.renderLoading()}
            </div>
          </div>);
    };

    renderRecords = () => {
        return (<div>
                <RecordGrid {...this.props.gridOptions} key="records"
                    records={this.props.records}
                    catalogURL={this.getCatalogUrl() }
                    onLayerAdd={this.props.onLayerAdd}
                    onZoomToExtent={this.props.onZoomToExtent}
                    zoomToLayer={this.props.zoomToLayer}
                    onError={this.props.onError}
                    showGetCapLinks={this.props.showGetCapLinks}
                    addAuthentication={this.props.addAuthentication}
                    currentLocale={this.props.currentLocale}
                />
                {this.renderPagination()}
        </div>);
    };

    renderURLInput = () => {
        if (!this.getCatalogUrl() || this.props.chooseCatalogUrl) {
            return (<FormGroup><FormControl
                ref="catalogURL"
                type="text"
                placeholder={LocaleUtils.getMessageById(this.context.messages, "catalog.catalogUrlPlaceholder")}
                onChange={this.setCatalogUrl}
                onKeyDown={this.onKeyDown}/></FormGroup>);
        }
    };

    renderButtons = () => {
        const buttons = [];
        if (this.props.includeSearchButton) {
            buttons.push(<Button bsStyle="primary" style={this.props.buttonStyle} onClick={this.search}
                        className={this.props.buttonClassName} key="catalog_search_button">
                        {this.renderLoading()} <Message msgId="catalog.search"/>
                    </Button>);
        }
        if (this.props.includeResetButton) {
            buttons.push(<Button style={this.props.buttonStyle} onClick={this.reset} key="catalog_reset_button">
                        <Message msgId="catalog.reset"/>
                    </Button>);
        }
        return buttons;
    };

    renderFormatChoice = () => {
        if (this.props.formats.length > 1) {
            return <FormGroup><FormControl onChange={(e) => this.props.onChangeFormat(e.target.value)} value={this.props.format} componentClass="select">{this.renderFormats()}</FormControl></FormGroup>;
        }
        return null;
    };

    renderFormats = () => {
        return this.props.formats.map((format) => <option value={format.name} key={format.name}>{format.label}</option>);
    };

    render() {
        const textSearch = (<FormGroup><FormControl
            ref="searchText"
            type="text"
            style={{
                textOverflow: "ellipsis"
            }}
            placeholder={LocaleUtils.getMessageById(this.context.messages, "catalog.textSearchPlaceholder")}
            onChange={this.onSearchTextChange}
            onKeyDown={this.onKeyDown}/></FormGroup>);
        return (
             <div>
                 <div>
                     {this.renderFormatChoice()}
                     {this.renderURLInput()}

                     {this.props.wrapOptions ? <Panel collapsible defaultExpanded={false} header={LocaleUtils.getMessageById(this.context.messages, "catalog.options")}>
                         {textSearch}
                     </Panel> : textSearch}
                     {this.renderButtons()}
                 </div>
                 <div>
                    {this.renderResult()}
                    {this.props.layerError ? this.renderError(this.props.layerError) : null}
                 </div>
             </div>
        );
    }

    search = () => {
        this.props.onSearch(this.props.format, this.getCatalogUrl(), 1, this.props.pageSize, this.state && this.state.searchText);
        this.setState({
            loading: true
        });
    };

    reset = () => {
        if (this.refs.catalogURL) {
            this.refs.catalogURL.refs.input.value = '';
        }
        if (this.refs.searchText) {
            this.refs.searchText.refs.input.value = '';
        }
        this.props.onReset();
    };

    setCatalogUrl = (e) => {
        this.setState({catalogURL: e.target.value});
    };

    handlePage = (eventKey) => {
        if (eventKey) {
            let start = (eventKey - 1) * this.props.pageSize + 1;
            this.props.onSearch(this.props.format, this.getCatalogUrl(), start, this.props.pageSize, this.props.searchOptions.text);
            this.setState({
                loading: true
            });
        }
    };
}

module.exports = Catalog;
