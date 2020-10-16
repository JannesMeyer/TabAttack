import Tab from './Tab.js';

interface P {
	selectedTabId?: number;
	tabs: browser.tabs.Tab[];
	focused: boolean;
	id: number;
	hideHeader?: boolean;
	showURL: boolean;
	search?: string;
	onMouseDown?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
	onClick?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
	onAuxClick?(tab: browser.tabs.Tab, event: React.MouseEvent): void;
}

export default class TabGroup extends React.Component<P> {
	
	render() {
		let { props: p } = this;
		let search = p.search && p.search.toLocaleLowerCase();

		return <div key={p.id + ''} className={'Window' + (p.focused ? ' focused' : '')}>
			{!p.hideHeader && <h1>{p.tabs.length} Tabs</h1>}
			<div>
				{p.tabs.map(tab => <Tab
					key={tab.id}
					id={tab.id}
					tab={tab}
					selected={tab.id != null && tab.id === p.selectedTabId}
					active={tab.active}
					favIconUrl={tab.favIconUrl}
					discarded={tab.discarded === true}
					status={tab.status}
					title={tab.title}
					url={tab.url}
					onMouseDown={p.onMouseDown}
					onClick={p.onClick}
					onAuxClick={p.onAuxClick}
					showURL={p.showURL}
					hidden={search != null && !`${tab.title} ${tab.url}`.toLocaleLowerCase().includes(search)}
				/>)}
				{p.tabs.length === 0 && <div style={{ margin: '8px 12px' }}>No results</div>}
			</div>
		</div>;
	}

}
