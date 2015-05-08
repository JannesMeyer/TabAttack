import { ActionButton } from 'sdk/ui/button/action';
import { PageMod } from 'sdk/page-mod';
import tabs from 'sdk/tabs';
import self from 'sdk/self';
import { Hotkey } from 'sdk/hotkeys';

// Store the action button here
var button;

export function addButtonListener(callback) {
  button = ActionButton({
    id: 'export',
    label: 'Export all tabs as markdown',
    icon: {
      16: './icon-16.png',
      32: './icon-32.png',
      64: './icon-64.png'
    },
    onClick: callback,
    badgeColor: '#00AAAA'
  });
}

export function addTabCountListener(callback) {
  tabs.on('open', callback);
  tabs.on('close', callback);
}

var commands = {
  'export_current_window': { combo: 'accel-shift-s' },
  'copy_tab_as_markdown': { combo: 'accel-shift-l' },
  'move_tab_left': { combo: 'accel-shift-,' },
  'move_tab_right': { combo: 'accel-shift-.' },
  'pin_tab': { combo: 'ctrl-p' }
};

export function onCommand(id, callback) {
  Hotkey({
    combo: commands[id].combo,
    onPress: callback
  });
}

var listeners = new Map();
PageMod({
  include: self.data.url('output.html'),
  contentScript: `window.addEventListener("message", function(ev) { self.postMessage(ev.data); });`,
  onAttach: worker => {
    worker.on('message', data => {
      var listener = listeners.get(data._event);
      if (listener) {
        if (data._id) {
          var sendResponse = function(responseData) {
            console.log('not implemented');
          };
        }
        listener(data, sendResponse);
      }
    });
  }
});

export function onMessage(id, listener) {
  listeners.set(id, listener);
}

export function exportAllWindows() {
  tabs.open('./output.html');

  // var { open } = require('sdk/window/utils');
  // var window = open(self.data.url('output.html'), {
  //   features: {
  //     centerscreen: true,
  //     resizable: true,
  //     width: 800,
  //     height: 600
  //   }
  // });
  // console.log(window);
  // window.onload = function() {
  //   window.document.innerHTML ='lol';
  // };
  // global.wnd = window;
}

export function exportCurrentWindow() {
  console.log('exportCurrentWindow');
}

export function updateIcon() {
  button.badge = tabs.length;
}

export function copyTabAsMarkdown() {

}

export function moveTab(direction) {

}

export function closeOtherTabs() {

}

export function openWindows(windows, reuseThreshold = 1) {

}

export function pinTab() {

}