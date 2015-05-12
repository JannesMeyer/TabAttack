import { ActionButton }     from 'sdk/ui/button/action';
import { PageMod }          from 'sdk/page-mod';
import { Hotkey }           from 'sdk/hotkeys';
import { URL }              from 'sdk/url';
import { browserWindows }   from 'sdk/windows';
import Promise              from 'sdk/core/promise';
import { viewFor }          from 'sdk/view/core';
import { getOuterId, open } from 'sdk/window/utils';
import clipboard from 'sdk/clipboard';
import tabs      from 'sdk/tabs';
import self      from 'sdk/self';

import Preferences from './Preferences';
import { buildQuery } from './lib/query-string';

import { Cu } from 'chrome';
Cu.import('resource://gre/modules/Services.jsm');

export { URL, Preferences };

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

/**
 * Opens a popup. At the moment only one at a time is supported.
 */
function showPopup({ url, params = '', width = 800, height = 600 }) {
  var deferred = Promise.defer();

  // Register/overwrite return handler
  onMessage('popup_close', data => {
    deferred.resolve(data);
  });

  tabs.open(self.data.url(url) + params);
  // open(self.data.url(url) + params, {
  //   features: {
  //     width,
  //     height,
  //     centerscreen: true,
  //     resizable: true
  //   }
  // });
  return deferred.promise;
}

/**
 * The last generated document
 */
var _doc;

/**
 * Message listeners
 */
var listeners = new Map();

/**
 * Action button
 */
var button;

var commands = {
  'export_all_windows': { combo: 'accel-shift-s' },
  'export_current_window': { combo: 'accel-ctrl-s' },
  'copy_tab_as_markdown': { combo: 'accel-shift-l' },
  'move_tab_left': { combo: 'accel-shift-,' },
  'move_tab_right': { combo: 'accel-shift-.' },
  'pin_tab': { combo: 'ctrl-p' },
  'send_tab': { combo: 'accel-e' }
};

PageMod({
  include: self.data.url('output.html'),
  contentScriptFile: './content-script.js',
  onAttach: startListening
});

function startListening(worker) {
  worker.on('message', function({ _event, _id }) {
    if (_event === undefined) {
      return;
    }
    var listener = listeners.get(_event);
    if (listener === undefined) {
      throw new Error('No listener for ' + _event);
    }
    // Prepare a function that can receive responses
    var sendResponse = function(data) {
      data._response_to = _id;
      worker.postMessage(data);
    };
    // Call the listener
    listener(arguments[0], sendResponse);
  });
}

/*
 * Message from output.html: Get document
 */
onMessage('get_document', (msg, sendResponse) => {
  if (_doc) {
    sendResponse(_doc);
  } else {
    sendResponse({ error: getString('toast_no_document') });
  }
});

export function openDocument(doc) {
  _doc = doc;
  tabs.open('./output.html');
}

export function onCommand(id, callback) {
  if (commands[id] === undefined) {
    throw new Error('The first argument is not a valid command: ' + id);
  }
  if (typeof callback !== 'function') {
    throw new Error('The second argument has to be a function');
  }
  Hotkey({
    combo: commands[id].combo,
    onPress: callback
  });
}

export function onMessage(id, listener) {
  listeners.set(id, listener);
}

export function getCurrentWindow() {
  return Promise.resolve(browserWindows.activeWindow);
}
export function getAllWindows() {
  return Promise.resolve(Array.prototype.splice.call(browserWindows));
}

function convertWindows(windows) {

  // // Pull the current window to the top
  // var activeWindow = browserWindows.activeWindow;
  // var index = windowsExport.findIndex(w => w.id === sourceTab.windowId);
  // if (index > 0) {
  //   windowsExport.unshift(windowsExport.splice(index, 1)[0]);
  // }

  // var highlightedTabs = [];
  // // Count highlighted tabs. If >1 only export those.
  // if (highlightedTabs.length > 1) {
  //   windowList = [ { tabs: highlightedTabs } ];
  // }
  var wnd = {
    incognito: browserWindow.isPrivate,
    tabs: [],
    loadingTabs: 0
  };
  // Add tabs
  for (var browserTab of browserWindow.tabs) {
    var tab = {
      title: browserTab.title,
      url: browserTab.url,
      isPinned: browserTab.isPinned,
      active: (browserTab.id === tabs.activeTab.id)
    };
    // Count the number of tabs that are still loading
    if (browserTab.readyState === 'uninitialized' || browserTab.readyState === 'loading') {
      ++wnd.loadingTabs;
    }
    wnd.tabs.push(tab);
  }
  return wnd;
}

export function updateIcon() {
  button.badge = tabs.length;
}

export function getActiveTab() {
  var tab = tabs.activeTab;
  return {
    title: tab.title,
    url: tab.url
  };
}

export function getHighlightedTabs() {
  return Promise.resolve([ getActiveTab() ]);
}

export function moveTab(direction) {

}

export function openWindows(windows, reuseThreshold = 1) {

}

export function closeOtherTabs(tabId) {

}

export function pinTab(tabId) {

}

export function duplicateTab(tabId) {

}

export function getString(id, substitution) {
  // TODO: implement
  return id;
}

export function ask(question, defaultAnswer = '') {
  var inout = { value: defaultAnswer };
  var success = Services.prompt.prompt(null, 'TabAttack', question, inout, null, {});
  if (!success) {
    return null;
  }
  return inout.value.trim();
}

export function copyToClipboard(text) {
  clipboard.set(text, 'text');
}

export function getTargetWindows(tabs) {
  // var activeWindowId = getOuterId(viewFor(browserWindows.activeWindow));
  var activeWindow = browserWindows.activeWindow;

  var targetWindows = Array.prototype.filter.call(browserWindows, function(wnd) {
    var isActive = (wnd === activeWindow);
    return !isActive;
  });
  return { tabs, targetWindows };
}

export function selectTargetWindow({ tabs, targetWindows }) {
  if (targetWindows.length === 0) {
    return { tabs, newWindow: true, incognito: false };
  }

  return showPopup({
    url: 'selection.html',
    params: buildQuery({
      numTabs: tabs.length,
      windowIds: targetWindows.map(w => getOuterId(viewFor(w))).join(';')
    }),
    width: 240,
    height: 400
  });

  // .then(({ windowId, newWindow }) => {
  //   return {
  //     tabs: tabs,
  //     targetWindow: windowId,
  //     newWindow: newWindow,
  //     incognito: false
  //   };
  // });
}

export function moveTabsToNewWindow(tabs, incognito) {

}

export function moveTabsToWindow(tabs, targetWindowId) {

}
