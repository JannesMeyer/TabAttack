import { DragDropContext } from '@hello-pangea/dnd';
import React from 'react';
import { TabStore } from '../TabStore';
import { Window } from './Window';

// const shortcuts = [
// 	// new KeyCombination('').on(() => close()),
// 	new KeyCombination('ArrowUp').on(() => console.log('selectNext')),
// 	new KeyCombination('ArrowDown').on(() => console.log('selectPrevious')),
// 	new KeyCombination('k').on(() => console.log('selectNext')),
// 	new KeyCombination('j').on(() => console.log('selectPrevious')),
// 	// new KeyCombination('Tab').on(this.selectNext),
// 	// new KeyCombination('Tab', { shift: true }).on(this.selectPrevious),
// 	// new KeyCombination('End').on(this.selectFirst),
// 	// new KeyCombination('Home').on(this.selectLast),
// 	// new KeyCombination('Enter').on(this.activateTab),
// 	// new KeyCombination(' ').on(this.activateTab),
// 	// new KeyCombination('w').on(this.closeTab),
// 	// new KeyCombination('c').on(this.copyAsMarkdownLink),
// 	// new KeyCombination('l').on(this.copyAsMarkdownLink),
// 	// new KeyCombination('d').on(this.discardTab),
// 	// new KeyCombination('r').on(this.reloadTab),
// 	// new KeyCombination('x').on(this.handleUrlToggle),
// 	// new KeyCombination('/').on(this.handleSearchToggle),
// 	// new KeyCombination('e').on(this.handleExport),
// ];

interface PopupAppProps {
	store: TabStore;
}

export function PopupApp({ store }: PopupAppProps) {
	// private copyAsMarkdownLink = (id = this.state.selectedTabId ?? throwError()) => {
	// 	let tab = store.getTabs().get(id) ?? throwError();
	// 	writeClipboard(markdownLink(tab.title, tab.url ?? throwError()));
	// 	showToast('Link copied');
	// 	// TODO: Show toast "Link copied"
	// };

	// private reloadTab = (id = this.state.selectedTabId) => {
	// 	if (id == null) return;
	// 	chrome.tabs.reload(id).catch(logError);
	// };

	// private handleKeyDown = (ev: KeyboardEvent) => {
	// 	this.shortcuts.forEach(k => k.handle(ev));
	// };

	// const searchShortcuts = [
	// 	new KeyCombination('Escape').on(this.handleSearchToggle),
	// ];

	// private selectNext = () => this.moveSelection(+1);
	// private selectPrevious = () => this.moveSelection(-1);
	// private selectFirst = () => this.moveSelectionTo(0);
	// private selectLast = () => this.moveSelectionTo(Infinity);

	const windows = store.useWindows();
	const activeWindowId = store.getActiveWindowId();
	const reverse = true;

	return (
		<DragDropContext
			onDragEnd={({ source, destination, draggableId }) => {
				if (!destination || source.droppableId === destination.droppableId && source.index === destination.index) {
					return;
				}
				store.moveTab({
					tabId: parseInt(draggableId),
					sourceWindowId: parseInt(source.droppableId),
					targetWindowId: parseInt(destination.droppableId),
					reverse,
					sourceIndex: source.index,
					targetIndex: destination.index,
				});
			}}
		>
			{windows.map((w) => <Window key={w.id} window={w} activeWindowId={activeWindowId} reverse={reverse} store={store} />)}
		</DragDropContext>
	);
}
