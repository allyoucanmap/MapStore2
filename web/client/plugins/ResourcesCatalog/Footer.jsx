import React from 'react';
import { createPlugin } from "../../utils/PluginsUtils";
import HTML from '../../components/I18N/HTML';
import Text from './components/Text';

function Footer({

}) {

    return (
        <div className="ms-footer _padding-tb-lg _padding-lr-md">
            <Text textAlign="center">
                <HTML msgId="home.footerDescription"/>
            </Text>
        </div>
    );
}


export default createPlugin('Footer', {
    component: Footer
});
