import assertDefined from '../lib/assertDefined.js';
import ready from '../lib/dom/ready.js';
import isDefined from '../lib/isDefined.js';
import logError from '../lib/logError.js';
import markdownLink from '../lib/markdownLink.js';
import KeyCode from '../lib/KeyCode.js';
import writeClipboard from '../lib/writeClipboard.js';
import TabGroup from './TabGroup.js';
import UrlQuery from '../lib/dom/UrlQuery.js';
import css from '../lib/css.js';
import openTabsEditor from '../background/openTabsEditor.js';

ready().then(root => {
	browser.windows.getAll({ windowTypes: ['normal'], populate: true }).then(windows => {
		let q = UrlQuery.fromString();
		ReactDOM.render(<PopupApp isSidebar={q.getBoolean('sidebar')} windows={windows} />, root);
	});
});

type ChangeInfo = Parameters<Parameters<typeof browser.tabs.onUpdated.addListener>[0]>[1];

interface P {
	windows: browser.windows.Window[];
	isSidebar?: boolean;
	onGoToLastFocused?(): Promise<browser.windows.Window>;
}

interface S {
	windows: browser.windows.Window[];
	selectedTabId?: number;
	showURL: boolean;
	search?: string;
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
		addEventListener('keypress', this.handleKeyPress);
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
		removeEventListener('keypress', this.handleKeyPress);
		// removeMessageListener(this.handleMessage);
		browser.tabs.onRemoved.removeListener(this.handleTabRemoved);
		browser.tabs.onCreated.removeListener(this.handleTabCreated);
		browser.tabs.onUpdated.removeListener(this.handleTabUpdated);
		browser.tabs.onActivated.removeListener(this.handleTabActivated);
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
		for (let wnd of windows) {
			if (wnd.tabs == null) {
				continue;
			}
			let tab = wnd.tabs.find(tab => tab.id === tabId);
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
		for (let wnd of windows) {
			if (wnd.tabs == null || wnd.id !== windowId) {
				continue;
			}

			let selected: browser.tabs.Tab | undefined;
			for (let tab of wnd.tabs) {
				// Update all tabs while keeping the old data structure in memory
				if (tab.id === tabId) {
					tab.active = true;
					selected = tab;
				} else {
					tab.active = false;
				}
			}
			// Update the keyboard selection
			if (selected?.id != null && !this.props.isSidebar) {
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

	handleKeyPress = (ev: KeyboardEvent) => {
		let key = ev.keyCode || ev.which;
		// console.log('key press', key);

		if (key === KeyCode.B && ev.ctrlKey) { // Ctrl+B
			ev.preventDefault(); // OSX built-in readline shortcut
			this.props.onGoToLastFocused?.().catch(logError);
			return;
		}
		if (key === KeyCode.Escape) { // Focus last window
			this.props.onGoToLastFocused?.().catch(logError);
			return;
		}

		if (ev.target === this.searchRef) {
			if (key === KeyCode.Down) {
				ev.preventDefault();
				this.moveSelection(-1);

			} else if (key === KeyCode.Up) {
				ev.preventDefault();
				this.moveSelection(+1);
			}

			// No keyboard shortcuts while writing except the above
			return;
		}

		if (key === KeyCode.Down || key === KeyCode.J) { // Select next tab
			ev.preventDefault();
			this.moveSelection(-1);
			
		} else if (key === KeyCode.Up || key === KeyCode.K) { // Select previous tab
			ev.preventDefault();
			this.moveSelection(+1);

		} else if (key === KeyCode.Tab) { // Select next/previous tab
			ev.preventDefault();
			this.moveSelection(ev.shiftKey ? +1 : -1);  

		} else if (key === KeyCode.Home) { // Select first tab
			ev.preventDefault();
			this.moveSelectionTo(0);

		} else if (key === KeyCode.End) { // Select last tab
			ev.preventDefault();
			this.moveSelectionTo(Infinity);

		} else if (key === KeyCode.PageDown) { // Select page down
			ev.preventDefault();
			// if (this.selectedTabRef == null) {
			//   throw new Error('Selected item not found');
			// }
			// let itemHeight = this.selectedTabRef.offsetHeight; // Depends on the CSS
			// let moveByItems = (Math.round(innerHeight / itemHeight) - 3);
			// this.moveSelection(moveByItems, false);

		} else if (key === KeyCode.PageUp) { // Select page up
			ev.preventDefault();
			// if (this.selectedTabRef == null) {
			//   throw new Error('Selected item not found');
			// }
			// let itemHeight = this.selectedTabRef.offsetHeight; // Depends on the CSS
			// let moveByItems = (Math.round(innerHeight / itemHeight) - 3);
			// this.moveSelection(-moveByItems, false);

		} else if (key === KeyCode.Enter || key === KeyCode.Space) { // Activate tab
			if (this.state.selectedTabId == null) {
				return;
			}
			ev.preventDefault();
			let tab = this.findTab(this.state.selectedTabId);
			if (tab == null || tab.id == null) {
				return;
			}
			
			// Optimistic update
			this.setState({ selectedTabId: tab.id });

			// Enter focuses the window, Space keeps the window
			if (key === KeyCode.Enter) {
				browser.windows.update(assertDefined(tab.windowId), { focused: true }).catch(logError);
			}
			browser.tabs.update(tab.id, { active: true }).catch(logError);

		} else if (key === KeyCode.W || key === KeyCode.Q) { // Close tab
			if (this.state.selectedTabId == null) {
				return;
			}
			ev.preventDefault();
			browser.tabs.remove(this.state.selectedTabId).catch(logError);

		} else if (key === KeyCode.C || key === KeyCode.L) { // Copy as markdown link
			if (this.state.selectedTabId == null) {
				return;
			}
			ev.preventDefault();
			let selectedTab = this.findTab(this.state.selectedTabId);
			if (selectedTab == null) {
				throw new Error('There is no selected tab');
			}
			writeClipboard(markdownLink(selectedTab.title, assertDefined(selectedTab.url)));
			alert('Link copied');

		} else if (key === KeyCode.D) { // Discard tab
			ev.preventDefault();
			if (this.state.selectedTabId == null) {
				return;
			}
			browser.tabs.discard(this.state.selectedTabId).catch(logError);

		} else if (key === KeyCode.R) {
			if (this.state.selectedTabId == null) {
				return;
			}
			browser.tabs.reload(this.state.selectedTabId).catch(logError);

		} else if (key === KeyCode.X) {
			this.setState({ showURL: !this.state.showURL });

		} else if (key === KeyCode.Slash) {
			ev.preventDefault();
			this.setState({ search: '' });
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
		if (tab.id == null) {
			return;
		}
		if (ev.button === 0) {
			// Left click action
			browser.tabs.update(tab.id, { active: true }).catch(logError);

			// Optimistic update (the event will arrive later)
			if (this.state.selectedTabId != null) {
				this.setState({ selectedTabId: tab.id });
			}
		}
	};

	handleMouseUp = (tab: browser.tabs.Tab, ev: React.MouseEvent) => {
		if (tab.id == null) {
			return;
		}
		if (ev.button === 1) {
			// Middle click action
			browser.tabs.remove(tab.id).catch(logError);
		}
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
		display: block; /* Overwrite Firefox sidebar style */
		background: #fcfcfc;
		color: #1a1a1a;
		font: message-box;
	}
	h1 {
		font-size: 16px;
		margin: 0;
		margin-left: 12px;
		margin-top: 9px;
		margin-bottom: 4px;
	}
	a {
		text-decoration: none;
		color: inherit;
	}
	.WindowList {
		flex-grow: 1;
	}
	.SearchInput {
		display: block;
		margin: 7px;
		border: 1px solid #ddd;
		padding: 6px;
		width: calc(100% - 2 * 7px);
		font: -moz-field;
		font-size: 13px;
		outline: none;
		border-radius: 4px; /* Same as --toolbarbutton-border-radius */
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
			let wnd = s.windows[i];
			if (wnd == null || wnd.tabs == null || wnd.id == null) {
				continue;
			}
			if (wnd.incognito) {
				continue;
			}
			list.push(<TabGroup
				key={wnd.id}
				id={wnd.id}
				focused={wnd.focused}
				onMouseDown={this.handleMouseDown}
				onMouseUp={this.handleMouseUp}
				selectedTabId={s.selectedTabId}
				tabs={wnd.tabs}
				isSidebar={p.isSidebar}
				showURL={s.showURL}
				search={s.search}
			/>);
		}
		return <>
			<div className="WindowList">
				{list}
			</div>
			{s.search != null && <input
				className="SearchInput"
				placeholder="Search tabs"
				value={s.search}
				onChange={x => this.setState({ search: x.target.value })}
				autoFocus
				ref={this.setSearchRef}
			/>}
			<div className="ButtonBar">
				<button type="button" onClick={() => this.setState(s => ({ search: s.search == null ? '' : undefined }))}>Search</button>
				<button type="button" onClick={() => openTabsEditor()}>Export</button>
			</div>
		</>;
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
