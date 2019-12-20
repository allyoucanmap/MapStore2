/*
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const React = require('react');
const {connect} = require('react-redux');
const {loadMaps, mapsSearchTextChanged} = require('../actions/maps');
const ConfigUtils = require('../utils/ConfigUtils');
const SearchBarControl = require("../components/mapcontrols/search/SearchBar");
const { Form, FormGroup, ControlLabel } = require('react-bootstrap');
const Select = require('react-select');
const Toolbar = require('../components/misc/toolbar/Toolbar');
const tooltip = require('../components/misc/enhancers/tooltip');
const moment = require('moment');
const { DateTimePicker } = require('react-widgets');
const momentLocalizer = require('react-widgets/lib/localizers/moment');
const SwitchButtonMS = require("../components/misc/switch/SwitchButton");
const { withResizeDetector } = require('react-resize-detector');
momentLocalizer(moment);

const SwitchButton = tooltip(SwitchButtonMS);

const Search = (props) => {
    const options = [
        {
            label: 'Global view',
            value: 'context-1'
        },
        {
            label: 'Exploration tools',
            value: 'context-2'
        },
        {
            label: 'Editing tools',
            value: 'context-3'
        },
        {
            label: 'Generic context',
            value: 'context-4'
        }
    ];

    const [filterVisible, setFilterVisibility] = React.useState(false);
    const [selected, setSelected] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    const [enableDate, setEnableDate] = React.useState(false);
    const [action, setAction] = React.useState({ value: 'Creation', label: 'Creation' });
    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);

    // simulate loading
    React.useEffect(() => {
        if (loading) {
            setTimeout(() => {
                setLoading(false);
            }, 750);
        }
    }, [ loading ]);

    const isFiltered = selected && selected.length > 0 || enableDate && fromDate && toDate;

    return (
        <div className="ms-maps-search">
            <div className="ms-maps-search-input">
                <SearchBarControl
                    { ...props }
                    buttons={[
                        {
                            glyph: 'filter',
                            className: 'square-button-md no-border',
                            active: !!(filterVisible || isFiltered),
                            bsStyle: isFiltered ? 'success' : 'default',
                            tooltip: isFiltered
                                ? filterVisible ? 'Hide advanced filters (active)' : 'Show advanced filters (active)'
                                : filterVisible ? 'Hide advanced filters' : 'Show advanced filters',
                            onClick: () => setFilterVisibility(!filterVisible)
                        }
                    ]}/>
            </div>
            {filterVisible &&
            <div className="ms-maps-search-filters">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h5 style={{ flex: 1 }}>Advanced search filters</h5>
                    <Toolbar
                        btnDefaultProps={{
                            className: 'square-button-md no-border'
                        }}
                        buttons={[
                            {
                                glyph: 'clear-filter',
                                tooltip: 'Clear all filter',
                                loading,
                                onClick: () => {
                                    setEnableDate(false);
                                    setSelected([]);
                                    setFromDate(null);
                                    setToDate(null);
                                }
                            }
                        ]}/>
                </div>
                <Form>

                    <FormGroup>
                        <ControlLabel>Context</ControlLabel>
                        <Select
                            value={selected}
                            options={options}
                            multi
                            onChange={(values) => {
                                setSelected(values);
                                setLoading(true);
                            }}/>
                    </FormGroup>

                    <FormGroup
                        style={!enableDate ? { opacity: 0.5 } : {}}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                            <ControlLabel style={{ flex: 1 }}>Date</ControlLabel>
                            <SwitchButton
                                tooltip={enableDate
                                    ? 'Disable date filter'
                                    : 'Enable date filter'}
                                checked={enableDate}
                                onChange={() => {
                                    setEnableDate(!enableDate);
                                }}/>
                        </div>
                        <div style={props.width < 768 ? {
                            display: 'flex',
                            flexDirection: 'column'
                        } : {
                            display: 'flex',
                            alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div>Action:</div>
                                <Select
                                    disabled={!enableDate}
                                    value={action}
                                    clearable={false}
                                    options={[
                                        {
                                            value: 'Creation',
                                            label: 'Creation'
                                        },
                                        {
                                            value: 'Update',
                                            label: 'Update'
                                        }
                                    ]}
                                    onChange={(values) => {
                                        setAction(values);
                                        setLoading(true);
                                    }}/>
                            </div>
                            <div style={{ flex: 1, marginLeft: props.width < 768 ? 0 : 8 }}>
                                <div>From:</div>
                                <DateTimePicker
                                    disabled={!enableDate}
                                    value={fromDate}
                                    onChange={(date) => setFromDate(date)}
                                    format="Do MMMM YYYY"
                                    time={false}
                                    footer={false}/>
                            </div>
                            <div style={{ flex: 1, marginLeft: props.width < 768 ? 0 : 8 }}>
                                <div>To:</div>
                                <DateTimePicker
                                    value={toDate}
                                    onChange={(date) => setToDate(date)}
                                    disabled={!enableDate}
                                    format="Do MMMM YYYY"
                                    time={false}
                                    footer={false}/>
                            </div>
                        </div>
                    </FormGroup>
                </Form>
            </div>}
        </div>
    );
};

/**
* MapSearch Plugin is a plugin that allows to make a search, reset its content, show a loading spinner while search is going on and can be
* used for different purpose (maps, wfs services)
* @name MapSearch
* @memberof plugins
* @class
* @param {boolean} [splitTools=true] used to separate search and remove buttons in toolbar,
<br>if true and without text => you see only search
<br>if true and with text => search is substituted with remove
<br>if false and without text => you see only search
<br>if false and with text => you see both (search and remove)
* @param {boolean} [showOptions=true] shows the burger menu in the input field
* @param {string} [activeSearchTool=addressSearch] default search tool. Values are "addressSearch", "coordinatesSearch"
* @param {boolean} [showCoordinatesSearchOption=true] shows the menu item to switch to the coordinate editor
* @param {boolean} [showAddressSearchOption=true]  shows the menu item to switch to the address editor
* @param {boolean} [enabledSearchServicesConfig=false] shows the menu item to open the custom search services config
* @example
* {
*   "name": "MapSearch",
*   "cfg": {
*     "splitTools": true,
*     "showOptions": true,
*     "activeSearchTool": "addressSearch",
*     "showCoordinatesSearchOption": true,
*     "showAddressSearchOption": true,
*     "enabledSearchServicesConfig": false
*   }
* }
*/
const SearchBar = connect((state) => ({
    className: "maps-search",
    hideOnBlur: false,
    placeholderMsgId: "maps.search",
    typeAhead: false,
    splitTools: false,
    showOptions: false,
    isSearchClickable: true,
    start: state && state.maps && state.maps.start,
    limit: state && state.maps && state.maps.limit,
    searchText: state.maps && state.maps.searchText !== '*' && state.maps.searchText || ""
}), {
    onSearchTextChange: mapsSearchTextChanged,
    onSearch: (text, options) => {
        let searchText = text && text !== "" ? text : ConfigUtils.getDefaults().initialMapFilter || "*";
        return loadMaps(ConfigUtils.getDefaults().geoStoreUrl, searchText, options);
    },
    onSearchReset: loadMaps.bind(null, ConfigUtils.getDefaults().geoStoreUrl, ConfigUtils.getDefaults().initialMapFilter || "*")
}, (stateProps, dispatchProps, ownProps) => {

    return {
        ...stateProps,
        ...ownProps,
        onSearch: (text) => {
            let limit = stateProps.limit;
            dispatchProps.onSearch(text, {start: 0, limit});
        },
        onSearchReset: () => {
            dispatchProps.onSearchReset({start: 0, limit: stateProps.limit});
        },
        onSearchTextChange: dispatchProps.onSearchTextChange
    };
})(withResizeDetector(class extends React.Component {
    render() {
        return (<Search { ...this.props } />);
    }
}));

module.exports = {
    MapSearchPlugin: SearchBar,
    reducers: {maps: require('../reducers/maps')}
};
