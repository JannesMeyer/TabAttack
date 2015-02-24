/**
 * Move all highlighted tabs in a window to the left or to the right
 */
export function moveTabs(direction) {
	Chrome.getLastFocusedWindow({ populate: true }).then(wnd => {
		var numTabs = wnd.tabs.length;
		for (var tab of (direction > 0) ? backwards(wnd.tabs) : wnd.tabs) {
			// Opera doesn't have highlighted tabs, so we also check for .active
			if (!tab.highlighted && !tab.active) {
				continue;
			}

			// TODO: make this more efficient with many tabs
			var newIndex = tab.index;
			do {
				// Moving pinned tabs into non-pinned tabs (and vice-versa) is impossible,
				// so we have to skip those indexes
				newIndex = (newIndex + direction + numTabs) % numTabs;
			} while (tab.pinned !== wnd.tabs[newIndex].pinned);

			Chrome.moveTabs(tab.id, { index: newIndex });
		}
	});
}

/**
 * Generator: Iterate backwards over an array
 */
function* backwards(arr) {
  for (var i = arr.length - 1; i >= 0; --i) {
    yield arr[i];
  }
}