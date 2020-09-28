import assertDefined from '../assertDefined';

export default async function closeOtherTabs() {
  const [sourceTab, windows] = await Promise.all([
    browser.tabs.getCurrent(),
    browser.windows.getAll({ populate: true })
  ]);
  // Identify the window that hosts the sourceTab
  let sourceWindow = assertDefined(windows.find(w => assertDefined(w.id) === sourceTab.windowId));
  // Close other windows
  for (let w of windows) {
    if (w === sourceWindow) { continue; }
    browser.windows.remove(assertDefined(w.id));
  }
  // Close other tabs
  let tabIds = assertDefined(sourceWindow.tabs).map(t => assertDefined(t.id)).filter(id => id !== sourceTab.id);
  browser.tabs.remove(tabIds);
}