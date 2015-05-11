import {
  addButtonListener,
  addTabCountListener,
  updateIcon,
  onCommand,
  getActiveTab,
  getHighlightedTabs,
  getTargetWindows,
  selectTargetWindow,
  moveTabsToNewWindow,
  moveTabsToWindow,
  moveTab,
  pinTab,
  getCurrentWindow,
  getAllWindows,
  openDocument,
  getString,
  copyToClipboard,
  URL,
  Preferences,
  ask } from './helpers/browser-firefox';
import { throttle } from 'date-tool';
import { markdownLink } from './lib/markdown';

// Boolean: Development mode
var isDev = (process.env.NODE_ENV !== 'production');

// Document formatters
var formatters = {
  json:     formatJSONDocument,
  markdown: formatMarkdownDocument
};

// Tab counter
addButtonListener(exportAllWindows);
addTabCountListener(throttle(updateIcon, 500));
updateIcon();

// Keyboard shortcuts
onCommand('export_all_windows', exportAllWindows);
onCommand('export_current_window', exportCurrentWindow);
onCommand('copy_tab_as_markdown', copyTabAsMarkdown);
onCommand('send_tab', sendTab);
onCommand('move_tab_left', moveTab.bind(null, -1));
onCommand('move_tab_right', moveTab.bind(null, 1));
onCommand('pin_tab', pinTab);

function exportAllWindows() {
  getAllWindows()
    .then(filterTabs)
    .then(filterEmptyWindows)
    .then(addMessage)
    .then(formatDocument)
    .then(openDocument)
    .catch(printError);
}

function exportCurrentWindow() {
  getCurrentWindow()
    .then(filterTabs)
    .then(filterEmptyWindows)
    .then(addMessage)
    .then(formatDocument)
    .then(openDocument)
    .catch(printError);
}

/**
 * Filters out tabs based on protocol, domain and isPinned
 */
function filterTabs(windows) {
  return Preferences.get('ignorePinned', 'domainBlacklist', 'protocolBlacklist').then(prefs => {
    windows.forEach(wnd => {
      wnd.tabs = wnd.tabs.filter(tab => {
        var url = new URL(tab.url);
        var isProtocolBlacklisted = (prefs.protocolBlacklist.indexOf(url.protocol) !== -1); // TODO: includes?
        var isDomainBlacklisted = (prefs.domainBlacklist.indexOf(url.hostname) !== -1);
        return !isProtocolBlacklisted && !isDomainBlacklisted && !(prefs.ignorePinned && tab.isPinned);
      });
    });
    return windows;
  });
}

/**
 * Filters out empty windows (i.e. one where no tabs are left)
 */
function filterEmptyWindows(windows) {
  return windows.filter(w => (w.tabs.length > 0));
}

/**
 *
 */
function addMessage(windows) {
  var message;
  var loadingTabs = windows.reduce((n, wnd) => n + wnd.loadingTabs, 0);

  if (windows.length === 0) {
    message = getString('toast_no_tabs');
  } else if (loadingTabs > 0) {
    message = getString('toast_loading_tab', loadingTabs);
  }
  return { windows, message };
}

/**
 *
 */
function formatDocument(args) {
  return Preferences.get('format').then(f => formatters[f](args));
}

/**
 * Build a pretty-printed JSON document from an array of windows
 */
function formatJSONDocument({ windows, message }) {
  windows = windows.map(w => w.tabs.map(t => ({ title: t.title, url: t.url })));
  return {
    format: 'json',
    text: JSON.stringify(windows, null, 2),
    message
  };
}

/**
 * Build a markdown document from an array of windows
 */
function formatMarkdownDocument({ windows, message }) {
  var lines = [];
  var highlightLine = 0;
  for (var wnd of windows) {
    if (wnd.incognito) {
      lines.push('# ' + getString('headline_incognito_window', wnd.tabs.length));
    } else {
      lines.push('# ' + getString('headline_window', wnd.tabs.length));
    }
    lines.push('');
    for (var tab of wnd.tabs) {
      lines.push('- ' + markdownLink(tab.title, tab.url));
      if (tab.active) {
        highlightLine = lines.length;
      }
    }
    lines.push('');
    lines.push('');
  }
  lines.pop();
  return {
    format: 'markdown',
    text: lines.join('\n'),
    highlightLine,
    message
  };
}

/**
 * Helper: Print error message
 */
function printError(error) {
  console.error(error);
}

function copyTabAsMarkdown() {
  var tab = getActiveTab();
  copyLinkAsMarkdown(tab.title, tab.url, 'documentTitle');
}

/**
 * Let the user modify link title and then copy it as Markdown
 */
function copyLinkAsMarkdown(originalTitle, url, type) {
  // Let the user modify the title
  var title = ask(getString('prompt_title_change', originalTitle), originalTitle);
  if (title === null) {
    return;
  }

  // Shortcut: Use the naked domain name
  if (title === '') {
    title = new URL(url).hostname.replace(/^www\./, '');
  }

  // if (isDev) {
  //   TitleChangelog.logChange(originalTitle, title, url, type);
  // }

  // Copy as a Markdown link
  copyToClipboard(markdownLink(title, url));
}

/*
 * Global shortcut: Send the highlighted tabs to another window
 */
function sendTab() {
  getHighlightedTabs()
    .then(getTargetWindows)
    .then(selectTargetWindow)
    .then(({ tabs, newWindow, targetWindowId, incognito }) => {
      if (newWindow) {
        return moveTabsToNewWindow(tabs, incognito);
      } else {
        return moveTabsToWindow(tabs, targetWindowId);
      }
    })
    .catch(printError);
}