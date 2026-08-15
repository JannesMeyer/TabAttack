import { describe, expect, test } from 'bun:test';
import { TabStore } from './TabStore';

describe('TabStore with Valtio Map', () => {
	test('initializes with empty window list', () => {
		const store = new TabStore();
		expect(store.state.windows.size).toEqual(0);
	});

	test('updates tab state directly in proxy Map', () => {
		const store = new TabStore();

		store.state.tabs.set(101, {
			url: 'https://example.com',
			status: 'complete',
			title: 'Example',
			mutedInfo: undefined,
			discarded: false,
			audible: false,
			favIconUrl: '',
			pinned: false,
			attention: false,
		});

		expect(store.state.tabs.get(101)?.title).toBe('Example');
	});

	test('manages tab selection and ranges', () => {
		const store = new TabStore();
		store.state.tabOrder.set(1, [10, 20, 30, 40, 50]);

		// Toggle selection
		store.toggleTabSelection(20);
		expect(store.state.selectedTabIds.has(20)).toBe(true);
		expect(store.state.selectedTabIds.size).toBe(1);

		// Range select from 20 to 40
		store.selectTabRange(1, 40);
		expect(store.state.selectedTabIds.has(20)).toBe(true);
		expect(store.state.selectedTabIds.has(30)).toBe(true);
		expect(store.state.selectedTabIds.has(40)).toBe(true);
		expect(store.state.selectedTabIds.has(10)).toBe(false);
		expect(store.state.selectedTabIds.size).toBe(3);

		// Select all
		store.selectAllTabs(1);
		expect(store.state.selectedTabIds.size).toBe(5);

		// Clear selection
		store.clearSelection();
		expect(store.state.selectedTabIds.size).toBe(0);
	});
});
