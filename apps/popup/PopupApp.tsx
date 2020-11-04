import '../../lib/extensions.js';
import assertDefined from '../../lib/assertDefined.js';
import ready from '../../lib/dom/ready.js';
import markdownLink from '../../lib/markdownLink.js';
import writeClipboard from '../../lib/writeClipboard.js';
import UrlQuery from '../../lib/dom/UrlQuery.js';
import css from '../../lib/css.js';
import openTabsEditor from '../background/openTabsEditor.js';
import localPrefs from '../localPrefs.js';
import TabStore from './TabStore.js';
import showToast from '../export/Toast.js';
import ListWindow from './ListWindow.js';
import PopupType from './PopupType.js';
import onMessage from '../../lib/browser/onMessage.js';
import bt = browser.tabs;
import { Key } from '../../lib/KeyCombination.js';

let q = UrlQuery.fromString();
let type = (() => {
	let t = q.getString('t');
	if (t === PopupType.ExternalPopup || t === PopupType.ActionPopup || t === PopupType.Sidebar) {
		return t;
	}
	return PopupType.Default;
})();

if (type === PopupType.ActionPopup) {
	css`body {
		width: 320px;
		height: 520px;
	}`;
}

Promise.all([
	ready(),
	q.getNumber('opener') ?? browser.windows.getCurrent().then(w => w.id),
]).then(([el, openerWindowId]) => {
	ReactDOM.render(<PopupApp type={type} openerWindowId={openerWindowId} />, el);
});

interface P {
	type: PopupType;
	openerWindowId?: number;
}

interface S {
	selectedTabId?: number;
	showURL: boolean;
	search?: string;
	focus?: boolean;
}

class PopupApp extends React.Component<P, S> {

	constructor(p: P) {
		super(p);
		this.state = {
			// selectedTabId: (p.isSidebar ? undefined : p.tm.getFirst()),
			showURL: false,
		};
	}

	get oneWindow() {
		let { type } = this.props;
		return (type === PopupType.ActionPopup || type === PopupType.Sidebar);
	}

	componentDidMount() {
		TabStore.listeners.add(() => this.forceUpdate());
		TabStore.init(!this.oneWindow, this.props.openerWindowId);
		addEventListener('focus', this.handleFocus);
		addEventListener('blur', this.handleBlur);
		addEventListener('keydown', this.handleKeyDown);
		addEventListener('beforeunload', this.handlePageHide);
		if (this.props.type === PopupType.ExternalPopup) {
			onMessage('focusPreviousWindow', () => TabStore.focusPreviousWindow());
		}
	}

	componentWillUnmount() {
		TabStore.listeners.clear();
		removeEventListener('focus', this.handleFocus);
		removeEventListener('blur', this.handleBlur);
		removeEventListener('keydown', this.handleKeyDown);
		removeEventListener('beforeunload', this.handlePageHide);
		onMessage('focusPreviousWindow');
	}

	private handleFocus() {
		document.body.classList.remove('inactive');
	}

	private handleBlur = () => {
		document.body.classList.add('inactive');
		this.handlePageHide();
	};

	/** Save window position */
	private handlePageHide = () => {
		if (this.props.type !== PopupType.ExternalPopup) {
			return;
		}
		// browser.windows.getCurrent() cannot be used because it is async and the browser
		// does not wait for it when unloading the window
		let width = outerWidth;
		let height = outerHeight;
		let top = screenY;
		let left = screenX;
		if (top < 0 || left < 0 || width < 0 || height < 0) {
			return;
		}
		localPrefs.set({ popupWindow: { width, height, top, left } });
	};

	// handleMessage = (m: Message) => {
	//   if (m.type === 'selectTab') {
	//     this.setState({ selectedTabId: m.id, search: '' });
	//   }
	// };

	// Page DOWN
	// if (this.selectedTabRef == null) {
	//   throw new Error('Selected item not found');
	// }
	// let itemHeight = this.selectedTabRef.offsetHeight; // Depends on the CSS
	// let moveByItems = (Math.round(innerHeight / itemHeight) - 3);
	// this.moveSelection(moveByItems, false);

	// Page UP
	// if (this.selectedTabRef == null) {
	//   throw new Error('Selected item not found');
	// }
	// let itemHeight = this.selectedTabRef.offsetHeight; // Depends on the CSS
	// let moveByItems = (Math.round(innerHeight / itemHeight) - 3);
	// this.moveSelection(-moveByItems, false);

	private copyAsMarkdownLink = (id = this.state.selectedTabId) => {
		let tab = TabStore.getTabs().get(id);
		if (tab == null) {
			return;
		}
		writeClipboard(markdownLink(tab.title, assertDefined(tab.url)));
		showToast('Link copied');
		// TODO: Show toast "Link copied"
	};

	private endActionPopup() {
		(this.props.type === PopupType.ActionPopup) && close();
	}

	private activateTab = (id = this.state.selectedTabId) => {
		if (id == null) { return; }
		bt.update(id, { active: true });
		let tab = TabStore.getTabs().get(id);
		if (tab && !this.oneWindow) {
			browser.windows.update(tab.windowId, { focused: true });
		}
		this.endActionPopup();
	};

	private closeTab = (id = this.state.selectedTabId) => {
		if (id == null) { return; }
		bt.remove(id).catch(logError);
	};

	private discardTab = (id = this.state.selectedTabId) => {
		if (id == null) { return; }
		bt.discard(id).catch(logError);
	};

	private reloadTab = (id = this.state.selectedTabId) => {
		if (id == null) { return; }
		bt.reload(id).catch(logError);
	};

	private selectNext = () => this.moveSelection(+1);
	private selectPrevious = () => this.moveSelection(-1);
	private selectFirst = () => this.moveSelectionTo(0);
	private selectLast = () => this.moveSelectionTo(Infinity);

	private moveSelection(_x: number, _wrapsAround = true) {
		// let { windows } = this.props;
		// if (windows == null) {
		// 	throw new Error('No tabs available');
		// }
		// let selected = this.state.selectedTabId;
		// let tabs = windows.map(wnd => wnd.tabs).filter(isDefined).flat();
		// tabs.reverse();
		// let selectedIndex = tabs.findIndex(t => t.id === selected);
		// if (selectedIndex < 0) {
		// 	throw new Error('Selected tab not found');
		// }
		// let nextIndex = (selectedIndex + x);
		// if (wrapsAround) {
		// 	nextIndex = (nextIndex + tabs.length) % tabs.length;
		// } else if (nextIndex < 0) {
		// 	nextIndex = 0;
		// } else if (nextIndex > tabs.length - 1) {
		// 	nextIndex = tabs.length - 1;
		// }
		// let nextTab = tabs[nextIndex];
		// if (nextTab == null || nextTab.id == null) {
		// 	throw new Error('Next tab not found');
		// }
		// this.setState({ selectedTabId: nextTab.id });
	}

	private moveSelectionTo(_index: number) {
		// if (this.state.selectedTabId == null) {
		// 	return;
		// }
		// let tabs = windows.map(wnd => wnd.tabs).filter(isDefined).flat();
		// tabs.reverse();
		// if (index === Infinity) {
		// 	index = (tabs.length - 1);
		// }
		// let selected = tabs[index];
		// if (selected == null || selected.id == null) {
		// 	throw new Error('Index out of bounds');
		// }
		// this.setState({ selectedTabId: selected.id });
	}

	private handleMouseDown = (tabId: number) => {
		if (this.state.selectedTabId != null) {
			this.setState({ selectedTabId: tabId });
		}
	};

	/** Left click activates the tab */
	private handleClick = (tabId: number, ev: React.MouseEvent) => {
		ev.preventDefault();
		this.activateTab(tabId);
	};

	/** Middle click closes the tab */
	private handleAuxClick = (tabId: number, ev: React.MouseEvent) => {
		if (ev.button === 1) {
			ev.preventDefault();
			this.closeTab(tabId);
		}
	};

	private handleSearchToggle = () => {
		this.setState(s => ({ search: s.search == null ? '' : undefined }));
	};

	private handleExport = () => {
		// TODO: set tabId and windowId
		openTabsEditor();
		this.endActionPopup();
	};

	private handleImport = () => {
		openTabsEditor({ import: true }).catch(logError);
		this.endActionPopup();
	};

	private handleUrlToggle = () => this.setState(s => ({ showURL: !s.showURL }));

	private shortcuts = [
		Key('Escape').on(() => close()),
		Key('ArrowUp').on(this.selectNext),
		Key('ArrowDown').on(this.selectPrevious),
		Key('k').on(this.selectNext),
		Key('j').on(this.selectPrevious),
		Key('Tab').on(this.selectNext),
		Key('Tab', { shift: true }).on(this.selectPrevious),
		Key('End').on(this.selectFirst),
		Key('Home').on(this.selectLast),
		Key('Enter').on(this.activateTab),
		Key(' ').on(this.activateTab),
		Key('w').on(this.closeTab),
		Key('c').on(this.copyAsMarkdownLink),
		Key('l').on(this.copyAsMarkdownLink),
		Key('d').on(this.discardTab),
		Key('r').on(this.reloadTab),
		Key('x').on(this.handleUrlToggle),
		Key('/').on(this.handleSearchToggle),
		Key('e').on(this.handleExport),
	];

	private handleKeyDown = (ev: KeyboardEvent) => {
		this.shortcuts.forEach(k => k.handle(ev));
	};

	private searchShortcuts = [
		Key('ArrowUp').on(this.selectNext),
		Key('ArrowDown').on(this.selectPrevious),
		Key('Escape').on(this.handleSearchToggle),
	];

	static readonly css = css`
	.WindowList {
		flex-grow: 1;
		overflow-y: auto;
		background: #fcfcfc;
		color: #1a1a1a;
	}
	.WindowList h1 {
		font-size: 133.3333%;
		margin: 20px 0 4px 12px;
	}
	.WindowList h1:first-child {
		margin-top: 10px;
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
		.WindowList {
			background: #0c0c0d;
			color: #9a9a9b;
		}
	}`;

	render() {
		let { props: p, state: s, oneWindow } = this;
		let search = s.search?.toLocaleLowerCase();
		let windows = Array.from(TabStore.getWindows().values());
		if (!oneWindow) {
			windows.sort((a, b) => b.focusOrder - a.focusOrder);
		} else {
			windows = windows.filter(w => w.id === p.openerWindowId);
		}
		let items = [
			<div className="WindowList" key="WindowList">
				{windows.map(w => <ListWindow
					key={w.id}
					window={w}
					search={search}
					hideHeader={oneWindow}
					showURL={s.showURL}
					selectedTabId={s.selectedTabId}
					onMouseDown={this.handleMouseDown}
					onClick={this.handleClick}
					onAuxClick={this.handleAuxClick}
				/>)}
			</div>,
			s.search != null && <input
				key="SearchInput"
				className="SearchInput"
				placeholder="Search tabs"
				value={s.search}
				onKeyDown={ev => this.searchShortcuts.forEach(k => k.handle(ev))}
				onChange={ev => this.setState({ search: ev.target.value })}
				onBlur={ev => ev.target.value === '' && this.setState({ search: undefined })}
				autoFocus
			/>,
			<div className="ButtonBar" key="ButtonBar">
				<button type="button" onClick={this.handleSearchToggle}>Search</button>
				<button type="button" onClick={this.handleUrlToggle}>{s.showURL ? 'Titles' : 'URLs'}</button>
				<button type="button" onClick={this.handleExport}>Export</button>
				<button type="button" onClick={this.handleImport}>Import</button>
			</div>
		];
		return (p.type === PopupType.ActionPopup ? items.reverse() : items);
	}
}

function logError(error: Error) {
	console.error(error);
	showToast(error.message);
}
