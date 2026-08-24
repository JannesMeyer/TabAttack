import React from 'react';
import { useSnapshot } from 'valtio';
import { useTabStore } from '../../lib/TabStoreContext';

export const ScrollToActive = React.memo(() => {
	const store = useTabStore();
	const { initialWindowId, activeTabs } = useSnapshot(store.state);
	const activeTab = initialWindowId != null ? activeTabs.get(initialWindowId) : undefined;
	React.useEffect(() => {
		if (activeTab != null) {
			requestAnimationFrame(() =>
				document.querySelector('.tab.active')?.scrollIntoView({
					block: 'nearest',
					behavior: 'instant',
					container: 'nearest',
				})
			);
		}
	}, [activeTab]);
});
