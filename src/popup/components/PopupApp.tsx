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
		if (document.hasFocus()) {
			focus();
			return;
		}
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
	useGlobalShortcut((k, ev) => {
		// Prevent browser dialogs for shortcuts that might be used to open the popup in the first place
		if (actionType === 'popup' && (ev.ctrlKey || ev.metaKey) && (k === 'p' || k === 's')) {
			focusTab(1);
			ev.preventDefault();
			return;
		}

		const { ctrlKey } = ev;
		const interactive = isInteractive(ev.target);
		if (k === 'ArrowDown' || (!interactive || ctrlKey) && k === 'j') {
			return focusTab(+1);
		}
		if (k === 'ArrowUp' || (!interactive || ctrlKey) && k === 'k') {
			return focusTab(-1);
		}
		if (k === 'ArrowRight' || (!interactive || ctrlKey) && k === 'l') {
			getActionTab()?.click();
			return true;
		}

		// Everything below should not apply in interactive inputs
		if (interactive) {
			return;
		}
		if (k === ' ') {
			const id = asNumber(getData(getActionTab())?.tab);
			if (id != null) {
				// TODO: Store highlighted state
			}
			return true;
		}
		if (k === '/' || k === 'f') {
			return focus('input');
		}
		if (k === 'd') {
			const id = asNumber(getData(document.activeElement)?.tab);
			if (id != null) {
				chrome.tabs.remove(id);
				return true;
			}
			return;
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

function getActionTab() {
	const active = document.activeElement as HTMLElement | null;
	if (active?.classList.contains('tab')) {
		return active;
	}
	return document.querySelector<HTMLElement>('.tab.active');
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

function focusTab(to: number, opts?: { absolute?: boolean }) {
	const focusable = document.querySelectorAll<HTMLElement>('.tab');
	const i = Array.prototype.indexOf.call(focusable, getActionTab());
	const next = focusable[opts?.absolute ? to : ((focusable.length + i + to) % focusable.length)];
	if (!next) {
		return false;
	}
	next.focus();
	return true;
}
