import './popup.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWatch } from '../common/helpers/ThemeWatch';
import { BrowserAction } from '../types';
import { PopupApp } from './components/PopupApp';
import { TabStore } from './TabStore';

const params = new URLSearchParams(location.search);
const type = params.get('t') as BrowserAction || BrowserAction.Tab;
const store = new TabStore(type);
const theme = new ThemeWatch();
const root = document.documentElement;
theme.listeners.add(() => {
	const colors = theme.getColors();
	for (const [key, value] of Object.entries(colors)) {
		root.style.setProperty('--' + key, value);
	}
});
root.classList.add(type);
createRoot(document.body).render(<PopupApp store={store} />);
