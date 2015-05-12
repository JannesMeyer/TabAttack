import * as Runtime from 'chrome-tool/runtime';
import * as Windows from 'chrome-tool/windows';
import * as Tabs    from 'chrome-tool/tabs';

var _doc;

export function getAllWindows(sourceTab) {
  return Windows.getAll({ populate: true });
}

export function getCurrentWindow(sourceTab) {
  return Windows.get(sourceTab.windowId, { populate: true });
}

export function convertWindows(windows) {
  return windows.map(wnd => {
    var incognito = wnd.incognito;
    var loadingTabs = 0;
    var tabs = wnd.tabs.map(tab => {
      var title = tab.title;
      var url = tab.url;
      var isPinned = tab.pinned;
      var active = tab.active && wnd.focused;

      var isLoading = (tab.status === 'loading');
      if (isLoading) {
        ++loadingTabs;
      }

      return { title, url, isPinned, active };
    });

    return { tabs, incognito, loadingTabs };
  });
}

export function openDocument(sourceTab, doc) {
  _doc = doc;
  // if (sourceTab.url === 'chrome://newtab/' && !sourceTab.incognito) {
  //  return Promise.all([ Tabs.create({ url }), Tabs.remove(sourceTab.id) ]);
  // }
  Tabs.create({
    url: Runtime.getURL('data/output.html'),
    openerTabId: sourceTab.id
  });
}