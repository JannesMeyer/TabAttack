import { useSortable } from '@dnd-kit/react/sortable';
import * as React from 'react';
import { useSnapshot } from 'valtio';
import { cx } from '../../lib/cx';
import { useTabStore } from '../../lib/TabStoreContext';
import { AudibleIcon } from './icons/AudibleIcon';
import { MutedIcon } from './icons/MutedIcon';
import { TabIcon } from './TabIcon';

const self = location.href;

type Props = {
	tabId: number | undefined;
	index: number;
	windowId: number;
};

export { memo as Tab };
const memo = React.memo(function Tab({ tabId = chrome.tabs.TAB_ID_NONE, index, windowId }: Props) {
	const store = useTabStore();
	const snap = useSnapshot(store.state);
	const tab = snap.tabs.get(tabId);
	const { ref, isDragging } = useSortable({
		id: tabId,
		index,
		type: 'tab',
		accept: 'tab',
		group: windowId,
	});
	if (!tab) {
		return <div>ERROR: {tabId} not found</div>;
	}
	return (
		<a
			ref={ref}
			onPointerUp={ev => {
				if (!visualViewport) {
					return;
				}
				const { clientX: x, clientY: y } = ev;
				const { offsetLeft: left, offsetTop: top, width, height } = visualViewport;
				if (x < left || y < top || x > (left + width) || y > (top + height)) {
					chrome.windows.create({ tabId });
				}
			}}
			onClick={ev => {
				ev.preventDefault();
				chrome.tabs.update(tabId, { active: true });
				chrome.windows.update(windowId, { focused: true });
			}}
			onAuxClick={(ev) => {
				if (ev.button === 1) {
					ev.preventDefault();
					chrome.tabs.remove(tabId);
				}
			}}
			href={tab.url}
			className={cx('tab', {
				active: snap.activeTabs.get(windowId) === tabId,
				dragging: isDragging,
				pinned: tab.pinned,
				discarded: tab.discarded,
				attention: tab.attention,
			})}
		>
			<TabIcon className={'favicon'} loading={tab.status === 'loading' && tab.url !== self} favIconUrl={tab.favIconUrl} url={tab.url} />
			{(tab.audible || tab.mutedInfo?.muted) && (
				<div
					style={{ display: 'flex' }}
					onClick={ev => {
						ev.preventDefault();
						ev.stopPropagation();
						chrome.tabs.update(tabId, { muted: !tab.mutedInfo?.muted });
					}}
				>
					{tab.mutedInfo?.muted ? <MutedIcon /> : <AudibleIcon />}
				</div>
			)}
			<span className={'title'}>{tab.title}</span>
		</a>
	);
});
