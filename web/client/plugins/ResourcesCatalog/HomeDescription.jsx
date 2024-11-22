import React from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import HTML from '../../components/I18N/HTML';
import Box from './components/Box';
import Text from './components/Text';
import { Jumbotron } from 'react-bootstrap';

function HomeDescription({

}) {
    return (
        <Box component={Jumbotron} className="ms-secondary-colors" p="lg">
            <Text textAlign="center">
                <HTML msgId="home.shortDescription"/>
            </Text>
        </Box>
    );
}


export default createPlugin('HomeDescription', {
    component: HomeDescription
});
