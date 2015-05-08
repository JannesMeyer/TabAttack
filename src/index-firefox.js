import * as Browser from './helpers/browser-firefox';

// The generated document
var doc;

// Boolean: Development mode
var isDev = (process.env.NODE_ENV !== 'production');

// self.on("message", function(addonMessage) {
//   // Handle the message
//   console.log(addonMessage);
// });

// Tab counter
Browser.addButtonListener(Browser.exportAllWindows);
Browser.addTabCountListener(Browser.updateIcon);
Browser.updateIcon();

// Keyboard shortcuts
Browser.onCommand('export_current_window', Browser.exportAllWindows);
Browser.onCommand('copy_tab_as_markdown', Browser.copyTabAsMarkdown);
Browser.onCommand('move_tab_left', Browser.moveTab.bind(null, -1));
Browser.onCommand('move_tab_right', Browser.moveTab.bind(null, 1));
Browser.onCommand('pin_tab', Browser.pinTab);

Browser.onMessage('get_document', function(data, sendResponse) {
	console.log('Hello from the background');
});