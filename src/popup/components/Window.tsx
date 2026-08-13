import { CollisionPriority } from '@dnd-kit/abstract';
import { useDroppable } from '@dnd-kit/react';
import React from 'react';
import { useSnapshot } from 'valtio';
import { cx } from '../../lib/cx';
import { useTabStore } from '../../lib/TabStoreContext';
import { Tab } from './Tab';

export { d as Window };
const d = React.memo(function Window({ id: windowId }: { id: number }) {
	const store = useTabStore();
	const { initialWindowId, tabOrder } = useSnapshot(store.state);
	const { ref } = useDroppable({
		id: `${windowId}:droppable`,
		accept: 'tab',
		collisionPriority: CollisionPriority.Low,
	});
	return (
		<div ref={ref} className={cx('window', initialWindowId === windowId && 'active')}>
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
