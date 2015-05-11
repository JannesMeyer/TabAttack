import React from 'react';
import Page from './components/Page';

window.getString = getString;
window.sendMessage = sendMessage;

addEventListener('load', () => {
  sendMessage('get_document', doc => {
    React.render(<Page message={doc.message} doc={doc} />, document.body);
  });
});

function getString(id) {
  return id;
}

function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
    var r = Math.floor(Math.random() * 16);
    if (char === 'y') {
      r = r&0x3|0x8;
    }
    return r.toString(16);
  });
}

function sendMessage(event, message, callback) {
  // Second argument is optional
  message = message || {};
  if (typeof message === 'function') { callback = message; message = {}; }

  message._event = event;
  if (callback) {
    message._id = generateGuid();
  }

  // Send the message
  postMessage(message, '*');

  // Temporary event listener
  if (callback) {
    addEventListener('message', function listener(ev) {
      if (ev.data._response_to === message._id) {
        removeEventListener('message', listener);
        ev.stopPropagation();
        callback(ev.data);
      }
    });
  }
}