import './PopupApp.css';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';
import React from 'react';
import { useSnapshot } from 'valtio';
import { useTabStore } from '../../lib/TabStoreContext';
import { throwError } from '../../lib/throwError';
import { Window } from './Window';

export function PopupApp() {
	const store = useTabStore();
	const snap = useSnapshot(store.state);
	const { initialWindowId } = snap;
	const [searchQuery, setSearchQuery] = React.useState('');
	const searchRef = React.useRef<HTMLInputElement>(null);
	React.useEffect(() => {
		const focus = () => searchRef.current?.focus();
		addEventListener('focus', focus);
		setTimeout(() => removeEventListener('focus', focus), 500);
	}, []);
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
						const el = document.querySelector<HTMLElement>('.tab');
						if (el) {
							el.click();
							setSearchQuery('');
						}
					}
					if (ev.key === 'Escape') {
						setSearchQuery('');
					}
				}}
			/>
			<div className={'windows'}>
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
					{Array.from(snap.windows.entries())
						.filter(([, w]) => w.type === 'normal')
						.sort(([a], [b]) => Number(b === initialWindowId) - Number(a === initialWindowId) || b - a).map(([id]) =>
							store.isSingleWindow && id !== initialWindowId ? null : <Window key={id} id={id} searchQuery={searchQuery} />
						)}
				</DragDropProvider>
			</div>
		</>
	);
}

function ensureNumber(value: number | string | undefined): number {
	return typeof value === 'number' ? value : throwError();
}
