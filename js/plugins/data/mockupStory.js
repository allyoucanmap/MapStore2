
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
                            src: 'assets/img/stsci-h-p1821a-m-1699x2000.jpg',
                            credits: '© Copyright Test'
                        },
                        foreground: {
                            cover: true,
                            text: '<h1 style="text-align:center;">List of Highest Astronomical Observatories</h1><p style="text-align:center;"><em>From Wikipedia, the free encyclopedia</em></p>'
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
                            text: [{
                                id: 0,
                                field: 'text',
                                html: '<p>This is a list of the<strong> </strong><strong><ins>highest astronomical observatories</ins></strong><strong> </strong>in the world, considering only ground-based observatories and ordered by elevation above mean sea level. The main list includes only permanent observatories with facilities constructed at a fixed location, followed by a supplementary list for temporary observatories such as transportable telescopes or instrument packages. For large observatories with numerous telescopes at a single location, only a single entry is included listing the main elevation of the observatory or of the highest operational instrument if that information is available.</p>'
                            }, {
                                field: 'media',
                                id: 1,
                                position: 'center',
                                size: 'full',
                                description: "View showing several of the world's highest observatory sites in Chile, looking north across the Llano de Chajnantor and ALMA site, with the peaks of Cerro Toco (right center) and Cerro Chajnantor (right) rising above.",
                                src: 'assets/img/ALMA_Dwarfed_by_Mountain_Peaks.jpg',
                                type: 'image'
                            }]
                        }
                    }
                ]
            },
            {
                type: 'immersive',
                id: uuidv1(),
                immersive: true,
                title: 'History',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            position: 'right',
                            size: 'medium',
                            src: mapConfig({
                                center: {
                                    x: -67.742222,
                                    y: -22.986667,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerPosition: 'left',
                            text: "<h2 style=\"font-family: Impact;\">History of high altitude astronomical observatories</h2><p>Prior to the late 19th century, almost all astronomical observatories throughout history were located at modest elevations, often close to cities and educational institutions for the simple reason of convenience.[1] As air pollution from industrialization and light pollution from artificial lighting increased during the Industrial Revolution, astronomers sought observatory sites in remote locations with clear and dark skies, naturally drawing them towards the mountains. The first permanent mountaintop astronomical observatory was the Lick Observatory constructed from 1876 to 1887, at the modest elevation of 1,283 m (4,209 ft) atop Mount Hamilton in California.[2] The first high altitude observatory was constructed atop the 2,877 m (9,439 ft) Pic du Midi de Bigorre in the French Pyrenees starting in 1878, with its first telescope and dome installed in 1904.[3] Astronomical observations were also made from Mont Blanc in the late 1800s.[4] A few other high altitude observatories (such as the Lowell Observatory in Arizona and Sphinx Observatory in Switzerland) were constructed through the first half of the 20th century. However, the two most important and prominent of the early 20th century observatories, Mount Wilson Observatory and Palomar Observatory, were both located on mid-elevation mountaintops of about 1,700 m (5,600 ft) in southern California.[5] The stunning successes and discoveries made there using the world's largest telescopes, the 100-inch Hooker Telescope and 200-inch Hale Telescope, spurred the move to ever higher sites for the new generation of observatories and telescopes after World War II, along with a worldwide search for locations which had the best astronomical seeing. Since the mid-20th century, an increasing number of high altitude observatory sites have been developed at locations around the world, including numerous sites in Arizona, Hawaii, Chile, and the Canary Islands.[6][7] The initial wave of high-altitude sites were mostly in the 2,000–2,500 m (6,600–8,200 ft) range, but astronomers soon sought even higher sites above 3,000 m (9,800 ft). Among the largest, best developed, and most renowned of these high altitude sites is the Mauna Kea Observatory located near the summit of a 4,205 m (13,796 ft) volcano in Hawaii, which has grown to include over a dozen major telescopes during the four decades since it was founded. In the first decade of the 21st century, there has been a new wave of observatory construction at very high altitudes above 4,500 m (14,800 ft), with such observatories constructed in India, Mexico, and most notably the Atacama Desert in northern Chile, now the site of several of the world's highest observatories. The scientific benefits of these sites outweigh the numerous logistical and physiological challenges which must be overcome during the construction and operation of observatories in remote mountain locations, even in desert, polar, and tropical island sites which magnify the challenges but confer additional observational advantages. Sites at high altitude are ideal for optical astronomy and provide optimal seeing, being above a significant portion of the Earth's atmosphere with its associated weather, turbulence, and diminished clarity. In particular, sites on mountaintops within about 80 km (50 mi) of the ocean often have excellent observing conditions above a stable inversion layer throughout much of the year.[8] High altitude sites are also above most of atmosphere's water vapor, making them ideal for infrared astronomy and submillimeter astronomy as those wavelengths are strongly absorbed by water vapor. On the other hand, high altitude does not offer as significant an advantage for radio astronomy at longer wavelengths, so relatively few radio telescopes are located at such sites. At the far end of the spectrum, for the extremely short wavelengths of x-ray and gamma ray astronomy, along with high-energy cosmic rays, high altitude observations once again offers significant advantages, enough that many experiments at these wavelengths have been conducted by balloon-borne or even by space telescopes, although a number of high-altitude ground-based sites have also been used. These include the Chacaltaya Astrophysical Observatory in Bolivia, which at 5,230 m (17,160 ft) was the world's highest permanent astronomical observatory[9] from the time of its construction during the 1940s until surpassed in 2009 by the new University of Tokyo Atacama Observatory,[10] an optical-infrared telescope on a remote 5,640 m (18,500 ft) mountaintop in Chile.</p>"
                        }
                    }
                ]
            },
            {
                type: 'title',
                id: uuidv1(),
                title: 'Observatories',
                contents: [
                    {
                        id: uuidv1(),
                        type: 'title',
                        foreground: {
                            text: '<h1>Where are they located?</h1>',
                            mediaType: 'image',
                            mediaCover: true,
                            textContainerTransparent: false,
                            textStyleInvert: false,
                            mediaSrc: 'assets/img/hs-2015-29-a-xlarge_web.jpg'
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
                            position: 'left',
                            size: 'large',
                            src: mapConfig({
                                center: {
                                    x: -155.473333,
                                    y: 19.824444,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerSize: 'small',
                            textContainerPosition: 'right',
                            textStyleInvert: false,
                            text: [{
                                id: 0,
                                field: 'text',
                                html: '<h2 style="font-family: Impact;">Mauna Kea Observatory</h2>'
                            }, {
                                field: 'media',
                                id: 1,
                                position: 'center',
                                size: 'full',
                                description: "Aerial view of part of the Mauna Kea Observatory, showing Subaru, Keck, and IRTF telescopes (left to right).",
                                src: 'assets/img/The_Keck_Subaru_and_Infrared_obervatories.jpg',
                                type: 'image'
                            }]
                        }
                    },
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            position: 'left',
                            size: 'large',
                            src: mapConfig({
                                center: {
                                    x: -68.131389,
                                    y: -16.353333,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerPosition: 'right',
                            textContainerSize: 'small',
                            textContainerTransparent: false,
                            textStyleInvert: false,
                            text: [{
                                id: 0,
                                field: 'text',
                                html: '<h2 style="font-family: Impact;">Chacaltaya Astrophysical Observatory</h2>'
                            }, {
                                field: 'media',
                                id: 1,
                                position: 'center',
                                size: 'full',
                                description: "Particle detector at Chacaltaya Astrophysical Observatory, the highest permanent astronomical observatory in the world from the 1940s through 2009.",
                                src: 'assets/img/Obsevatorio_Astrofísico_de_Chacaltaya.jpg',
                                type: 'image'
                            }]
                        }
                    },
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'map',
                            cover: true,
                            position: 'left',
                            size: 'large',
                            src: mapConfig({
                                center: {
                                    x: 78.964167,
                                    y: 32.779444,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerSize: 'small',
                            textContainerPosition: 'right',
                            textStyleInvert: false,
                            text: [{
                                id: 0,
                                field: 'text',
                                html: '<h2 style="font-family: Impact;">Indian Astronomical Observatory</h2>'
                            }, {
                                field: 'media',
                                id: 1,
                                position: 'center',
                                size: 'full',
                                description: "The Indian Astronomical Observatory stands at an altitude of 4,500 m (14,800 ft) on Mount Saraswati in Ladakh, India.",
                                src: 'assets/img/Hanle_observatory.jpg',
                                type: 'image'
                            }]
                        }
                    },
                    {
                        id: uuidv1(),
                        type: 'column',
                        layer: 'block',
                        background: {
                            type: 'video',
                            invert: true,
                            position: 'right',
                            size: 'large',
                            src: 'https://www.youtube.com/watch?v=StDFZpuB9F4'
                        },
                        foreground: {
                            textContainerPosition: 'left',
                            textContainerSize: 'small',
                            textStyleInvert: true,
                            text: "<h2 style=\"font-family: Impact;\">The Best Stargazing is at the Northern Tip of India</h2><p>For some of the best stargazing in the world, many make the trek to Ladakh at the northern tip of India. The region is home to the Indian Astronomical Observatory, specifically situated for its unique geology. Located on cold, remote desert land, the area experiences very little rainfall and hardly any snow. The high altitude—2.5 miles above sea level—also allows scientists to collect more data than would be possible at a lower altitude. For visitors of the observatory, the summer months give way to a perfectly clear sky. As soon as the sun sets, visitors are treated to a blanket of extraordinary stars and light.</p><p>From Great Big Story</p>"
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
                                zoom: 3,
                                center: {
                                    x: 0,
                                    y: 0,
                                    crs: 'EPSG:4326'
                                }
                            })
                        },
                        foreground: {
                            textContainerPosition: 'center',
                            textContainerSize: 'medium',
                            textContainerTransparent: true,
                            text: '<h1 style="text-align:center;"><span style="font-family: Impact;">Map of all Observatories listed in Wikipedia</span></h1>'
                        }
                    }
                ]
            }
        ]
    }
];

export default stories;
