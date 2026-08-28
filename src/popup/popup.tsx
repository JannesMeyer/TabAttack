import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { subscribe } from 'valtio';
import { TabStore } from '../lib/TabStore';
import { TabStoreProvider } from '../lib/TabStoreContext';
import { type ActionType, Theme } from '../lib/Theme';
import { PopupApp } from './components/PopupApp';

export const actionType = new URLSearchParams(location.search).get('t') as ActionType || 'default';

const html = document.documentElement;
html.classList.add(actionType);

const store = new TabStore();

addEventListener('DOMContentLoaded', () => {
	createRoot(document.body.appendChild(document.createElement('main'))).render(
		<StrictMode>
			<TabStoreProvider value={store}>
				<PopupApp />
			</TabStoreProvider>
		</StrictMode>,
	);
});

// TODO: Load custom CSS from localStorage
const theme = new Theme(actionType);
subscribe(theme.colors, () => {
	for (const [key, value] of Object.entries(theme.colors)) {
		html.style.setProperty('--' + key.replaceAll('_', '-'), value);
	}
});
