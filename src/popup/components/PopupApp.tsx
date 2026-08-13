import './PopupApp.css';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import React from 'react';
import { useSnapshot } from 'valtio';
import { useTabStore } from '../../lib/TabStoreContext';
import { throwError } from '../../lib/throwError';
import { SearchResults } from './SearchResults';
import { Window } from './Window';

export function PopupApp({ singleWindow }: { singleWindow: boolean }) {
	const store = useTabStore();
	const { initialWindowId, windows } = useSnapshot(store.state);
	const [searchQuery, setSearchQuery] = React.useState('');
	const searchRef = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		const focus = () => searchRef.current?.focus();
		addEventListener('focus', focus);
		setTimeout(() => removeEventListener('focus', focus), 500);
	}, []);
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
						return;
					}
					if (ev.key === 'Escape') {
						setSearchQuery('');
						return;
					}
				}}
			/>
			<div className={'windows'}>
				{searchQuery
					? <SearchResults windows={sortedWindows} query={searchQuery} />
					: (
						<DragDropProvider
							onDragEnd={ev => {
								if (ev.canceled) return;
								const { source } = ev.operation;
								if (!isSortable(source)) {
									return;
								}
								if (source.type === 'tab') {
									const windowId = ensureNumber(source.group);
									const index = store.state.tabOrder.get(windowId)!.length - (source.group !== source.initialGroup ? 0 : 1) - source.index;
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

function ensureNumber(value: number | string | undefined): number {
	return typeof value === 'number' ? value : throwError();
}
