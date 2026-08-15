import React, { useLayoutEffect } from 'react';
import { useSnapshot } from 'valtio';
import { useDndManager, useDroppable } from '../../lib/dnd';
import { useTabStore } from '../../lib/TabStoreContext';
import { calculateDropIndex } from '../util/calculateDropIndex';
import { Tab } from './Tab';

export { d as Window };
const d = React.memo(function Window({ id: windowId }: { id: number }) {
	const store = useTabStore();
	const { tabOrder } = useSnapshot(store.state);
	const manager = useDndManager();

	const currentOrder = tabOrder.get(windowId);

	useLayoutEffect(() => {
		manager.cleanupOnDrop();
	}, [currentOrder, manager]);

	const {
		onDragOver,
		onDragLeave,
		onDrop,
	} = useDroppable({
		id: `window-${windowId}-container`,
		windowId,
		calculatePosition: false,
		onDrop: (payload, _pos, activeDropTarget) => {
			const order = store.state.tabOrder.get(windowId) ?? [];
			if (activeDropTarget != null && typeof activeDropTarget.id === 'number') {
				const targetIndex = calculateDropIndex({
					order,
					targetId: activeDropTarget.id,
					sourceWindowId: payload.sourceWindowId,
					targetWindowId: windowId,
					draggedIds: payload.tabIds,
					position: activeDropTarget.position,
				});
				if (targetIndex !== -1) {
					const isSameWindow = payload.sourceWindowId === windowId;
					const isNoOp = isSameWindow && payload.tabIds.every((id, idx) => order[targetIndex + idx] === id);
					if (isNoOp) {
						manager.cleanupOnDrop();
					} else {
						chrome.tabs.move(payload.tabIds, { windowId, index: targetIndex });
					}
					store.clearSelection();
					return;
				}
			}
			chrome.tabs.move(payload.tabIds, { windowId, index: 0 });
			store.clearSelection();
		},
	});

	return (
		<div
			tabIndex={-1}
			className={'active-window'}
			data-window={windowId}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={ev => {
				if (ev.target === ev.currentTarget) {
					onDrop(ev);
				}
			}}
		>
			{tabOrder.get(windowId)?.toReversed().map((tabId, index) => (
				<Tab
					key={tabId}
					tabId={tabId}
					index={index}
					windowId={windowId}
				/>
			))}
		</div>
	);
});
