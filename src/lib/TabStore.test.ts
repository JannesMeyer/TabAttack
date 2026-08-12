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
});
