export const BrowserAction = {
	Dropdown: 'dropdown',
	Sidebar: 'sidebar',
	Tab: 'tab',
	Background: 'background',
	ExportTabs: 'export-tabs',
} as const;

export type BrowserAction = (typeof BrowserAction)[keyof typeof BrowserAction];
