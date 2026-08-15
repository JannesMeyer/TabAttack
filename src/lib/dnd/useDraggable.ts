import type React from 'react';
import { useCallback } from 'react';
import { useDndManager } from './DndContext';

export interface UseDraggableOptions {
	id: number;
	windowId: number;
	url?: string;
	disabled?: boolean;
	isSelected?: boolean;
	getDragTabIds: () => number[];
	onDragStart?: (tabIds: number[]) => void;
	onTearOff?: (tabIds: number[]) => void;
}

export interface UseDraggableReturn {
	draggable: boolean;
	onDragStart: (ev: React.DragEvent<HTMLElement>) => void;
	onDragEnd: (ev: React.DragEvent<HTMLElement>) => void;
}

export function useDraggable({
	windowId,
	url,
	disabled = false,
	getDragTabIds,
	onDragStart: onDragStartCallback,
	onTearOff,
}: UseDraggableOptions): UseDraggableReturn {
	const manager = useDndManager();

	const handleDragStart = useCallback((ev: React.DragEvent<HTMLElement>) => {
		if (disabled) return;
		const tabIds = getDragTabIds();
		onDragStartCallback?.(tabIds);

		manager.startDrag({
			tabIds,
			windowId,
			url,
			dataTransfer: ev.dataTransfer,
			currentTarget: ev.currentTarget,
		});
	}, [disabled, getDragTabIds, onDragStartCallback, manager, windowId, url]);

	const handleDragEnd = useCallback((ev: React.DragEvent<HTMLElement>) => {
		if (disabled) return;
		const isCancelled = ev.dataTransfer.dropEffect === 'none';
		manager.handleDragEnd(isCancelled);

		if (isCancelled && visualViewport && onTearOff) {
			const { clientX: x, clientY: y } = ev;
			const { offsetLeft: left, offsetTop: top, width, height } = visualViewport;
			if (x < left || y < top || x > (left + width) || y > (top + height)) {
				const tabIds = getDragTabIds();
				onTearOff(tabIds);
			}
		}
	}, [disabled, manager, onTearOff, getDragTabIds]);

	return {
		draggable: !disabled,
		onDragStart: handleDragStart,
		onDragEnd: handleDragEnd,
	};
}
