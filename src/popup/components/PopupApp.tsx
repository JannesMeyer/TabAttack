import './PopupApp.css';
import { DragDropProvider, PointerSensor } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import React from 'react';
import { useSnapshot } from 'valtio';
import { useTabStore } from '../../lib/TabStoreContext';
import { throwError } from '../../lib/throwError';
import { useGlobalShortcut } from '../../lib/useGlobalShortcut';
import { SearchResults } from './SearchResults';
import { Window } from './Window';

const SENSORS = [PointerSensor];

export function PopupApp({ singleWindow }: { singleWindow: boolean }) {
	const store = useTabStore();
	const { initialWindowId, windows } = useSnapshot(store.state);
	const [searchQuery, setSearchQuery] = React.useState('');
	const dragParentRef = React.useRef<HTMLElement | undefined>(null);
	const searchRef = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		const focus = () => searchRef.current?.focus();
		addEventListener('focus', focus);
		setTimeout(() => removeEventListener('focus', focus), 1000);
	}, []);

	// Keyboard focus navigation
	useGlobalShortcut((k, { target, ctrlKey }) => {
		if (k === 'Escape' || (k === '/' && !isInteractive(target))) {
			return moveFocus(0, { absolute: true });
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
				className={'search'}
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
						setSearchQuery('');
						ev.preventDefault();
						return;
					}
				}}
			/>
			<div className={'windows'}>
				{searchQuery
					? <SearchResults windows={sortedWindows} query={searchQuery} />
					: (
						<DragDropProvider
							sensors={SENSORS}
							onDragStart={ev => dragParentRef.current = ev.operation.source?.element?.parentElement}
							onDragEnd={ev => {
								const dragParent = dragParentRef.current;
								dragParentRef.current = undefined;
								if (ev.canceled) {
									return;
								}
								const { source } = ev.operation;
								if (!isSortable(source)) {
									return;
								}
								const isCrossGroup = source.group !== source.initialGroup;
								if (isCrossGroup) {
									dragParent?.appendChild(source.element ?? throwError());
								}
								if (source.type === 'tab') {
									const windowId = ensureNumber(source.group);
									const index = store.state.tabOrder.get(windowId)!.length - (isCrossGroup ? 0 : 1) - source.index;
									chrome.tabs.move(ensureNumber(source.id), { index, windowId });
									return;
								}
							}}
						>
							{sortedWindows.map(id => singleWindow && id !== initialWindowId ? null : <Window key={id} id={id} />)}
						</DragDropProvider>
					)}
			</div>
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

function ensureNumber(value: number | string | undefined): number {
	return typeof value === 'number' ? value : throwError();
}
