
import React, { useState } from 'react';
import ResizableModal from '@mapstore/components/misc/ResizableModal';
import Portal from '@mapstore/components/misc/Portal';
import BorderLayout from '@mapstore/components/layout/BorderLayout';
import Toolbar from '@mapstore/components/misc/toolbar/Toolbar';
import SideGrid from '@mapstore/components/misc/cardgrids/SideGrid';
import Filter from '@mapstore/components/misc/Filter';
import MediaSource from './MediaSource';
import { Form, FormGroup, FormControl, ControlLabel, Glyphicon } from 'react-bootstrap';
import mapConfig from './data/mapConfig';

let mockImages = [
    {
        src: 'assets/img/stsci-h-p1821a-m-1699x2000.png',
        title: 'Universe'
    },
    {
        src: 'assets/img/hs-2015-29-a-xlarge_web.jpg',
        title: 'Space'
    },
    {
        src: 'assets/img/JCMT_on_Mauna_Kea.jpg',
        title: 'Observatory',
        description: 'JCMT on Mauna Kea'
    },
    {
        src: 'assets/img/map.png',
        title: 'Observatory',
        description: 'JCMT on Mauna Kea'
    },
    {
        src: 'assets/img/alpine.jpg',
        title: 'Observatory',
        description: 'JCMT on Mauna Kea'
    },
    {
        src: 'assets/img/cover.png',
        title: 'Observatory',
        description: 'JCMT on Mauna Kea'
    },
    {
        src: 'assets/img/PIA12348-orig.jpg',
        title: 'Observatory',
        description: 'JCMT on Mauna Kea'
    }
];


let mockVideo = [
    {
        src: 'assets/video/GSFC_20190107_TESS_m12853_1stPlanet4k-medium.mp4',
        title: '1st Planet 4k',
        description: 'description'
    },
    {
        src: 'https://www.youtube.com/watch?v=S9HdPi9Ikhk',
        title: 'Restored Apollo 11 EVA',
        description: 'from NASA youtube channel'
    }
];

let mockMap = [
    {
        title: 'Map',
        description: 'Map',
        src: mapConfig()
    }
];

const MediaForm = ({
    media = {},
    onBack = () => {},
    onChange = () => {},
    onSave = () => {},
    form = [
        {
            placeholder: 'Enter image source',
            type: 'text',
            id: 'src',
            label: 'Source',
            validation: ({ src }) => src !== undefined && src === '' ?
                'error'
                : src
                    ? 'success'
                    : undefined
        },
        {
            placeholder: 'Enter title',
            type: 'text',
            id: 'title',
            label: 'Title',
            validation: ({ title }) => title !== undefined && title === '' ?
                'error'
                : title
                    ? 'success'
                    : undefined
        },
        {
            placeholder: 'Enter alternative text',
            type: 'text',
            id: 'alt',
            label: 'Alternative text'
        },
        {
            placeholder: 'Enter description',
            type: 'text',
            id: 'description',
            label: 'Description'
        },
        {
            placeholder: 'Enter credits',
            type: 'text',
            id: 'credits',
            label: 'Credits'
        }
    ]
}) => {
    const [ properties, setProperties ] = useState(media);

    return (
        <BorderLayout
            header={
                <div
                    className="text-center"
                    key="toolbar"
                    style={{
                        borderBottom: '1px solid #ddd',
                        padding: 8
                    }}>
                    <Toolbar
                        btnGroupProps={{
                            style: {
                                marginBottom: 8
                            }
                        }}
                        btnDefaultProps={{
                            bsStyle: 'primary',
                            className: 'square-button-md'
                        }}
                        buttons={[{
                            glyph: 'arrow-left',
                            onClick: () => onBack()
                        }, {
                            glyph: 'floppy-disk',
                            disabled: !properties.src || !properties.title,
                            onClick: () => {
                                onBack();
                                onSave(properties);
                            }
                        }]}/>
                </div>
            }>
            <Form style={{ padding: 8 }}>
                {form.map((field) => (
                    <FormGroup
                        key={field.id}
                        validationState={field.validation && field.validation(properties)}>
                        <ControlLabel>
                            {field.label}
                        </ControlLabel>
                        <FormControl
                            type={field.type}
                            placeholder={field.placeholder}
                            value={properties[field.id] || ''}
                            onChange={(event) => {
                                setProperties({
                                    ...properties,
                                    [field.id]: event.target.value
                                });
                                onChange({
                                    ...properties,
                                    [field.id]: event.target.value
                                });
                            }} />
                    </FormGroup>
                ))}
            </Form>
        </BorderLayout>
    );
};

const defaultMapConfig = {
    map: {
        center: {
            x: 8.953857421875089,
            y: 44.36313311380766,
            crs: 'EPSG:4326'
        },
        maxExtent: [
            -20037508.34,
            -20037508.34,
            20037508.34,
            20037508.34
        ],
        projection: 'EPSG:900913',
        units: 'm',
        zoom: 6,
        mapOptions: {}
    },
    layers: [
        {
            id: 'undefined__4',
            group: 'background',
            source: 'ol',
            title: 'Empty Background',
            type: 'empty',
            visibility: true,
            singleTile: true,
            dimensions: [],
            hideLoading: false,
            handleClickOnLayer: false,
            useForElevation: false,
            hidden: false
        }
    ]
};

const types = {
    image: {
        button: function({ type, onClick }) {
            return {
                text: 'Images',
                bsStyle: type === 'image' ? 'primary' : 'default',
                onClick: () => onClick('image')
            };
        },
        Panel: function({
            // items = [ ],
            media = {},
            onSelect = () => { },
            onPreview = () => { }
        }) {

            const [ status, setStatus ] = useState();

            if (status === 'add') {
                return ( <MediaForm
                    onBack={() => {
                        setStatus('select');
                        onPreview(null);
                    }}
                    onSave={(image) => {
                        mockImages = [ image, ...mockImages ];
                    }}
                    onChange={(properties) => onPreview({
                        type: 'image',
                        ...properties
                    })}/> );
            }
            if (status === 'edit') {
                return ( <MediaForm
                    media={media}
                    onBack={() => {
                        setStatus('select');
                        onPreview(null);
                    }}
                    // onSave={
                        // (image) => { mockImages = [ image, ...mockImages ];}
                    // }
                    onChange={(properties) => onPreview({
                        type: 'image',
                        ...properties
                    })}/> );
            }
            return (
                <BorderLayout
                    header={
                        <div
                            className="text-center"
                            key="toolbar"
                            style={{
                                borderBottom: '1px solid #ddd',
                                padding: 8
                            }}>
                            <Toolbar
                                btnGroupProps={{
                                    style: {
                                        marginBottom: 8
                                    }
                                }}
                                btnDefaultProps={{
                                    bsStyle: 'primary',
                                    className: 'square-button-md'
                                }}
                                buttons={[{
                                    glyph: 'trash',
                                    disabled: media.type !== 'image',
                                    tooltip: 'Remove selected image'
                                }, {
                                    glyph: 'plus',
                                    tooltip: 'Edit new image source',
                                    onClick: () => {
                                        setStatus('add');
                                        onPreview({ });
                                    }
                                }, {
                                    glyph: 'pencil',
                                    tooltip: 'Edit selected image source',
                                    disabled: media.type !== 'image',
                                    onClick: () => {
                                        setStatus('edit');
                                        onPreview(media);
                                    }
                                }]}/>
                            <Filter filterPlaceholder="Filter images.."/>
                        </div>}>
                    <SideGrid
                        items={mockImages.map(({ src, title, description, ...item }) => ({
                            preview: <div
                                style={{
                                    background: `url(${src})`,
                                    width: 96,
                                    height: 96,
                                    margin: 'auto',
                                    backgroundSize: 'cover',
                                    overflow: 'hidden'
                                }}/>,
                            title,
                            description,
                            selected: media.src === src, // BETTER TO USE AN ID
                            onClick: () => onSelect({ type: 'image', src, title, description, ...item })
                        }))}/>
                </BorderLayout>
            );
        },
        View: function({ media }) {
            return (
                <MediaSource
                    adjust
                    id="ms-media-preview"
                    type="image"
                    src={media.src}/>
            );
        }
    },
    video: {
        button: function({ type, onClick }) {
            return {
                text: 'Videos',
                bsStyle: type === 'video' ? 'primary' : 'default',
                onClick: () => onClick('video')
            };
        },
        Panel: function({
            media = {},
            onSelect = () => { },
            onPreview = () => {}
           /* items = [
                {
                    src: 'assets/video/GSFC_20190107_TESS_m12853_1stPlanet4k-medium.mp4',
                    title: '1st Planet 4k',
                    description: 'description'
                }
            ]*/
        }) {
            const [ status, setStatus ] = useState();

            if (status === 'add') {
                return ( <MediaForm
                    onBack={() => {
                        setStatus('select');
                        onPreview(null);
                    }}
                    onSave={(video) => {
                        mockVideo = [ video, ...mockVideo ];
                    }}
                    onChange={(properties) => onPreview({
                        type: 'image',
                        ...properties
                    })}/> );
            }
            if (status === 'edit') {
                return ( <MediaForm
                    media={media}
                    onBack={() => {
                        setStatus('select');
                        onPreview(null);
                    }}
                    // onSave={
                        // (video) => { mockVideo = [ video, ...mockVideo ];}
                    // }
                    onChange={(properties) => onPreview({
                        type: 'video',
                        ...properties
                    })}/> );
            }

            return (
                <BorderLayout
                    header={
                        <div
                            className="text-center"
                            key="toolbar"
                            style={{
                                borderBottom: '1px solid #ddd',
                                padding: 8
                            }}>
                            <Toolbar
                                btnGroupProps={{
                                    style: {
                                        marginBottom: 8
                                    }
                                }}
                                btnDefaultProps={{
                                    bsStyle: 'primary',
                                    className: 'square-button-md'
                                }}
                                buttons={[{
                                    glyph: 'trash',
                                    disabled: media.type !== 'video',
                                    tooltip: 'Remove selected video'
                                }, {
                                    glyph: 'plus',
                                    tooltip: 'Add new video source',
                                    onClick: () => {
                                        setStatus('add');
                                        onPreview({ });
                                    }
                                }, {
                                    glyph: 'cog',
                                    tooltip: 'Edit selected video source',
                                    disabled: media.type !== 'video',
                                    onClick: () => {
                                        setStatus('edit');
                                        onPreview(media);
                                    }
                                }]}/>
                            <Filter filterPlaceholder="Filter videos.."/>
                        </div>}>
                    <SideGrid
                        size="sm"
                        items={mockVideo.map(({ src, title, description, ...item }) => ({
                            title,
                            description,
                            selected: media.src === src, // BETTER TO USE AN ID
                            onClick: () => onSelect({ type: 'video', src, title, description, ...item })
                        }))}/>
                </BorderLayout>
            );
        },
        View: function({ media }) {
            return (
                <MediaSource
                    adjust
                    id="ms-media-preview"
                    type="video"
                    src={media.src}/>
            );
        }
    },
    map: {
        button: function({ type, onClick }) {
            return {
                text: 'Maps',
                bsStyle: type === 'map' ? 'primary' : 'default',
                onClick: () => onClick('map')
            };
        },
        Panel: function({
            // items = []
            media,
            onSelect = () => {}
        }) {
            return (
                <BorderLayout
                    header={
                        <div
                            className="text-center"
                            key="toolbar"
                            style={{
                                borderBottom: '1px solid #ddd',
                                padding: 8
                            }}>
                            <Toolbar
                                btnGroupProps={{
                                    style: {
                                        marginBottom: 8
                                    }
                                }}
                                btnDefaultProps={{
                                    bsStyle: 'primary',
                                    className: 'square-button-md'
                                }}
                                buttons={[{
                                    glyph: 'plus',
                                    tooltip: 'Create new map'
                                }]}/>
                            <Filter filterPlaceholder="Filter maps.."/>
                        </div>}>
                    <SideGrid
                        size="sm"
                        items={mockMap.map(({ title, description, src, ...item }) => ({
                            preview: <Glyphicon glyph="1-map"/>,
                            title,
                            description,
                            selected: media.type === 'map',
                            onClick: () => onSelect({ type: 'map', src, title, description, ...item })
                        }))}/>
                </BorderLayout>
            );
        },
        View: function({ media }) {
            return (
                <MediaSource
                    id="ms-media-preview"
                    type="map"
                    adjust
                    src={media.src || defaultMapConfig}/>
            );
        }
    }
};

const MediaModal = function({
    type,
    src,
    show,
    onShow = () => {},
    onChange = () => {}
}) {

    const [ currentType, setCurrentType ] = useState(type);
    const [ currentMedia, setCurrentMedia ] = useState({ type, src });
    const [ tmpMedia, setTmpMedia ] = useState(null);

    const buttons = Object.keys(types)
        .map(key => types[key].button({
            type: currentType,
            onClick: setCurrentType
        }));
    const { View, Panel } = types[currentType] || {};
    const media = currentType === currentMedia.type ? currentMedia : { };
    return (
        <Portal>
            <ResizableModal
                title="Media"
                show={show}
                onClose={() => onShow(false)}
                className="ms-media-modal"
                size="lg"
                buttons={[
                    {
                        text: 'Apply',
                        bsSize: 'sm',
                        onClick: () => onChange(media)
                    }
                ]}>
                <BorderLayout
                    className="ms-media-modal-layout"
                    header={
                        <div style={{ padding: 4, zIndex: 2 }} className="shadow-soft">
                            <Toolbar
                                btnDefaultProps={{ bsSize: 'sm' }}
                                buttons={buttons} />
                        </div>
                    }
                    columns={[
                        <div style={{ zIndex: 1, order: -1, width: 300, backgroundColor: '#ffffff' }} className="shadow-soft">
                            {Panel && <Panel
                                media={media}
                                onSelect={setCurrentMedia}
                                onPreview={setTmpMedia}/>}
                        </div>
                    ]}>
                    <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                        {View && <View media={tmpMedia || media}/>}
                    </div>
                </BorderLayout>
            </ResizableModal>
        </Portal>
    );
};

export default MediaModal;
