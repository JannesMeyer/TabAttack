import { describe, expect, test } from 'bun:test';
import { MIME_TYPE } from './constants';
import { createDragGhost } from './dragGhost';

describe('dnd library', () => {
	test('has valid MIME type', () => {
		expect(MIME_TYPE).toBe('application/x-tabattack-tabs');
	});

	test('creates drag ghost element', () => {
		// Mock minimal DOM for headless bun test
		const mockElement = {
			className: '',
			style: {} as Record<string, string>,
			childNodes: [] as any[],
			appendChild(child: any) {
				this.childNodes.push(child);
			},
			querySelectorAll() {
				return this.childNodes;
			},
			getContext() {
				return null;
			},
		};

		(globalThis as any).document = {
			createElement: () => ({ ...mockElement }),
			querySelector: () => null,
		};

		const ghost = createDragGhost([101]);
		expect(ghost.className).toBe('tab-drag-ghost');
	});

	test('DragDropManager tracks lifecycle and cleans up classes', async () => {
		const { DragDropManager } = await import('./DragDropManager');
		const manager = new DragDropManager();

		expect(manager.getActiveDropTarget()).toBeNull();
		manager.cleanup();
		expect(manager.getActiveDropTarget()).toBeNull();
	});
});
