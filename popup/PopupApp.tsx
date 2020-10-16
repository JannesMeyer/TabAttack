import assertDefined from '../lib/assertDefined.js';
import ready from '../lib/dom/ready.js';
import isDefined from '../lib/isDefined.js';
import logError from '../lib/logError.js';
import markdownLink from '../lib/markdownLink.js';
import writeClipboard from '../lib/writeClipboard.js';
import TabGroup from './TabGroup.js';
import UrlQuery from '../lib/dom/UrlQuery.js';
import css from '../lib/css.js';
import openTabsEditor from '../background/openTabsEditor.js';

ready().then(root => {
	browser.windows.getAll({ windowTypes: ['normal'], populate: true }).then(windows => {
		let q = UrlQuery.fromString();
		let isActionPopup = q.getBoolean('action_popup');
		if (isActionPopup) {
			css`body {
				width: 300px;
				height: 600px;
			}`;
		}
		ReactDOM.render(<PopupApp
			isSidebar={q.getBoolean('sidebar')}
			isActionPopup={isActionPopup}
			windows={windows}
		/>, root);
	});
});

type ChangeInfo = Parameters<Parameters<typeof browser.tabs.onUpdated.addListener>[0]>[1];

interface P {
	windows: browser.windows.Window[];
	isSidebar?: boolean;
	isActionPopup?: boolean;
}

interface S {
	windows: browser.windows.Window[];
	selectedTabId?: number;
	showURL: boolean;
	search?: string;
	focus?: boolean;
}

export default class PopupApp extends React.Component<P, S> {

	constructor(p: P) {
		super(p);

		// Get the active tab of the first window
		let firstWindow = p.windows[0];
		if (firstWindow == null || firstWindow.tabs == null) {
			throw new Error('Window does not have tabs');
		}

		// Reverse tabs
		for (let wnd of p.windows) {
			if (wnd.tabs) {
				wnd.tabs.reverse();
			}
		}

		this.state = {
			windows: p.windows,
			selectedTabId: (p.isSidebar ? undefined : firstWindow.tabs.find(t => t.active)?.id),
			showURL: false,
		};
	}

	componentDidMount() {
		addEventListener('focus', this.handleFocus);
		addEventListener('blur', this.handleBlur);
		addEventListener('keydown', this.handleKeyDown);
		// if (!this.props.isSidebar) {
		//   addMessageListener(this.handleMessage);
		// }
		browser.tabs.onRemoved.addListener(this.handleTabRemoved);
		browser.tabs.onCreated.addListener(this.handleTabCreated);
		browser.tabs.onUpdated.addListener(this.handleTabUpdated);
		browser.tabs.onActivated.addListener(this.handleTabActivated);
		browser.tabs.onMoved.addListener(console.log);
	}

	componentWillUnmount() {
		removeEventListener('keypress', this.handleKeyDown);
		// removeMessageListener(this.handleMessage);
		browser.tabs.onRemoved.removeListener(this.handleTabRemoved);
		browser.tabs.onCreated.removeListener(this.handleTabCreated);
		browser.tabs.onUpdated.removeListener(this.handleTabUpdated);
		browser.tabs.onActivated.removeListener(this.handleTabActivated);
	}

	handleFocus() {
		document.body.classList.remove('inactive');
	}

	handleBlur() {
		document.body.classList.add('inactive');
	}

	// handleMessage = (m: Message) => {
	//   if (m.type === 'selectTab') {
	//     this.setState({ selectedTabId: m.id, search: '' });
	//   }
	// };

	handleTabRemoved = (tabId: number, removeInfo: { windowId: number, isWindowClosing: boolean }) => {
		let { windows } = this.props;
		if (removeInfo.isWindowClosing || windows == null) {
			return;
		}
		for (let wnd of windows) {
			if (wnd.tabs == null) {
				continue;
			}
			let index = wnd.tabs.findIndex(tab => tab.id === tabId);
			if (index === -1) {
				continue;
			}
			wnd.tabs.splice(index, 1);
			this.forceUpdate();
			return;
		}
	};

	handleTabCreated = (tab: browser.tabs.Tab) => {
		let { windows } = this.props;
		if (windows == null) {
			return;
		}
		let wnd = windows.find(w => w.id === tab.windowId);
		if (wnd == null || wnd.tabs == null) {
			return;
		}
		wnd.tabs.unshift(tab);
		this.forceUpdate();
	};

	handleTabUpdated = (tabId: number, changeInfo: ChangeInfo) => {
		let { windows } = this.props;
		if (windows == null) {
			return;
		}
		for (let w of windows) {
			if (w.tabs == null) {
				continue;
			}
			let tab = w.tabs.find(tab => tab.id === tabId);
			if (tab == null) {
				continue;
			}
			Object.assign(tab, changeInfo);
			this.forceUpdate();
			return;
		}
	};

	handleTabActivated = ({ tabId, windowId }: { tabId: number, windowId: number }) => {
		let { windows } = this.props;
		if (windows == null) {
			return;
		}
		// Find the window
		for (let w of windows) {
			if (w.tabs == null || w.id !== windowId) {
				continue;
			}

			let selected: browser.tabs.Tab | undefined;
			for (let tab of w.tabs) {
				// Update all tabs while keeping the old data structure in memory
				if (tab.id === tabId) {
					tab.active = true;
					selected = tab;
				} else {
					tab.active = false;
				}
			}
			// Update the keyboard selection
			if (selected?.id != null && this.state.selectedTabId != null) {
				this.setState({ selectedTabId: selected.id });
			} else {
				this.forceUpdate();
			}
			return;
		}
	};

	findTab(tabId: number): browser.tabs.Tab | undefined {
		return (this.props.windows || []).map(w => w.tabs).filter(isDefined).flat().find(t => t.id === tabId);
	}

	handleKeyDown = (ev: KeyboardEvent) => {
		let key = ev.key;

		if (key === 'Escape') {
			close();
			return;
		}

		if (ev.target === this.searchRef) {
			if (key === 'ArrowDown') {
				ev.preventDefault();
				this.moveSelection(-1);

			} else if (key === 'ArrowUp') {
				ev.preventDefault();
				this.moveSelection(+1);
			}

			// No keyboard shortcuts while writing except the above
			return;
		}

		if (key === 'ArrowDown' || key === 'j') { // Select next tab
			ev.preventDefault();
			this.moveSelection(-1);
			
		} else if (key === 'ArrowUp' || key === 'k') { // Select previous tab
			ev.preventDefault();
			this.moveSelection(+1);

		} else if (key === 'Tab') { // Select next/previous tab
			ev.preventDefault();
			this.moveSelection(ev.shiftKey ? +1 : -1);  

		} else if (key === 'End') { // Select topmost tab
			ev.preventDefault();
			this.moveSelectionTo(0);

		} else if (key === 'Home') { // Select bottommost tab
			ev.preventDefault();
			this.moveSelectionTo(Infinity);

		} else if (key === 'PageDown') { // Select page down
			ev.preventDefault();
			// if (this.selectedTabRef == null) {
			//   throw new Error('Selected item not found');
			// }
			// let itemHeight = this.selectedTabRef.offsetHeight; // Depends on the CSS
			// let moveByItems = (Math.round(innerHeight / itemHeight) - 3);
			// this.moveSelection(moveByItems, false);

		} else if (key === 'PageUp') { // Select page up
			ev.preventDefault();
			// if (this.selectedTabRef == null) {
			//   throw new Error('Selected item not found');
			// }
			// let itemHeight = this.selectedTabRef.offsetHeight; // Depends on the CSS
			// let moveByItems = (Math.round(innerHeight / itemHeight) - 3);
			// this.moveSelection(-moveByItems, false);

		} else if (key === 'Enter' || key === ' ') { // Activate tab
			ev.preventDefault();
			this.activateTab(this.state.selectedTabId);

		} else if (key === 'w') { // Close tab
			ev.preventDefault();
			this.closeTab(this.state.selectedTabId);

		} else if (key === 'c' || key === 'l') { // Copy as markdown link
			ev.preventDefault();
			if (this.state.selectedTabId == null) {
				return;
			}
			let selectedTab = this.findTab(this.state.selectedTabId);
			if (selectedTab == null) {
				return;
			}
			writeClipboard(markdownLink(selectedTab.title, assertDefined(selectedTab.url)));
			// TODO: Show toast "Link copied"

		} else if (key === 'd') { // Discard tab
			ev.preventDefault();
			if (this.state.selectedTabId == null) {
				return;
			}
			browser.tabs.discard(this.state.selectedTabId).catch(logError);

		} else if (key === 'r') {
			ev.preventDefault();
			if (this.state.selectedTabId == null) {
				return;
			}
			browser.tabs.reload(this.state.selectedTabId).catch(logError);

		} else if (key === 'x') {
			this.setState({ showURL: !this.state.showURL });

		} else if (key === '/') {
			ev.preventDefault();
			this.handleSearchToggle();

		} else if (key === 'e') {
			ev.preventDefault();
			openTabsEditor();
			close();
		}
	};

	moveSelection(x: number, wrapsAround = true) {
		let { windows } = this.props;
		if (windows == null) {
			throw new Error('No tabs available');
		}
		let selected = this.state.selectedTabId;
		let tabs = windows.map(wnd => wnd.tabs).filter(isDefined).flat();
		tabs.reverse();
		let selectedIndex = tabs.findIndex(t => t.id === selected);
		if (selectedIndex < 0) {
			throw new Error('Selected tab not found');
		}
		let nextIndex = (selectedIndex + x);
		if (wrapsAround) {
			nextIndex = (nextIndex + tabs.length) % tabs.length;
		} else if (nextIndex < 0) {
			nextIndex = 0;
		} else if (nextIndex > tabs.length - 1) {
			nextIndex = tabs.length - 1;
		}
		let nextTab = tabs[nextIndex];
		if (nextTab == null || nextTab.id == null) {
			throw new Error('Next tab not found');
		}
		this.setState({ selectedTabId: nextTab.id });
	}

	activateTab(id: number | undefined) {
		if (id == null) {
			return;
		}
		browser.tabs.update(id, { active: true }).catch(logError);
		this.props.isActionPopup &&	close();
	}

	closeTab(id: number | undefined) {
		if (id == null) {
			return;
		}
		// TODO: Move selection to an adjacent tab before removing
		browser.tabs.remove(id).catch(logError);
	}

	moveSelectionTo(index: number) {
		let { windows } = this.props;
		if (this.state.selectedTabId == null) {
			return;
		}
		if (windows == null) {
			throw new Error('No tabs available');
		}
		let tabs = windows.map(wnd => wnd.tabs).filter(isDefined).flat();
		tabs.reverse();
		if (index === Infinity) {
			index = (tabs.length - 1);
		}
		let selected = tabs[index];
		if (selected == null || selected.id == null) {
			throw new Error('Index out of bounds');
		}
		this.setState({ selectedTabId: selected.id });
	}

	handleMouseDown = (tab: browser.tabs.Tab, ev: React.MouseEvent) => {
		ev.preventDefault();
		if (tab.id == null) {
			return;
		}
		if (this.state.selectedTabId != null) {
			this.setState({ selectedTabId: tab.id });
		}
	};

	handleClick = (tab: browser.tabs.Tab, ev: React.MouseEvent) => {
		ev.preventDefault();
		if (tab.id == null) {
			return;
		}
		// Left click
		this.activateTab(tab.id);
	};

	handleAuxClick = (tab: browser.tabs.Tab, ev: React.MouseEvent) => {
		if (ev.button === 1) {
			// Middle click
			ev.preventDefault();
			this.closeTab(tab.id);
		}
	};

	handleSearchToggle = () => {
		this.setState(s => ({ search: s.search == null ? '' : undefined }));
	};

	// handleSearchChange = (ev: React.FormEvent) => {
	//   let searchInput = (ev.currentTarget as HTMLInputElement);
	//   this.setState({ search: searchInput.value });
	// };
	
	searchRef: HTMLInputElement | null = null;
	setSearchRef = (ref: HTMLInputElement | null) => {
		this.searchRef = ref;
	};

	static readonly css = css`
	body {
		background: #fcfcfc;
		color: #1a1a1a;
	}
	h1 {
		font-size: 133.3333%;
		margin: 9px 0 4px 12px;
	}
	.WindowList {
		flex-grow: 1;
		overflow-y: auto;
	}
	.SearchInput {
		margin: 8px;
		outline: none;
		border: 1px solid #ddd;
		border-radius: 3px;
		padding: 6px;
		font-family: inherit;
		font-size: 116.6666%;
	}
	.SearchInput:focus {
		border-color: #0a84ff;
	}
	.SearchInput::-moz-placeholder {
		color: #ddd;
		opacity: 1;
	}
	@media (prefers-color-scheme: dark) {
		body {
			background: #0c0c0d;
			color: #9a9a9b;
		}
	}`;

	render() {
		let { props: p, state: s } = this;
		let list = [];
		for (let i = 0; i < s.windows.length; ++i) {
			let w = s.windows[i];
			if (w == null || w.tabs == null || w.id == null) {
				continue;
			}
			if (w.incognito) {
				continue;
			}
			list.push(<TabGroup
				key={w.id}
				id={w.id}
				focused={w.focused}
				onMouseDown={this.handleMouseDown}
				onClick={this.handleClick}
				onAuxClick={this.handleAuxClick}
				selectedTabId={s.selectedTabId}
				tabs={w.tabs}
				hideHeader={p.isSidebar || p.isActionPopup}
				showURL={s.showURL}
				search={s.search}
			/>);
		}
		let items = [
			<div className="WindowList">
				{list}
			</div>,
			s.search != null && <input
				className="SearchInput"
				placeholder="Search tabs"
				value={s.search}
				onChange={ev => this.setState({ search: ev.target.value })}
				onBlur={ev => ev.target.value === '' && this.setState({ search: undefined })}
				autoFocus
				ref={this.setSearchRef}
			/>,
			<div className="ButtonBar">
				<button type="button" onClick={this.handleSearchToggle}>Search</button>
				<button type="button" onClick={() => openTabsEditor()}>Export</button>
			</div>
		];
		return (p.isActionPopup ? items.reverse() : items);
	}
	
	getTab(id: number | undefined) {
		if (id == null) {
			return;
		}
		for (let w of this.state.windows) {
			for (let tab of w.tabs ?? []) {
				if (tab.id === id) {
					return tab;
				}
			}
		}
		return;
	}
}
