import './PopupApp.css';
import React from 'react';
import { useSnapshot } from 'valtio';
import { DndProvider } from '../../lib/dnd';
import { useTabStore } from '../../lib/TabStoreContext';
import { useGlobalShortcut } from '../../lib/useGlobalShortcut';
import { actionType } from '../popup';
import { ScrollToActive } from './ScrollToActive';
import { SearchResults } from './SearchResults';
import { Window } from './Window';

export function PopupApp() {
	const store = useTabStore();
	const { initialWindowId, windows } = useSnapshot(store.state);
	const [searchQuery, setSearchQuery] = React.useState('');

	// Autofocus the active tab
	React.useEffect(() => {
		const focus = () => document.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
		addEventListener('focus', focus, { once: true });
		// On the new tab page we don't want clicking into the page to cause focus changes.
		// Only "autofocus" or keyboard navigation should cause the focus to change.
		addEventListener('mousedown', cleanup, { once: true });
		return cleanup;
		function cleanup() {
			removeEventListener('focus', focus);
			removeEventListener('mousedown', cleanup);
		}
	}, []);

	// Keyboard focus navigation
	useGlobalShortcut((k, { target, ctrlKey, metaKey }) => {
		if (k === 'Escape') {
			return focus('input');
		}
		if (k === 'ArrowDown') {
			return moveFocus(+1);
		}
		if (k === 'ArrowUp') {
			return moveFocus(-1);
		}

		// Everything below should not apply in interactive inputs
		if (isInteractive(target)) {
			return;
		}

		if (k === ' ') {
			const id = asNumber(getData(document.activeElement)?.tab);
			if (id != null) {
				// TODO: Store highlighted state
			}
			return true;
		}

		if ((k === '/' || k === 'f' || k === 'i')) {
			return focus('input');
		}
		if (k === 'a' && (ctrlKey || metaKey)) {
			if (sortedWindows[0] != null) {
				store.selectAllTabs(sortedWindows[0]);
				return true;
			}
		}
		if (k === 'j') {
			return moveFocus(+1);
		}
		if (k === 'k') {
			return moveFocus(-1);
		}
		if (k === 'd') {
			const id = asNumber(getData(document.activeElement)?.tab);
			if (id != null) {
				moveFocus(1);
				chrome.tabs.remove(id);
				return true;
			}
			return;
		}
		if (k === 'a') {
			return focus('.tab.audible');
		}
	});

	const sortedWindows = React.useMemo(() =>
		Array.from(windows.values())
			.filter(w => w.type === 'normal')
			.map(w => w.id)
			.sort((a, b) => Number(b === initialWindowId) - Number(a === initialWindowId) || b - a), [windows, initialWindowId]);
	return (
		<>
			<div id={'search'}>
				<input
					tabIndex={1}
					type={'search'}
					placeholder={'Search tabs'}
					value={searchQuery}
					onChange={ev => setSearchQuery(ev.target.value)}
					onKeyDown={ev => {
						if (ev.key === 'Enter') {
							document.querySelector<HTMLElement>('.tab')?.click();
							setSearchQuery('');
							ev.preventDefault();
							return;
						}
						if (ev.key === 'Escape') {
							if (actionType === 'popup') {
								close();
							} else {
								setSearchQuery('');
							}
							ev.preventDefault();
							return;
						}
					}}
				/>
			</div>
			<ScrollToActive />
			<DndProvider>
				{searchQuery
					? <SearchResults windows={sortedWindows} query={searchQuery} />
					: <Window id={initialWindowId ?? -1} />}
			</DndProvider>
		</>
	);
}

function isInteractive(target: EventTarget | null) {
	if (!target) {
		return false;
	}
	const { tagName, isContentEditable } = target as HTMLElement;
	return tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable;
}

function getData(el: Element | null) {
	return (el as HTMLElement | null)?.dataset;
}

function asNumber(str: string | undefined) {
	const n = typeof str === 'string' ? Number.parseInt(str, 10) : undefined;
	return n == null || Number.isNaN(n) ? undefined : n;
}

function focus(selector: string) {
	const el = document.querySelector<HTMLElement>(selector);
	if (!el) {
		return false;
	}
	el.focus();
	return true;
}

function moveFocus(to: number, opts?: { absolute?: boolean }) {
	const focusable = document.querySelectorAll<HTMLElement>('input, a[href]');
	const { activeElement } = document;
	const i = activeElement ? Array.prototype.indexOf.call(focusable, activeElement) : -1;
	const next = focusable[opts?.absolute ? to : ((focusable.length + i + to) % focusable.length)];
	if (!next) {
		return false;
	}
	next.focus();
	return true;
}
