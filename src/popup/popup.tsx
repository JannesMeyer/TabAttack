import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TabStore } from '../lib/TabStore';
import { TabStoreProvider } from '../lib/TabStoreContext';
import { Theme } from '../lib/Theme';
import { PopupApp } from './components/PopupApp';

export type ActionType = 'sidebar' | 'popup' | 'default';
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
const theme = new Theme();
theme.listeners.add(() => {
	const colors = theme.getColors();
	for (const [key, value] of Object.entries(colors)) {
		html.style.setProperty('--' + key.replaceAll('_', '-'), value);
	}
});
