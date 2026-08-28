import type { DragManager } from './DragManager';

// const defaultActivationDistance = 2;
export type ID = string | number | symbol | undefined;

export type DraggableOptions = {
	id: ID;
	index: number;
	type?: ID;
	group?: ID;
	data?: unknown;
	onDragStart?: (element: HTMLElement) => void;
	onDragEnd?: (element: HTMLElement) => void;
};

export class Draggable {
	options: DraggableOptions;
	private manager: DragManager;
	private element?: WeakRef<HTMLElement>;
	private drag?: {
		startX: number;
		startY: number;
		rect: DOMRect;
		centerX: number;
		centerY: number;
		index: number;
		group?: Draggable[];
		placeholder?: HTMLElement;
	};

	constructor(options: DraggableOptions, manager: DragManager) {
		this.options = options;
		this.manager = manager;
		this.manager.register(this);
	}

	destroy() {
		this.manager.unregister(this);
	}

	ref = (element: HTMLElement | null | undefined) => {
		if (this.drag) {
			throw new Error('Cannot change element while dragging');
		}
		if (this.element === element) {
			return;
		}
		if (element) {
			this.registerElement(element);
		} else {
			this.clearElement();
		}
	};

	registerElement = (element: HTMLElement) => {
		element.addEventListener('pointerdown', this.onPointerDown);
		element.setAttribute('draggable', 'false');
		this.element = new WeakRef(element);
	};

	clearElement = () => {
		const el = this.element?.deref();
		if (!el) {
			return;
		}
		el.removeEventListener('pointerdown', this.onPointerDown);
		el.removeAttribute('draggable');
		this.element = undefined;
	};

	onPointerDown = (ev: React.PointerEvent | PointerEvent) => {
		const el = this.element?.deref();
		if (!el) {
			return;
		}

		addEventListener('pointermove', this.onPointerMove, { capture: true });
		addEventListener('lostpointercapture', this.cancel, { capture: true });
		addEventListener('click', swallow, { capture: true, once: true });
		el.setPointerCapture(ev.pointerId);
		// TODO: Escape key to cancel drag

		const rect = el.getBoundingClientRect();
		el.style.position = 'fixed';
		el.style.top = rect.top + 'px';
		el.style.left = rect.left + 'px';
		el.style.width = rect.width + 'px';
		el.style.height = rect.height + 'px';
		el.style.willChange = 'transform';

		// Create placeholder
		const placeholder = document.createElement('div');
		placeholder.style.width = rect.width + 'px';
		placeholder.style.height = rect.height + 'px';
		el.parentElement?.insertBefore(placeholder, el);

		this.drag = {
			startX: ev.clientX,
			startY: ev.clientY,
			rect,
			centerX: rect.left + rect.width / 2,
			centerY: rect.top + rect.height / 2,
			index: this.options.index,
			placeholder,
		};

		requestAnimationFrame(() => {
			const { drag } = this;
			if (drag) {
				drag.group = this.manager.getGroup(this);
			}
		});

		this.options.onDragStart?.(el);
	};

	getDimensions() {
		const rect = this.element?.deref()?.getBoundingClientRect();
		return rect?.width && rect?.height ? rect : undefined;
	}

	onPointerMove = (ev: PointerEvent) => {
		const { drag } = this;
		if (!drag) {
			return;
		}
		const dx = ev.clientX - drag.startX;
		const dy = ev.clientY - drag.startY;

		// const cx = drag.centerX + dx;
		// const cy = drag.centerY + dy;

		// if (dx * dx + dy * dy < activationDistance * activationDistance) {
		// 	return;
		// }
		const el = this.element?.deref();
		if (el) {
			el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
		}
	};

	cancel = (event?: PointerEvent) => {
		this.drag?.placeholder?.remove();
		this.drag = undefined;

		const el = this.element?.deref();
		if (!el) {
			return;
		}
		removeEventListener('pointermove', this.onPointerMove, { capture: true });
		removeEventListener('lostpointercapture', this.cancel, { capture: true });
		setTimeout(() => {
			removeEventListener('click', swallow, { capture: true });
		});

		if (event) {
			el.releasePointerCapture(event.pointerId);
		}
		el.style = '';
		this.options.onDragEnd?.(el);
	};
}

function swallow(event: Event) {
	event.preventDefault();
	event.stopPropagation();
}
