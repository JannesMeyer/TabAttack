import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { cx } from '../../lib/css';
import { BrowserAction } from '../../types';
import { TabStore } from '../TabStore';
import { WindowTabList } from './WindowTabList';
import { WindowTitle } from './WindowTitle';

export function PopupApp({ store }: { store: TabStore }) {
	const windows = store.useWindows();
	const activeWindowId = store.getActiveWindowId();
	return (
		<DragDropContext
			onDragEnd={({ source, destination, draggableId, type }) => {
				if (!destination || source.droppableId === destination.droppableId && source.index === destination.index) {
					return;
				}
				const id = parseInt(draggableId);
				if (type === 'WINDOW') {
					store.moveWindow({ sourceIndex: source.index, targetIndex: destination.index });
					return;
				}
				if (type === 'TAB') {
					store.moveTab({
						tabId: id,
						sourceWindowId: parseInt(source.droppableId),
						targetWindowId: parseInt(destination.droppableId),
						sourceIndex: source.index,
						targetIndex: destination.index,
					});
					return;
				}
				throw new Error(`Unknown drag type: ${type}`);
			}}
		>
			<Droppable droppableId='windows' type='WINDOW' direction='horizontal'>
				{provided => (
					<div {...provided.droppableProps} className={'WindowList'} ref={provided.innerRef}>
						{store.type === BrowserAction.Tab
							? (
								windows.map((w, index) => (
									<Draggable key={w.id} draggableId={`${w.id} :window`} index={index}>
										{provided => (
											<div {...provided.draggableProps} ref={provided.innerRef} className={cx('Window', { active: w.id === activeWindowId })}>
												<WindowTitle {...provided.dragHandleProps} id={w.id} incognito={w.incognito} store={store} />
												<WindowTabList window={w} activeWindowId={activeWindowId} store={store} />
											</div>
										)}
									</Draggable>
								))
							)
							: (
								<div className={cx('Window', 'active')}>
									<WindowTabList
										window={windows.find(w => w.id === activeWindowId)}
										activeWindowId={activeWindowId}
										store={store}
									/>
								</div>
							)}
						{provided.placeholder}
					</div>
				)}
			</Droppable>
		</DragDropContext>
	);
}
