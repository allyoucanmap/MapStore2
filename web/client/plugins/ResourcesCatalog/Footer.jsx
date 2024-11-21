import React from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import Box from './components/Box';
import HTML from '../../components/I18N/HTML';
import Text from './components/Text';

function Footer({

}) {

    return (
        <Box className="ms-footer" ptb="lg" plr="md">
            <Text textAlign="center">
                <HTML msgId="home.footerDescription"/>
            </Text>
        </Box>
    );
}


export default createPlugin('Footer', {
    component: Footer
});
