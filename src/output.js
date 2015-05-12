import React from 'react';
import Page from './components/Page';
var { sendMessage } = ContentRuntime; // Injected by webpack

addEventListener('load', () => {
  sendMessage('get_document', doc => {
    React.render(<Page message={doc.message} doc={doc} />, document.body);
  });
});