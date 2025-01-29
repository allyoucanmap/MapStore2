
import { createPlugin } from '../../utils/PluginsUtils';
import { connect } from 'react-redux';
import { mapSelector } from '../../selectors/map';
import { createSelector } from 'reselect';
import { zoomToExtent } from '../../actions/map';
import helloworld from './reducers/helloworld';
import { isHelloWorldEnabled, getHelloWorldContent } from './selectors/helloworld';
import { showHelloWorld } from './actions/helloworld';
import HelloWorld from './components/HelloWorld';
import HelloWorldButton from './components/HelloWorldButton';
import helloWorldEpics from './epics/helloworld';
import HelloWorldMapSupport from './components/HelloWorldMapSupport';

const helloWorldMapStateToProps = createSelector([
    mapSelector,
    isHelloWorldEnabled,
    getHelloWorldContent
], (map, enabled, content) => {
    return {
        center: map?.center,
        enabled,
        content
    };
});

const ConnectedHelloWorld = connect(
    helloWorldMapStateToProps,
    {
        onZoomToExtent: zoomToExtent
    }
)(HelloWorld);

const ConnectedHelloWorldButton = connect(
    createSelector([isHelloWorldEnabled], (enabled) => {
        return {
            enabled
        };
    }),
    {
        onClick: showHelloWorld
    }
)(HelloWorldButton);

const ConnectedHelloWorldMapSupport = connect(
    createSelector([isHelloWorldEnabled], (active) => {
        return {
            active
        };
    })
)(HelloWorldMapSupport);

export default createPlugin('HelloWorld', {
    component: ConnectedHelloWorld,
    containers: {
        SidebarMenu: {
            name: 'HelloWorld',
            tool: ConnectedHelloWorldButton,
            position: 12,
            priority: 2,
            doNotHide: true
        },
        TOC: {
            name: 'HelloWorld',
            Component: ConnectedHelloWorldButton,
            target: 'toolbar',
            priority: 1,
            doNotHide: true
        },
        Map: {
            name: 'HelloWorld',
            Tool: ConnectedHelloWorldMapSupport,
            alwaysRender: true
        }
    },
    reducers: {
        helloworld
    },
    epics: {
        ...helloWorldEpics
    }
});
