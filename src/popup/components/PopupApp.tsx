import './PopupApp.css';
import React from 'react';
import { useSnapshot } from 'valtio';
import { DndProvider } from '../../lib/dnd';
import { useTabStore } from '../../lib/TabStoreContext';
import { useGlobalShortcut } from '../../lib/useGlobalShortcut';
import { actionType } from '../popup';
import { SearchResults } from './SearchResults';
import { Window } from './Window';

export function PopupApp() {
	const store = useTabStore();
	const { initialWindowId, windows } = useSnapshot(store.state);
	const [searchQuery, setSearchQuery] = React.useState('');
	const searchRef = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		const focus = () => searchRef.current?.focus();
		addEventListener('focus', focus);
		setTimeout(() => removeEventListener('focus', focus), 1000);
	}, []);

	// Keyboard focus navigation
	useGlobalShortcut((k, { target, ctrlKey, metaKey }) => {
		if (k === 'Escape') {
			if (store.state.selectedTabIds.size > 0) {
				store.clearSelection();
				return true;
			}
			return moveFocus(0, { absolute: true });
		}
		if (k === '/' && !isInteractive(target)) {
			return moveFocus(0, { absolute: true });
		}
		if (k === 'a' && (ctrlKey || metaKey) && !isInteractive(target)) {
			if (sortedWindows[0] != null) {
				store.selectAllTabs(sortedWindows[0]);
				return true;
			}
		}
		if (k === 'ArrowDown' || (k === 'n' && ctrlKey)) {
			return moveFocus(+1);
		}
		if (k === 'ArrowUp' || (k === 'p' && ctrlKey)) {
			return moveFocus(-1);
		}
	});

	// Scroll into view
	const loaded = initialWindowId != null && windows.size > 0;
	React.useEffect(() => {
		if (loaded) {
			requestAnimationFrame(() =>
				document.querySelector('.tab.active')?.scrollIntoView({
					block: 'nearest',
					behavior: 'instant',
					container: 'nearest',
				})
			);
		}
	}, [loaded]);

	const sortedWindows = React.useMemo(() =>
		Array.from(windows.values())
			.filter(w => w.type === 'normal')
			.map(w => w.id)
			.sort((a, b) => Number(b === initialWindowId) - Number(a === initialWindowId) || b - a), [windows, initialWindowId]);
	return (
		<>
			<input
				ref={searchRef}
				autoFocus
				tabIndex={1}
				id={'search'}
				type={'search'}
				placeholder={'Search'}
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
