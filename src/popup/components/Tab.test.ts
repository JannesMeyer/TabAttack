import { describe, expect, test } from 'bun:test';
import { calculateDropIndex } from '../util/calculateDropIndex';

describe('Tab calculateDropIndex', () => {
	const order = [10, 20, 30, 40, 50]; // indices 0 to 4. UI reversed: [50, 40, 30, 20, 10]

	test('moving forward in list (drag 50 downwards in UI to top of 30)', () => {
		// Tab 50 is at index 4. Dropped on top of Tab 30 (index 2).
		// We want 50 to be above 30 in UI (between 40 and 30, i.e. index 3 in final array).
		const idx = calculateDropIndex({
			order,
			targetId: 30,
			sourceWindowId: 1,
			targetWindowId: 1,
			draggedIds: [50],
			position: 'top',
		});
		expect(idx).toBe(3);
	});

	test('moving backwards in list (drag 10 upwards in UI to top of 30)', () => {
		// Tab 10 is at index 0. Dropped on top of Tab 30 (index 2).
		// We want 10 to be above 30 in UI (between 40 and 30).
		// Raw index is 2 + 1 = 3. But 10 was at index 0 (< 3).
		// Target index must be 3 - 1 = 2.
		const idx = calculateDropIndex({
			order,
			targetId: 30,
			sourceWindowId: 1,
			targetWindowId: 1,
			draggedIds: [10],
			position: 'top',
		});
		expect(idx).toBe(2);
	});

	test('moving backwards in list (drag 10 upwards in UI to bottom of 30)', () => {
		// Tab 10 is at index 0. Dropped on bottom of Tab 30 (index 2).
		// We want 10 to be below 30 in UI (between 30 and 20).
		// Raw index is 2. Tab 10 was at index 0 (< 2).
		// Target index must be 2 - 1 = 1.
		const idx = calculateDropIndex({
			order,
			targetId: 30,
			sourceWindowId: 1,
			targetWindowId: 1,
			draggedIds: [10],
			position: 'bottom',
		});
		expect(idx).toBe(1);
	});

	test('moving multiple tabs backwards in list', () => {
		// Drag [10, 20] upwards to top of 40 (index 3).
		// Raw index is 3 + 1 = 4.
		// Both 10 and 20 were before index 4 (count = 2).
		// Adjusted index = 4 - 2 = 2.
		const idx = calculateDropIndex({
			order,
			targetId: 40,
			sourceWindowId: 1,
			targetWindowId: 1,
			draggedIds: [10, 20],
			position: 'top',
		});
		expect(idx).toBe(2);
	});

	test('cross-window move does not adjust for source tabs', () => {
		// Moving from Window 2 to Window 1 on top of 30 (index 2).
		// No tabs removed from Window 1, so index is raw 2 + 1 = 3.
		const idx = calculateDropIndex({
			order,
			targetId: 30,
			sourceWindowId: 2,
			targetWindowId: 1,
			draggedIds: [10],
			position: 'top',
		});
		expect(idx).toBe(3);
	});
});
