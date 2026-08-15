import Fuse from 'fuse.js';
import React from 'react';
import { useSnapshot } from 'valtio';
import { cx } from '../../lib/cx';
import { useTabStore } from '../../lib/TabStoreContext';
import { Tab } from './Tab';

export const SearchResults = ({ windows, query }: { windows: number[]; query: string }) => {
	const store = useTabStore();
	const { tabOrder, tabs } = useSnapshot(store.state);
	const fuse = React.useMemo(() =>
		new Fuse(
			windows.flatMap(windowId =>
				tabOrder.get(windowId)?.map(tabId => {
					const { title, url, audible } = (tabId != null ? tabs.get(tabId) : undefined) ?? {};
					return { windowId, tabId, title, url, keywords: cx({ audible }) };
				}).reverse() ?? []
			),
			{
				keys: ['title', 'url', 'keywords'],
				shouldSort: false,
				useTokenSearch: true,
				tokenMatch: 'all',
				threshold: 0.2,
			},
		), [windows, tabOrder, tabs]);
	return (
		<div className={'active-window'}>
			{fuse.search(query).map(({ item: { tabId, windowId } }) => <Tab key={tabId} tabId={tabId} windowId={windowId} />)}
		</div>
	);
};
