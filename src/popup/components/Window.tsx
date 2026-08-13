import { CollisionPriority } from '@dnd-kit/abstract';
import { useDroppable } from '@dnd-kit/react';
import React from 'react';
import { useSnapshot } from 'valtio';
import { cx } from '../../lib/cx';
import { useTabStore } from '../../lib/TabStoreContext';
import { Tab } from './Tab';

type Props = {
	id: number;
	searchQuery: string;
};

export { memo as Window };
const memo = React.memo(function Window({ id: windowId, searchQuery }: Props) {
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
					searchQuery={searchQuery}
				/>
			))}
		</div>
	);
});
