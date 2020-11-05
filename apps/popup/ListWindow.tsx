import type { TWindow } from './TabStore.js';
import ListTab from './ListTab.js';
import type { ListTabProps } from './ListTab.js';

interface P extends Pick<ListTabProps, 'onMouseDown' | 'onClick' | 'onAuxClick'> {
	window: TWindow;
	search?: string;
	hideHeader: boolean;
	showURL: boolean;
	selectedTabId?: number;
}

export default function ListWindow(p: P) {
	let w = p.window;
	if (w.type !== 'normal') {
		return null;
	}
	let tabs = React.useMemo(() => w.tabs.slice().reverse(), [w.tabs]);
	if (tabs.length === 0) {
		return null;
	}
	return <>
		{!p.hideHeader && <h1>{tabs.length} Tabs</h1>}
		{tabs.map(tab => <ListTab
			key={tab.id}
			id={tab.id}
			selected={tab.id === p.selectedTabId}
			active={tab.id === w.activeTabId}
			favIconUrl={tab.favIconUrl}
			discarded={tab.discarded}
			status={tab.status}
			title={tab.title}
			url={tab.url}
			audible={tab.audible}
			mutedInfo={tab.mutedInfo}
			pinned={tab.pinned}
			onMouseDown={p.onMouseDown}
			onClick={p.onClick}
			onAuxClick={p.onAuxClick}
			showURL={p.showURL}
			hidden={p.search != null && !`${tab.title} ${tab.url}`.toLocaleLowerCase().includes(p.search)}
		/>)}
	</>;
}
