const isOpera = (navigator.vendor.indexOf('Opera') !== -1);

/**
 * Gets all highlighted tabs in the last focused window.
 * This function is guaranteed to at least return the active
 * tab of that window.
 */
export function getHighlighted(): Promise<browser.tabs.Tab[]> {
  // Opera doesn't have highlighted tabs, so we have to customize the query
  if (isOpera) {
    return browser.tabs.query({ lastFocusedWindow: true, active: true });
  } else {
    return browser.tabs.query({ lastFocusedWindow: true, highlighted: true });
  }
}

/**
 * Gets active tab in the last focused window.
 */
export function getActive(): Promise<browser.tabs.Tab> {
  return browser.tabs.query({ lastFocusedWindow: true, active: true }).then(results => results[0]);
}

/**
 * Show a URL by opening it in a new tab
 */
export function open(openerTab: browser.tabs.Tab, url: string) {
  // if (openerTab.url === 'chrome://newtab/' && !openerTab.incognito) {
  //  return Promise.all([ create({ url }), remove(openerTab.id) ]);
  // }
  return browser.tabs.create({ url, openerTabId: openerTab.id });
}

/**
 * Return the total number of tabs
 */
export function count(): Promise<number> {
  return browser.tabs.query({ windowType: 'normal' }).then(tabs => tabs.length);
}

/**
 * Move all highlighted tabs in a window to the left or to the right
 */
export function moveHighlighted(direction: number) {
  if (direction === 0) {
    throw new TypeError("The direction parameter can't be zero");
  }
  browser.windows.getLastFocused({ populate: true }).then(wnd => {
    if (wnd.tabs == null) {
      throw new Error('The window does not have tabs');
    }
    // Opera reports all tabs as not highlighted, even the active one
    let highlighted: Array<browser.tabs.Tab> = wnd.tabs.filter(t => t.highlighted || t.active);

    // Change the iteration behaviour to backwards
    if (direction > 0) {
      highlighted[Symbol.iterator] = valuesBackwards;
    }

    // Iterate through all highlighted tabs
    for (let tab of highlighted) {
      let index = tab.index;
      do {
        index = (wnd.tabs.length + index + direction) % wnd.tabs.length;
      } while (tab.pinned !== wnd.tabs[index].pinned);
      if (tab.id != null) {
        browser.tabs.move(tab.id, { index });
      }
    }
  });
}

/**
 * Iterates backwards over an array.
 * Does not handle sparse arrays in a special way, just like
 * the original iterator.
 */
function valuesBackwards<X>(this: X[]): IterableIterator<X> {
  let i = this.length;
  return {
    [Symbol.iterator]() { return this; },
    next: () => {
      --i;
      return {
        done: (i < 0),
        value: this[i],
      };
    }
  };
}

/**
 * Create new window
 */
export function moveToNewWindow(tabs: browser.tabs.Tab[], incognito: boolean) {
  let tabIds = tabs.map(tab => tab.id).filter(isDefined);
  let activeTab = tabs.find(tab => tab.active);

  setTimeout(() => {
    // Use the first tab, so that we don't get a NTP
    browser.windows.create({ tabId: tabIds.shift(), focused: true, incognito }).then(wnd => {
      if (tabIds.length > 0 && activeTab && activeTab.id != null) {
        let activeTabId = activeTab.id;
        browser.tabs.move(tabIds, { windowId: wnd.id, index: -1 }).then(() => {
          browser.tabs.update(activeTabId, { active: true });
        });
      }
    });
  }, 0);
}

/**
 * Move tabs to a target window
 */
export function moveToWindow(tabs: browser.tabs.Tab[], targetWindowId: number) {
  // The tabs can include the active tab
  let activeTab = tabs.find(tab => tab.active);

  // Focus the target window
  browser.windows.update(targetWindowId, { focused: true });

  // Move the tabs
  let tabIds = tabs.map(tab => tab.id).filter(isDefined);
  browser.tabs.move(tabIds, { windowId: targetWindowId, index: -1 }).then(() => {
    if (activeTab == null || activeTab.id == null) {
      return;
    }
    browser.tabs.update(activeTab.id, { active: true });    
  });
}

/**
 * Close all tabs except the current tab
 */
export function closeOthers() {
  Promise.all([
    browser.tabs.getCurrent(),
    browser.windows.getAll({ populate: true })
  ]).then(([sourceTab, windows]) => {
    // Identify the window that hosts the sourceTab
    let sourceWindow: browser.windows.Window | undefined;
    for (var wnd of windows) {
      if (wnd.id === sourceTab.windowId) {
        sourceWindow = wnd;
      } else if (wnd.id != null) {
        // Close other windows
        browser.windows.remove(wnd.id);
      }
    }
    // Close other tabs
    if (sourceWindow != null && sourceWindow.tabs != null) {
      let tabIds = sourceWindow.tabs.map(t => t.id).filter(isDefined).filter(id => id !== sourceTab.id);
      browser.tabs.remove(tabIds);
    }
  });
}

function isDefined<X>(x: (X | null | undefined)): x is X {
  return x != null;
}