import type React from 'react';
import { useCallback } from 'react';
import { MIME_TYPE } from './constants';
import { useDndManager } from './DndContext';
import type { ActiveDropTarget, DropPosition, TabDragPayload } from './types';

export interface UseDroppableOptions {
	id: number | string;
	windowId: number;
	disabled?: boolean;
	calculatePosition?: boolean;
	onDrop: (payload: TabDragPayload, position?: DropPosition, activeDropTarget?: ActiveDropTarget | null) => void;
}

export interface UseDroppableReturn {
	onDragOver: (ev: React.DragEvent<HTMLElement>) => void;
	onDragLeave: (ev: React.DragEvent<HTMLElement>) => void;
	onDrop: (ev: React.DragEvent<HTMLElement>) => void;
}

export function useDroppable({
	id,
	windowId,
	disabled = false,
	calculatePosition = true,
	onDrop: onDropCallback,
}: UseDroppableOptions): UseDroppableReturn {
	const manager = useDndManager();

	const handleDragOver = useCallback((ev: React.DragEvent<HTMLElement>) => {
		if (disabled) return;
		if (ev.dataTransfer.types.includes(MIME_TYPE)) {
			ev.preventDefault();
			ev.dataTransfer.dropEffect = 'move';
			if (calculatePosition) {
				manager.handleDragOver({
					targetId: id,
					targetWindowId: windowId,
					clientY: ev.clientY,
					currentTarget: ev.currentTarget,
				});
			}
		}
	}, [disabled, calculatePosition, manager, id, windowId]);

	const handleDragLeave = useCallback((ev: React.DragEvent<HTMLElement>) => {
		if (!ev.currentTarget.contains(ev.relatedTarget as Node)) {
			if (!calculatePosition) {
				manager.clearShifts();
			}
		}
	}, [calculatePosition, manager]);

	const handleDrop = useCallback((ev: React.DragEvent<HTMLElement>) => {
		if (disabled) return;
		ev.preventDefault();
		ev.stopPropagation();
		const activeDropTarget = manager.getActiveDropTarget();
		const pos = activeDropTarget?.id === id ? activeDropTarget.position : undefined;

		const raw = ev.dataTransfer.getData(MIME_TYPE);
		manager.prepareDrop();

		if (!raw) {
			manager.cleanupOnDrop();
			return;
		}
		try {
			const payload = JSON.parse(raw) as TabDragPayload;
			if (Array.isArray(payload.tabIds) && payload.tabIds.length > 0) {
				onDropCallback(payload, pos, activeDropTarget);
			} else {
				manager.cleanupOnDrop();
			}
		} catch {
			manager.cleanupOnDrop();
		}
	}, [disabled, manager, id, onDropCallback]);

	return {
		onDragOver: handleDragOver,
		onDragLeave: handleDragLeave,
		onDrop: handleDrop,
	};
}
