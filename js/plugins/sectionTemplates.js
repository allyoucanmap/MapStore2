
import uuidv1 from 'uuid/v1';

const sectionTemplates = (type) => {
    const section = {
        cover: {
            type: 'cover',
            id: uuidv1(),
            contents: [
                {
                    id: uuidv1(),
                    type: 'cover',
                    factor: 1,
                    offset: 0,
                    background: {
                        type: 'image',
                        cover: true,
                        src: 'assets/img/stsci-h-p1821a-m-1699x2000.png'
                    },
                    foreground: {
                        cover: true,
                        title: 'Title',
                        description: 'mockup test'
                    }
                }
            ]
        },
        title: {
            type: 'title',
            id: uuidv1(),
            contents: [
                {
                    id: uuidv1(),
                    type: 'title',
                    foreground: {
                        mediaCover: true,
                        mediaSrc: 'assets/img/map.png',
                        mediaType: 'image',
                        title: 'Title'
                    }
                }
            ]
        },
        paragraph: {
            type: 'paragraph',
            id: uuidv1(),
            contents: [
                {
                    id: uuidv1(),
                    type: 'paragraph',
                    foreground: {
                        text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos'
                    }
                }
            ]
        },
        immersive: {
            type: 'immersive',
            title: 'Immersive',
            id: uuidv1(),
            contents: [
                {
                    id: uuidv1(),
                    type: 'column',
                    layer: 'block',
                    background: {
                        type: 'image',
                        cover: true,
                        src: 'assets/img/map.png'
                    },
                    foreground: {
                        textContainerPosition: 'left',
                        text: 'Add your text'
                    }
                }
            ]
        },
        immersiveContent: {
            id: uuidv1(),
            type: 'column',
            layer: 'block',
            background: {
                type: 'image',
                cover: true,
                src: 'assets/img/map.png'
            },
            foreground: {
                textContainerPosition: 'left',
                text: 'Add your text'
            }
        }
    };
    return section[type] || { };
};

export default sectionTemplates;
