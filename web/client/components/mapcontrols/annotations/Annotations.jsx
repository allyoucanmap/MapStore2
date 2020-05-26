/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');
const PropTypes = require('prop-types');
const ConfirmDialog = require('../../misc/ConfirmDialog');
const Message = require('../../I18N/Message');
const LocaleUtils = require('../../../utils/LocaleUtils');
const LineThumb = require('../../../components/style/thumbGeoms/LineThumb.jsx');
const CircleThumb = require('../../../components/style/thumbGeoms/CircleThumb.jsx');
const MultiGeomThumb = require('../../../components/style/thumbGeoms/MultiGeomThumb.jsx');
const PolygonThumb = require('../../../components/style/thumbGeoms/PolygonThumb.jsx');
const {head} = require('lodash');
const assign = require('object-assign');
const MSFilter = require('../../misc/Filter');
const uuidv1 = require('uuid/v1');
const GeometryEditor = require('./GeometryEditor');
const {Grid, Col, Row, Glyphicon, Button, ControlLabel, FormGroup, FormControl, Nav, NavItem} = require('react-bootstrap');
const BorderLayout = require('../../layout/BorderLayout');
const Toolbar = require('../../misc/toolbar/Toolbar');
const SideGrid = require('../../misc/cardgrids/SideGrid');
const localizedProps = require('../../misc/enhancers/localizedProps');
const SelecAnnotationsFile = require("./SelectAnnotationsFile");
const Manager = require('../../style/vector/Manager');
const defaultConfig = require('./AnnotationsConfig');
const { Editor } = require('react-draft-wysiwyg');
const Filter = localizedProps('filterPlaceholder')(MSFilter);
const ContentEditable = require('react-contenteditable').default;
/**
 * Annotations panel component.
 * It can be in different modes:
 *  - list: when showing the current list of annotations on the map
 *  - detail: when showing a detail of a specific annotation
 *  - editing: when editing an annotation
 * When in list mode, the list of current map annotations is shown, with:
 *  - summary card for each annotation, with full detail show on click
 *  - upload annotations Button
 *  - new annotation Button
 *  - download annotations Button
 *  - filtering widget
 * When in detail mode the configured editor is shown on the selected annotation, in viewer mode.
 * When in editing mode the configured editor is shown on the selected annotation, in editing mode.
 *
 * It also handles removal confirmation modals
 * @memberof components.mapControls.annotations
 * @class
 * @prop {string} id id of the borderlayout Component
 * @prop {boolean} closing user asked for closing panel when editing
 * @prop {boolean} styling flag to state status of styling during editing
 * @prop {boolean} showUnsavedChangesModal flag to state status of UnsavedChangesModal
 * @prop {boolean} showUnsavedStyleModal flag to state status of UnsavedStyleModal
 * @prop {object} editing annotation object currently under editing (null if we are not in editing mode)
 * @prop {function} toggleControl triggered when the user closes the annotations panel
 * @prop {object} removing object to remove, it is also a flag that means we are currently asking for removing an annotation / geometry. Toggles visibility of the confirm dialog
 * @prop {string} mode current mode of operation (list, editing, detail)
 * @prop {object} editor editor component, used in detail and editing modes
 * @prop {object[]} annotations list of annotations objects to list
 * @prop {string} current id of the annotation currently shown in the editor (when not in list mode)
 * @prop {object} config configuration object, where overridable stuff is stored (fields config for annotations, marker library, etc.) {@link #components.mapControls.annotations.AnnotationsConfig}
 * @prop {string} filter current filter entered by the user
 * @prop {function} onToggleUnsavedChangesModal toggles the view of the UnsavedChangesModal
 * @prop {function} onToggleUnsavedStyleModal toggles the view of the UnsavedStyleModal
 * @prop {function} onCancelRemove triggered when the user cancels removal
 * @prop {function} onCancelEdit triggered when the user cancels any changes to the properties or geometry
 * @prop {function} onCancelStyle triggered when the user cancels any changes to the style
 * @prop {function} onConfirmRemove triggered when the user confirms removal
 * @prop {function} onCancelClose triggered when the user cancels closing
 * @prop {function} onConfirmClose triggered when the user confirms closing
 * @prop {function} onAdd triggered when the user clicks on the new annotation button
 * @prop {function} onHighlight triggered when the mouse hovers an annotation card
 * @prop {function} onCleanHighlight triggered when the mouse is out of any annotation card
 * @prop {function} onDetail triggered when the user clicks on an annotation card
 * @prop {function} onFilter triggered when the user enters some text in the filtering widget
 * @prop {function} classNameSelector optional selector to assign custom a CSS class to annotations, based on
 * @prop {function} onSetErrorSymbol set a flag in the state to say if the default symbols exists
 * @prop {function} onDownload triggered when the user clicks on the download annotations button
 * @prop {function} onUpdateSymbols triggered when user click on refresh icon of the symbols addon
 * @prop {boolean} symbolErrors errors related to the symbols
 * @prop {object[]} lineDashOptions list of options for dashed lines
 * @prop {string} symbolsPath path to the svg folder
 * @prop {object[]} symbolList list of symbols
 * @prop {string} defaultShape default Shape
 *
 * the annotation's attributes.
 */

class Annotations extends React.Component {
    static propTypes = {
        id: PropTypes.string,
        styling: PropTypes.bool,
        toggleControl: PropTypes.func,

        closing: PropTypes.bool,
        showUnsavedChangesModal: PropTypes.bool,
        showUnsavedStyleModal: PropTypes.bool,
        editing: PropTypes.object,
        removing: PropTypes.object,
        onCancelRemove: PropTypes.func,
        onConfirmRemove: PropTypes.func,
        onCancelClose: PropTypes.func,
        onToggleUnsavedChangesModal: PropTypes.func,
        onToggleUnsavedStyleModal: PropTypes.func,
        onResetCoordEditor: PropTypes.func,
        onAddNewFeature: PropTypes.func,
        onToggleUnsavedGeometryModal: PropTypes.func,
        onConfirmClose: PropTypes.func,
        onCancelEdit: PropTypes.func,
        onCancelStyle: PropTypes.func,
        onAdd: PropTypes.func,
        onHighlight: PropTypes.func,
        onCleanHighlight: PropTypes.func,
        onDetail: PropTypes.func,
        mode: PropTypes.string,
        editor: PropTypes.func,
        annotations: PropTypes.array,
        current: PropTypes.string,
        config: PropTypes.object,
        filter: PropTypes.string,
        onFilter: PropTypes.func,
        classNameSelector: PropTypes.func,
        width: PropTypes.number,
        onDownload: PropTypes.func,
        onLoadAnnotations: PropTypes.func,
        onUpdateSymbols: PropTypes.func,
        onSetErrorSymbol: PropTypes.func,
        symbolErrors: PropTypes.array,
        lineDashOptions: PropTypes.array,
        symbolList: PropTypes.array,
        defaultShape: PropTypes.string,
        symbolsPath: PropTypes.string
    };

    static contextTypes = {
        messages: PropTypes.object
    };

    static defaultProps = {
        mode: 'list',
        config: defaultConfig,
        classNameSelector: () => '',
        toggleControl: () => {},
        onUpdateSymbols: () => {},
        onSetErrorSymbol: () => {},
        onLoadAnnotations: () => {},
        annotations: []
    };
    state = {
        selectFile: false
    }
    getConfig = () => {
        return assign({}, defaultConfig, this.props.config);
    };

    renderFieldValue = (field, annotation) => {
        const fieldValue = annotation.properties[field.name] || '';
        switch (field.type) {
        case 'html':
            return <span dangerouslySetInnerHTML={{__html: fieldValue} }/>;
        default:
            return fieldValue;
        }
    };

    renderField = (field, annotation) => {
        return (<div className={"mapstore-annotations-panel-card-" + field.name}>
            {this.renderFieldValue(field, annotation)}
        </div>);
    };

    renderThumbnail = ({style, featureType, geometry, properties = {}}) => {
        const markerStyle = style.MultiPoint || style.Point || style.iconGlyph && style;
        const marker = markerStyle ? this.getConfig().getMarkerFromStyle(markerStyle) : {};
        if (featureType === "LineString" || featureType === "MultiLineString" ) {
            return (<span className={"mapstore-annotations-panel-card"}>
                <LineThumb styleRect={style[featureType]}/>
            </span>);
        }
        if (featureType === "Polygon" || featureType === "MultiPolygon" ) {
            return (<span className={"mapstore-annotations-panel-card"}>
                <PolygonThumb styleRect={style[featureType]}/>
            </span>);
        }
        if (featureType === "Circle") {
            return (<span className={"mapstore-annotations-panel-card"}>
                <CircleThumb styleRect={style[featureType]}/>
            </span>);
        }
        if (featureType === "GeometryCollection" || featureType === "FeatureCollection") {
            return (<span className={"mapstore-annotations-panel-card"}>
                {(!!(geometry.geometries || geometry.features || []).filter(f => f.type !== "MultiPoint").length || (properties.textValues && properties.textValues.length)) && (<MultiGeomThumb styleMultiGeom={style} geometry={geometry} properties={properties}/>)}
                {markerStyle ? (<span className={"mapstore-annotations-panel-card"}>
                    <div className={"mapstore-annotations-panel-card-thumbnail-" + marker.name} style={{...marker.thumbnailStyle, margin: 'auto', textAlign: 'center', color: '#ffffff', marginLeft: 7}}>
                        <span className={"mapstore-annotations-panel-card-thumbnail " + this.getConfig().getGlyphClassName(markerStyle)} style={{marginTop: 0, marginLeft: -7}}/>
                    </div>
                </span>) : null}
            </span>);
        }
        return (
            <span className={"mapstore-annotations-panel-card"}>
                <div className={"mapstore-annotations-panel-card-thumbnail-" + marker.name} style={{...marker.thumbnailStyle, margin: 'auto', textAlign: 'center', color: '#ffffff', marginLeft: 7}}>
                    <span className={"mapstore-annotations-panel-card-thumbnail " + this.getConfig().getGlyphClassName(markerStyle)} style={{marginTop: 0, marginLeft: -7}}/>
                </div>
            </span>);
    };

    renderItems = (annotation) => {
        const cardActions = {
            onMouseEnter: () => {this.props.onHighlight(annotation.properties.id); },
            onMouseLeave: this.props.onCleanHighlight,
            onClick: () => this.props.onDetail(annotation.properties.id)
        };
        return {
            ...this.getConfig().fields.reduce( (p, c)=> {
                return assign({}, p, {[c.name]: this.renderField(c, annotation)});
            }, {}),
            preview: this.renderThumbnail({style: annotation.style, featureType: "FeatureCollection", geometry: {features: annotation.features}, properties: annotation.properties }),
            ...cardActions
        };
    };

    renderCards = () => {
        if (this.props.mode === 'list') {
            return (
                <SideGrid items={this.props.annotations && this.props.annotations.filter(this.applyFilter).map(a => this.renderItems(a))}/>
            );
        }
        const annotation = this.props.annotations && head(this.props.annotations.filter(a => a.properties.id === this.props.current));
        const Editor = this.props.editor;
        if (this.props.mode === 'detail') {
            return <Editor feature={annotation} showBack id={this.props.current} config={this.props.config} width={this.props.width} {...annotation.properties}/>;
        }
        // mode = editing
        return this.props.editing && <Editor feature={annotation} id={this.props.editing.properties && this.props.editing.properties.id || uuidv1()} width={this.props.width} config={this.props.config} {...this.props.editing.properties} lineDashOptions={this.props.lineDashOptions}
            symbolsPath={this.props.symbolsPath}
            onUpdateSymbols={this.props.onUpdateSymbols}
            onSetErrorSymbol={this.props.onSetErrorSymbol}
            symbolErrors={this.props.symbolErrors}
            symbolList={this.props.symbolList}
            defaultShape={this.props.defaultShape}
        />;
    };

    renderHeader() {
        return (
            <Grid fluid className="ms-header" style={this.props.styling || this.props.mode !== "list" ? { width: '100%', boxShadow: 'none'} : { width: '100%' }}>
                <Row>
                    <Col xs={2}>
                        <Button className="square-button no-events">
                            <Glyphicon glyph="comment"/>
                        </Button>
                    </Col>
                    <Col xs={8}>
                        <h4><Message msgId="annotations.title"/></h4>
                    </Col>
                    <Col xs={2}>
                        <Button className="square-button no-border" onClick={this.props.toggleControl} >
                            <Glyphicon glyph="1-close"/>
                        </Button>
                    </Col>
                </Row>
                {this.props.mode === "list" && <span><Row style={{margin: "auto"}}>
                    <Col xs={12} style={{margin: "auto"}} className="text-center">
                        <Toolbar
                            btnDefaultProps={{ className: 'square-button-md', bsStyle: 'primary'}}
                            buttons={[
                                {
                                    glyph: 'upload',
                                    tooltip: <Message msgId="annotations.loadtooltip"/>,
                                    visible: this.props.mode === "list",
                                    onClick: () => { this.setState(() => ({selectFile: true})); }
                                },
                                {
                                    glyph: 'plus',
                                    tooltip: <Message msgId="annotations.add"/>,
                                    visible: this.props.mode === "list",
                                    onClick: () => { this.props.onAdd(); }
                                },
                                {
                                    glyph: 'download',
                                    disabled: !(this.props.annotations && this.props.annotations.length > 0),
                                    tooltip: <Message msgId="annotations.downloadtooltip"/>,
                                    visible: this.props.mode === "list",
                                    onClick: () => { this.props.onDownload(); }
                                }
                            ]}/>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} style={{padding: "0 15px"}}>
                        <Filter
                            filterPlaceholder={LocaleUtils.getMessageById(this.context.messages, "annotations.filter")}
                            filterText={this.props.filter}
                            onFilter={this.props.onFilter} />
                    </Col>
                </Row></span>}

            </Grid>
        );
    }

    render() {
        let body = null;
        if (this.props.closing ) {
            body = (<ConfirmDialog
                show
                modal
                onClose={this.props.onCancelClose}
                onConfirm={this.props.onConfirmClose}
                confirmButtonBSStyle="default"
                closeGlyph="1-close"
                confirmButtonContent={<Message msgId="annotations.confirm" />}
                closeText={<Message msgId="annotations.cancel" />}>
                <Message msgId="annotations.undo"/>
            </ConfirmDialog>);
        } else if (this.props.showUnsavedChangesModal) {
            body = (<ConfirmDialog
                show
                modal
                onClose={this.props.onToggleUnsavedChangesModal}
                onConfirm={() => { this.props.onCancelEdit(); this.props.onToggleUnsavedChangesModal(); }}
                confirmButtonBSStyle="default"
                closeGlyph="1-close"
                confirmButtonContent={<Message msgId="annotations.confirm" />}
                closeText={<Message msgId="annotations.cancel" />}>
                <Message msgId="annotations.undo"/>
            </ConfirmDialog>);
        } else if (this.props.showUnsavedStyleModal) {
            body = (<ConfirmDialog
                show
                modal
                onClose={this.props.onToggleUnsavedStyleModal}
                onConfirm={() => { this.props.onCancelStyle(); this.props.onToggleUnsavedStyleModal(); }}
                confirmButtonBSStyle="default"
                closeGlyph="1-close"
                confirmButtonContent={<Message msgId="annotations.confirm" />}
                closeText={<Message msgId="annotations.cancel" />}>
                <Message msgId="annotations.undo"/>
            </ConfirmDialog>);
        } else if (this.props.removing) {
            body = (<ConfirmDialog
                show
                modal
                onClose={this.props.onCancelRemove}
                onConfirm={() => this.props.onConfirmRemove(this.props.removing)}
                confirmButtonBSStyle="default"
                closeGlyph="1-close"
                confirmButtonContent={<Message msgId="annotations.confirm" />}
                closeText={<Message msgId="annotations.cancel" />}>
                {this.props.mode === 'editing' ? <Message msgId="annotations.removegeometry"/> :
                    <Message msgId="annotations.removeannotation" msgParams={{title: this.props.editing && this.props.editing.properties && this.props.editing.properties.title}}/>}
            </ConfirmDialog>);
        } else if (this.state.selectFile) {
            body = (
                <SelecAnnotationsFile
                    text={<Message msgId="annotations.selectfiletext"/>}
                    onFileChoosen={this.props.onLoadAnnotations}
                    show={this.state.selectFile}
                    disableOvveride={!(this.props.annotations && this.props.annotations.length > 0)}
                    onClose={() => this.setState(() => ({selectFile: false}))}
                />);


        } else {
            body = (<span> {this.renderCards()} </span>);
        }
        return (<BorderLayout id={this.props.id} header={this.renderHeader()}>
            {body}
        </BorderLayout>);

    }

    applyFilter = (annotation) => {
        return !this.props.filter || this.getConfig().fields.reduce((previous, field) => {
            return (annotation.properties[field.name] || '').toUpperCase().indexOf(this.props.filter.toUpperCase()) !== -1 || previous;
        }, false);
    };
}

const uniq = require('lodash/uniq');

function getAnnotationType(feature) {
    if (feature?.properties?.isCircle) {
        return 'Circle';
    }
    if (feature?.properties?.isText) {
        return 'Text';
    }
    return feature?.geometry?.type;
}

function getAnnotationGlyph(type) {
    const glyphs = {
        Point: 'point',
        MultiPoint: 'point',
        LineString: 'polyline',
        MultiLineString: 'polyline',
        Polygon: 'polygon',
        MultiPolygon: 'polygon',
        Text: 'font',
        Circle: '1-circle'
    };
    return glyphs[type] || 'geometry-collection';
}

function getAnnotationLabel(type) {
    const glyphs = {
        Point: 'Point',
        MultiPoint: 'Point',
        LineString: 'Line',
        MultiLineString: 'Line',
        Polygon: 'Polygon',
        MultiPolygon: 'Polygon',
        Text: 'Text',
        Circle: 'Circle'
    };
    return glyphs[type];
}

function FeatureCard({
    selected,
    style,
    properties,
    geometry,
    onSelect = () => {},
    buttons = () => []
}) {

    const type = getAnnotationType({ properties, geometry });

    const glyph = getAnnotationGlyph(type);

    const selectedClassName = selected ? ' ms-selected' : '';

    return (
        <div
            className={`ms-feature-card${selectedClassName}`}
            onClick={() => onSelect()}>
            <div className="ms-feature-card-preview">
                <Glyphicon glyph={glyph}/>
            </div>
            <div className="ms-feature-card-info">
                <div>{getAnnotationLabel(type) || properties?.id}</div>
            </div>
            <Toolbar
                btnDefaultProps={{
                    className: 'square-button-md no-border'
                }}
                buttons={buttons({
                    properties,
                    geometry,
                    style
                })}
            />
        </div>
    );
}

function FeatureCollection({
    features = [],
    toolbar,
    properties,
    style,
    children,
    featureButtons = () => [],
    selectedId,
    onSelect = () => {}
}) {
    return (
        <div
            className="ms-feature-collection">
            <div
                className="ms-feature-collection-head">
                
            </div>
            <div className="ms-feature-collection-main">
                <div
                    className="ms-feature-collection-body">
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        width: '100%',
                        height: '100%'
                    }}>
                        {toolbar}
                        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'auto'}}>
                            <div
                                className="ms-feature-collection-list">
                                <FormGroup>
                                    <ControlLabel>Title</ControlLabel>
                                    <FormControl defaultValue={properties?.title} />
                                </FormGroup>
                                <FormGroup>
                                    <ControlLabel>Description</ControlLabel>
                                    {<Editor
                                        toolbar={{
                                            options: ['blockType', 'inline', 'link', 'list', 'remove'],
                                            inline: {
                                                options: ['bold', 'italic', 'underline']
                                            },
                                            list: {
                                                options: ['ordered', 'unordered']
                                            }
                                        }}
                                    />}
                                    {/* <FormControl />*/}
                                </FormGroup>
                                {/* <div dangerouslySetInnerHTML={{__html: properties.description}}/>*/}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#ffffff',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10
                                }}>
                                    <ControlLabel>Geometries</ControlLabel>
                                    <Toolbar
                                        btnDefaultProps={{
                                            className: 'square-button-md no-border'
                                        }}
                                        buttons={[
                                            {
                                                glyph: 'point-plus',
                                                onClick: () => {},
                                                tooltip: 'Add new point'
                                            },
                                            {
                                                glyph: 'polyline-plus',
                                                onClick: () => { },
                                                tooltip: 'Add new line'
                                            },
                                            {
                                                glyph: 'polygon-plus',
                                                onClick: () => { },
                                                tooltip: 'Add new polygon'
                                            },
                                            {
                                                glyph: 'font-add',
                                                onClick: () => { },
                                                tooltip: 'Add new text'
                                            },
                                            {
                                                glyph: '1-circle-add',
                                                onClick: () => { },
                                                tooltip: 'Add new circle'
                                            }
                                        ]}
                                    />
                                </div>
                                {features.length === 0 && <div style={{ textAlign: 'center' }}>Add a new geometry</div>}
                                {features.map((feature, key) => {
                                    return (
                                        <FeatureCard
                                            key={key}
                                            { ...feature }
                                            selected={selectedId === feature?.properties?.id}
                                            buttons={featureButtons}
                                            onSelect={() => onSelect(feature)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    
                </div>
                {children}
            </div>
        </div>
    );
}

// evalute a different card
function FeatureCollectionCard({
    properties = {},
    onSelect = () => {},
    onMouseEnter = () => {},
    onMouseLeave = () => {},
    features
}) {

    const types = uniq(features?.map((feature) => getAnnotationType(feature)));
    const type = types.length > 1
        ? 'GeometryCollection'
        : types[0];

    const glyph = getAnnotationGlyph(type);

    return (
        <div
            className="ms-feature-collection-card"
            onClick={() => onSelect()}
            onMouseEnter={() => onMouseEnter()}
            onMouseLeave={() => onMouseLeave()}>
            <div className="ms-feature-collection-card-preview">
                <Glyphicon glyph={glyph}/>
            </div>
            <div className="ms-feature-collection-card-info">
                <div>{properties?.title}</div>
                <div dangerouslySetInnerHTML={{__html: properties?.description}}/>
            </div>
            <Toolbar
                btnDefaultProps={{
                    className: 'square-button-md no-border'
                }}
                buttons={[{
                    glyph: 'zoom-to',
                    tooltip: 'Zoom to annotation',
                    onClick: (event) => {
                        event.stopPropagation();
                    }
                },
                {
                    glyph: 'eye-open',
                    tooltip: 'Hide annotation',
                    onClick: (event) => {
                        event.stopPropagation();
                    }
                }]}
            />
        </div>
    );
}

function FeatureCollections({
    collections = [],
    toolbar,
    onSelect = () => {},
    onMouseEnter = () => {},
    onMouseLeave = () => {}
}) {
    return (
        <div
            className="ms-feature-collections">
            {toolbar}
            <div
                className="ms-feature-collections-head">
                <Filter filterPlaceholder="annotations.filter"/>
            </div>
            <div
                className="ms-feature-collections-body">
                <div
                    className="ms-feature-collections-list">
                    {collections.map((collection, key) => {
                        return (
                            <FeatureCollectionCard
                                key={key}
                                { ...collection }
                                onSelect={() => onSelect(collection)}
                                onMouseEnter={() => onMouseEnter(collection)}
                                onMouseLeave={() => onMouseLeave(collection)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const Annot = ({
    selected,
    annotations,
    onDetail,
    onCleanHighlight,
    onHighlight,
    onAdd = () => {},
    current,
    onDownload = () => {},
    mode,
    onCancel = () => {},
    onCancelEdit = () => {},
    // onConfirmClose = () => {},
    onBack = () => {},
    onSelect = () => {}
}) => {

    const [tab, setTab] = React.useState('coordinates');

    const [format, setFormat] = React.useState('decimal');
    const [pointType, setPointType] = React.useState('marker');
    const [symbolList, setSymbolList] = React.useState();

    // this is wrong only mockup imp
    if (mode === 'list') {
        return (
            <FeatureCollections
                collections={annotations}
                onSelect={(collection) => onDetail(collection?.properties?.id)}
                onMouseEnter={(collection) => onHighlight(collection?.properties?.id)}
                onMouseLeave={() => onCleanHighlight()}
                toolbar={
                    <Toolbar
                        btnGroupProps={{
                            style: {
                                textAlign: 'center'
                            }
                        }}
                        btnDefaultProps={{
                            className: 'square-button-md',
                            bsStyle: 'primary',
                            tooltipPosition: 'bottom'
                        }}
                        buttons={[
                            {
                                glyph: 'upload',
                                tooltip: <Message msgId="annotations.loadtooltip"/>,
                                onClick: () => {}
                            },
                            {
                                glyph: 'plus',
                                tooltip: <Message msgId="annotations.add"/>,
                                onClick: () => { onAdd(); }
                            },
                            {
                                glyph: 'download',
                                disabled: !(annotations && annotations.length > 0),
                                tooltip: <Message msgId="annotations.downloadtooltip"/>,
                                onClick: () => onDownload(annotations)
                            }
                        ]}
                    />
                }
            />
        );
    }

    const featureCollection = annotations?.find(({ properties }) => properties.id === current) || {};
    const featureType = getAnnotationType(selected);
    const glyph = selected && getAnnotationGlyph(featureType);

    return (
        <FeatureCollection
            { ...featureCollection }
            key={selected?.properties?.id}
            selectedId={selected?.properties?.id}
            toolbar={
                <div style={{ textAlign: 'center'}}>
                    <Toolbar
                        btnDefaultProps={{
                            className: 'square-button-md',
                            bsStyle: 'primary',
                            tooltipPosition: 'bottom'
                        }}
                        buttons={[
                            {
                                glyph: 'arrow-left',
                                tooltip: 'Back to annotation',
                                onClick: () => {
                                    onCancel();
                                    onCleanHighlight();
                                    onCancelEdit();
                                    onBack();
                                    onSelect(null);
                                }
                            },
                            {
                                glyph: 'floppy-disk',
                                tooltip: 'Save annotation'
                            }
                        ]}
                    />
                </div>
            }
            onSelect={(feature) => feature?.properties?.id === selected?.properties?.id
                ? onSelect(null)
                : onSelect(feature)}
            featureButtons={() => [
                {
                    Element: () => <Glyphicon glyph="ok-sign" className="text-success"/>
                },
                {
                    glyph: 'zoom-to',
                    tooltip: 'Zoom to geometry',
                    onClick: (event) => {
                        event.stopPropagation();
                    }
                },
                {
                    glyph: 'trash',
                    tooltip: 'Remove',
                    onClick: (event) => {
                        event.stopPropagation();
                    }
                }
            ]}
        >
            {selected &&
                <div style={{
                    flex: 1,
                    order: -1,
                    borderRight: '1px solid #ddd',
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: 8, display: 'flex', alignItems: 'center' }}>
                        <Glyphicon glyph={glyph} style={{ fontSize: 20, paddingRight: 8 }}/>
                        <div style={{ flex: 1 }}>
                            <FormControl
                                defaultValue={getAnnotationLabel(featureType) || selected?.properties?.id}
                                placeholder="Enter geometry title"
                            />
                        </div>
                    </div>
                    {selected?.properties?.isText && <div style={{ padding: 8 }}>
                        <FormGroup>
                            <ControlLabel>Label</ControlLabel>
                            <FormControl defaultValue={selected?.properties?.valueText} />
                        </FormGroup>
                    </div>}
                    <Nav bsStyle="tabs" activeKey={tab} justified>
                        <NavItem
                            key="coordinates"
                            eventKey="coordinates"
                            onClick={() => setTab('coordinates')}>
                            Coordinates
                        </NavItem>
                        <NavItem
                            key="style"
                            eventKey="style"
                            onClick={() => setTab('style')}>
                            Style
                        </NavItem>
                    </Nav>
                    <div style={{ flex: 1, overflow: 'auto', paddingTop: 8 }}>
                        {tab === 'coordinates' && <GeometryEditor
                            isDraggable
                            featureType={featureType}
                            comfirmSave={false}
                            // mockup circle
                            selected={featureType === 'Circle' ? {
                                ...selected,
                                geometry: {
                                    type: 'Point',
                                    coordinates: [0, 0]
                                }
                            } : selected}
                            format={format}
                            onChangeFormat={(newFormat) => setFormat(newFormat)}
                        />}
                        {tab === 'style' && <Manager
                            style={selected?.style}
                            markersOptions={defaultConfig}
                            pointType={pointType}
                            symbolList={symbolList}
                            onUpdateSymbols={(symbols) => {
                                // console.log(symbols);
                                setSymbolList(symbols);
                            }}
                            onChangeStyle={(style) => {
                                onSelect({
                                    ...selected,
                                    style
                                });
                            }}
                            onChangePointType={(newPointType) => {
                                setPointType(newPointType);
                            }}
                        />}
                    </div>
                </div>}
        </FeatureCollection>
    );
};

module.exports = Annot;
