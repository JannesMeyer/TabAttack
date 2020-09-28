/**
 * Opens all windows/tabs that are passed into this function.
 * Re-uses the current window for the first window and just opens
 * new tabs in it if it only has one tab.
 *
 * @param windows: 2-dimensional array of windows and URLs
 */
export function openWindows(windows: string[][], reuseThreshold = 1) {
  browser.windows.getLastFocused({ populate: true }).then(wnd => {
    if (wnd.tabs == null) {
      return;
    }
    // New tabs to create in the CURRENT window
    var newTabs = (wnd.tabs.length <= reuseThreshold) ? windows.shift() : [];

    // Open new windows
    windows.forEach(urls => {
      browser.windows.create({ url: urls, focused: false });
    });

    // Restore focus and open new tabs
    if (newTabs == null) {
      return;
    }
    if (newTabs.length > 0 && wnd.id != null) {
      browser.windows.update(wnd.id, { focused: true });
    }
    newTabs.forEach(url => {
      browser.tabs.create({ windowId: wnd.id, url, active: false });
    });
  });
}