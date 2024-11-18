import React, { useEffect, useState } from 'react';
import axios from '../../../libs/ajax';
import { Editor } from 'react-draft-wysiwyg';
import { Tabs, Tab, Checkbox } from 'react-bootstrap';
import { htmlToDraftJSEditorState, draftJSEditorStateToHtml } from '../../../utils/EditorUtils';
import Message from '../../../components/I18N/Message';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { getInitialSelectedResource } from '../selectors/resources';
import { parseNODATA } from '../utils/ResourcesUtils';
import Box from '../components/Box';
import Icon from '../components/Icon';
import Text from '../components/Text';
import Spinner from '../components/Spinner';

function ResourceAboutEditor({
    value,
    settings,
    onChange
}) {
    const [editorState, setEditorState] = useState(htmlToDraftJSEditorState(value || ''));
    return (
        <Tabs>
            <Tab eventKey="content" title={'Content'}>
                <Editor
                    editorState={editorState}
                    stripPastedStyles
                    onEditorStateChange={(newEditorState) => {
                        setEditorState(newEditorState);
                        const previousHTML = draftJSEditorStateToHtml(editorState);
                        const newHTML = draftJSEditorStateToHtml(newEditorState);
                        if (newHTML !== previousHTML) {
                            onChange({ 'attributes.details': newHTML });
                        }
                    }}
                    toolbar={{
                        options: ['fontFamily', 'blockType', 'inline', 'textAlign', 'colorPicker', 'list', 'link', 'remove', 'image'],
                        image: {
                            className: undefined,
                            component: undefined,
                            popupClassName: undefined,
                            urlEnabled: true,
                            uploadEnabled: true,
                            alignmentEnabled: true,
                            uploadCallback: (file) => new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.addEventListener('load', () => {
                                    resolve({data: {link: reader.result}});
                                });
                                if (file) {
                                    reader.readAsDataURL(file);
                                } else {
                                    reject();
                                }
                            }),
                            previewImage: true,
                            inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
                            alt: { present: false, mandatory: false },
                            defaultSize: {
                                height: 'auto',
                                width: 'auto'
                            }
                        }
                    }}
                />
            </Tab>
            <Tab eventKey="settings" title={'Settings'}>
                <Checkbox
                    checked={!!settings?.showAsModal}
                    onChange={(event) => onChange({ 'attributes.detailsSettings.showAsModal': event.target.checked })}
                >
                    <Message msgId="map.details.showAsModal" />
                </Checkbox>
                <Checkbox
                    checked={!!settings?.showAtStartup}
                    onChange={(event) => onChange({ 'attributes.detailsSettings.showAtStartup': event.target.checked })}
                >
                    <Message msgId="map.details.showAtStartup" />
                </Checkbox>
            </Tab>
        </Tabs>
    );
}

function ResourceAbout({
    detailsUrl,
    editing,
    resource,
    onChange = () => {}
}) {
    const details = parseNODATA(resource?.attributes?.details || '');
    const [about, setAbout] = useState(detailsUrl ? '' : details);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (detailsUrl) {
            setLoading(true);
            axios.get(detailsUrl)
                .then(({ data }) => {
                    setAbout(data);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [detailsUrl]);

    if (loading || (!about && !editing)) {
        return (
            <Box className="ms-details-message" display="flex" flexItemsCenter ptb="lg">
                <Box>
                    <Text fontSize="xxl" textAlign="center">
                        {loading ? <Spinner /> : <Icon glyph="sheet" type="glyphicon" />}
                    </Text>
                    <Text fontSize="lg" textAlign="center">
                        <Message msgId={loading ? 'resourcesCatalog.loadingAbout' : 'resourcesCatalog.noAbout'}/>
                    </Text>
                </Box>
            </Box>
        );
    }
    return (
        <Box ptb="sm">
            {editing
                ? <ResourceAboutEditor
                    value={about}
                    settings={resource?.attributes?.detailsSettings}
                    onChange={onChange}
                />
                : <div dangerouslySetInnerHTML={{ __html: about || '' }} />}
        </Box>
    );
}

const ConnectedResourceAbout = connect(
    createStructuredSelector({
        detailsUrl: (state, props) => {
            return parseNODATA(getInitialSelectedResource(state, props)?.attributes?.details);
        }
    })
)(ResourceAbout);

export default ConnectedResourceAbout;
