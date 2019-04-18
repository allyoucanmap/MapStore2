
import uuidv1 from 'uuid/v1';
import mapConfig from './mapConfig';

const stories = [
    {
        type: 'cascade',
        sections: [
            {
                type: 'cover',
                id: uuidv1(),
                title: 'Intro',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'cover',
                        factor: 1,
                        offset: 0,
                        background: {
                            type: 'image',
                            cover: true,
                            src: 'assets/img/stsci-h-p1821a-m-1699x2000.png',
                            credits: '© Copyright Test'
                        },
                        foreground: {
                            cover: true,
                            title: 'Highest Astronomical Observatories',
                            description: 'mockup test'
                        }
                    }
                ]
            },
            {
                type: 'paragraph',
                id: uuidv1(),
                pages: 1,
                title: 'Abstract',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'paragraph',
                        factor: 0,
                        offset: 0,
                        speed: 0,
                        foreground: {
                            text: '<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos</p>'
                        }
                    }
                ]
            },
            {
                type: 'immersive',
                id: uuidv1(),
                immersive: true,
                title: 'Maps...',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            src: mapConfig({
                                center: {
                                    x: -67.74222222,
                                    y: -22.98666667,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerPosition: 'left',
                            text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                        }
                    },
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            src: mapConfig({
                                center: {
                                    x: 80.01666667,
                                    y: 32.31666667,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerPosition: 'right',
                            textContainerSize: 'small',
                            text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                        }
                    }
                ]
            },
            {
                type: 'cover',
                id: uuidv1(),
                title: 'Title...',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'title',
                        foreground: {
                            title: 'Another Title',
                            description: 'with description',
                            mediaType: 'image',
                            mediaCover: true,
                            textContainerTransparent: true,
                            textStyleInvert: true,
                            mediaSrc: 'assets/img/JCMT_on_Mauna_Kea.jpg'
                        }
                    }
                ]
            },
            {
                type: 'immersive',
                id: uuidv1(),
                title: 'Maps and Video...',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            src: mapConfig({
                                center: {
                                    x: -155.47333333,
                                    y: 19.82444444,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerPosition: 'right',
                            textContainerTransparent: true,
                            textStyleInvert: true,
                            text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                        }
                    },
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            src: mapConfig({
                                center: {
                                    x: 7.98500000,
                                    y: 46.54750000,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textAlign: 'right',
                            textContainerPosition: 'center',
                            textStyleInvert: true,
                            text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                        }
                    },
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'video',
                            invert: true,
                            src: 'assets/video/GSFC_20190107_TESS_m12853_1stPlanet4k-medium.mp4'
                        },
                        foreground: {
                            textContainerPosition: 'left',
                            textContainerSize: 'small',
                            textStyleInvert: true,
                            textAlign: 'center',
                            text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                        }
                    }
                ]
            }
        ]
    }
];

export default stories;
