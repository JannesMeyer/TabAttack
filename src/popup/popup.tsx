import './popup.css';
import '../background/reportError';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '../common/helpers/Theme';
import { BrowserAction } from '../types';
import { PopupApp } from './components/PopupApp';
import { TabStore } from './TabStore';

const type = new URLSearchParams(location.search).get('t') as BrowserAction || BrowserAction.Tab;
const html = document.documentElement;
const bgColor = localStorage['background'];
if (bgColor) {
	html.style.backgroundColor = bgColor;
}
html.classList.add(type);

addEventListener('DOMContentLoaded', () => {
	createRoot(document.body.appendChild(document.createElement('main'))).render(<PopupApp store={store} />);
});
const store = new TabStore(type);
const theme = new Theme();
theme.listeners.add(() => {
	const colors = theme.getColors();
	for (const [key, value] of Object.entries(colors)) {
		html.style.setProperty('--' + key.replaceAll('_', '-'), value);
	}
	localStorage['background'] = colors.ntp_background;
	html.style.backgroundColor = colors.ntp_background;
});

if (type === BrowserAction.Dropdown) {
	browser.action.setBadgeText({ windowId: browser.windows.WINDOW_ID_CURRENT, text: null });
}
