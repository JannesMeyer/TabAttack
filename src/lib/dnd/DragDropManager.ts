import { MIME_TYPE } from './constants';
import { createDragGhost, setNativeDragGhost } from './dragGhost';
import type { ActiveDropTarget, DropPosition } from './types';

export class DragDropManager {
	private isDragging = false;
	private isDropping = false;
	private dropTimeout: ReturnType<typeof setTimeout> | null = null;
	private draggedTabIds: number[] = [];
	private sourceWindowId: number = -1;
	private activeTargetId: number | string | null = null;
	private activePosition: DropPosition | null = null;
	private shiftedElements = new Set<HTMLElement>();
	private draggedElements = new Set<HTMLElement>();
	private cachedContainer: HTMLElement | null = null;
	private cachedContainerTop = 0;

	startDrag({
		tabIds,
		windowId,
		url,
		dataTransfer,
		currentTarget,
	}: {
		tabIds: number[];
		windowId: number;
		url?: string;
		dataTransfer: DataTransfer;
		currentTarget: HTMLElement;
	}) {
		this.cleanup();
		this.isDragging = true;
		this.isDropping = false;
		this.draggedTabIds = tabIds;
		this.sourceWindowId = windowId;

		dataTransfer.setData(MIME_TYPE, JSON.stringify({ tabIds, sourceWindowId: windowId }));
		if (url) {
			dataTransfer.setData('text/plain', url);
		}
		dataTransfer.effectAllowed = 'move';

		const ghost = createDragGhost(tabIds, currentTarget);
		setNativeDragGhost(dataTransfer, ghost);

		const applyDragging = () => {
			if (!this.isDragging) return;
			for (const id of tabIds) {
				const el = document.querySelector<HTMLElement>(`[data-tab="${id}"]`);
				if (el) {
					el.dataset.dragging = 'true';
					el.classList.add('dragging');
					this.draggedElements.add(el);
				}
			}
		};

		applyDragging();
		requestAnimationFrame(applyDragging);
		setTimeout(applyDragging, 0);
	}

	handleDragOver({
		targetId,
		targetWindowId,
		clientY,
		currentTarget,
	}: {
		targetId: number | string;
		targetWindowId: number;
		clientY: number;
		currentTarget: HTMLElement;
	}) {
		if (this.isDropping) return;
		if (typeof targetId !== 'number') {
			this.clearShifts();
			this.activeTargetId = targetId;
			this.activePosition = null;
			return;
		}

		const windowContainer = currentTarget.closest<HTMLElement>('.active-window') || currentTarget.parentElement;
		if (!windowContainer) return;

		if (this.cachedContainer !== windowContainer) {
			this.cachedContainer = windowContainer;
			this.cachedContainerTop = windowContainer.getBoundingClientRect().top;
		}

		const relativeY = (clientY - this.cachedContainerTop) + windowContainer.scrollTop;
		const untransformedTop = currentTarget.offsetTop;
		const height = currentTarget.offsetHeight || 30;
		const isTopHalf = (relativeY - untransformedTop) < height / 2;
		const position: DropPosition = isTopHalf ? 'top' : 'bottom';

		if (this.activeTargetId === targetId && this.activePosition === position) {
			return;
		}

		this.activeTargetId = targetId;
		this.activePosition = position;

		const tabs = Array.from(windowContainer.children) as HTMLElement[];
		const targetIndex = tabs.indexOf(currentTarget);
		if (targetIndex === -1) return;

		const isSameWindow = this.isDragging && this.sourceWindowId === targetWindowId;
		const draggedIndex = isSameWindow && this.draggedTabIds.length > 0
			? tabs.findIndex(el => this.draggedTabIds.includes(Number(el.dataset.tab)))
			: -1;

		const insertionIndex = position === 'top' ? targetIndex : targetIndex + 1;
		const nextShifted = new Map<HTMLElement, 'shift-up' | 'shift-down'>();

		if (isSameWindow && draggedIndex !== -1) {
			const effectiveInsertionIndex = draggedIndex < insertionIndex ? insertionIndex - 1 : insertionIndex;

			if (effectiveInsertionIndex < draggedIndex) {
				// Dragged tab moved UP in the visual list: items from effectiveInsertionIndex to draggedIndex - 1 shift DOWN
				for (let i = effectiveInsertionIndex; i < draggedIndex; i++) {
					const el = tabs[i];
					if (el && !this.draggedTabIds.includes(Number(el.dataset.tab))) {
						nextShifted.set(el, 'shift-down');
					}
				}
			} else if (effectiveInsertionIndex > draggedIndex) {
				// Dragged tab moved DOWN in the visual list: items from draggedIndex + 1 to effectiveInsertionIndex shift UP
				for (let i = draggedIndex + 1; i <= effectiveInsertionIndex; i++) {
					const el = tabs[i];
					if (el && !this.draggedTabIds.includes(Number(el.dataset.tab))) {
						nextShifted.set(el, 'shift-up');
					}
				}
			}
		} else {
			// Cross-window drag: all tabs from insertionIndex to end shift DOWN
			for (let i = insertionIndex; i < tabs.length; i++) {
				const el = tabs[i];
				if (el) {
					nextShifted.set(el, 'shift-down');
				}
			}
		}

		// Only mutate elements whose shift state actually changed
		for (const el of this.shiftedElements) {
			if (!nextShifted.has(el)) {
				delete el.dataset.shift;
				el.classList.remove('shift-up', 'shift-down');
			}
		}

		for (const [el, shift] of nextShifted) {
			const shiftVal = shift === 'shift-up' ? 'up' : 'down';
			if (el.dataset.shift !== shiftVal) {
				el.dataset.shift = shiftVal;
				if (shift === 'shift-up') {
					el.classList.add('shift-up');
					el.classList.remove('shift-down');
				} else {
					el.classList.add('shift-down');
					el.classList.remove('shift-up');
				}
			}
		}

		this.shiftedElements = new Set(nextShifted.keys());
	}

	getActiveDropTarget(): ActiveDropTarget | null {
		if (this.activeTargetId == null || this.activePosition == null) {
			return null;
		}
		return {
			id: this.activeTargetId,
			position: this.activePosition,
		};
	}

	prepareDrop() {
		this.isDropping = true;
		this.isDragging = false;
		if (this.dropTimeout) {
			clearTimeout(this.dropTimeout);
		}
		this.dropTimeout = setTimeout(() => {
			this.cleanupOnDrop();
		}, 500);
	}

	cleanupOnDrop() {
		if (this.dropTimeout) {
			clearTimeout(this.dropTimeout);
			this.dropTimeout = null;
		}

		if (!this.isDropping && this.shiftedElements.size === 0 && this.draggedElements.size === 0) {
			return;
		}

		// Suppress CSS transitions so DOM position change on drop is instantaneous
		const allModified = new Set([...this.shiftedElements, ...this.draggedElements]);
		for (const el of allModified) {
			el.dataset.noTransition = 'true';
			el.classList.add('no-transition');
			delete el.dataset.shift;
			delete el.dataset.dragging;
			el.classList.remove('shift-up', 'shift-down', 'dragging');
		}

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				for (const el of allModified) {
					delete el.dataset.noTransition;
					el.classList.remove('no-transition');
				}
			});
		});

		this.shiftedElements.clear();
		this.draggedElements.clear();
		this.isDragging = false;
		this.isDropping = false;
		this.draggedTabIds = [];
		this.sourceWindowId = -1;
		this.activeTargetId = null;
		this.activePosition = null;
	}

	handleDragEnd(isCancelled: boolean) {
		if (this.isDropping) return;
		if (isCancelled) {
			// On cancel, transitions remain active so items smoothly slide back
			this.clearShifts();
		}
		this.cleanup();
	}

	clearShifts() {
		for (const el of this.shiftedElements) {
			delete el.dataset.shift;
			el.classList.remove('shift-up', 'shift-down');
		}
		this.shiftedElements.clear();
		this.activeTargetId = null;
		this.activePosition = null;
	}

	cleanup() {
		if (this.dropTimeout) {
			clearTimeout(this.dropTimeout);
			this.dropTimeout = null;
		}

		for (const el of this.draggedElements) {
			delete el.dataset.dragging;
			el.classList.remove('dragging');
		}
		this.draggedElements.clear();

		for (const el of this.shiftedElements) {
			delete el.dataset.shift;
			delete el.dataset.noTransition;
			el.classList.remove('shift-up', 'shift-down', 'no-transition');
		}
		this.shiftedElements.clear();

		this.isDragging = false;
		this.isDropping = false;
		this.draggedTabIds = [];
		this.sourceWindowId = -1;
		this.activeTargetId = null;
		this.activePosition = null;
		this.cachedContainer = null;
		this.cachedContainerTop = 0;
	}
}
