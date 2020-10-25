import '../../lib/Array.extensions.js';
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

let q = UrlQuery.fromString();
let t = q.getString('t');
let type = PopupType.Default;
if (t === PopupType.ExternalPopup || t === PopupType.ActionPopup || t === PopupType.Sidebar) {
	type = t;
}
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
	ReactDOM.render(<PopupApp	type={type}	openerWindowId={openerWindowId}	/>, el);
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
		let { oneWindow } = this;
		TabStore.init(!oneWindow, (oneWindow ? undefined : p.openerWindowId)).then(() => this.forceUpdate());
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
		addEventListener('focus', this.handleFocus);
		addEventListener('blur', this.handleBlur);
		addEventListener('keydown', this.handleKeyDown);

		// Clean this up in componentWillUnmount?
		addEventListener('beforeunload', this.handlePageHide);
	}

	componentWillUnmount() {
		TabStore.listeners.clear();
		removeEventListener('focus', this.handleFocus);
		removeEventListener('blur', this.handleBlur);
		removeEventListener('keydown', this.handleKeyDown);
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

	private handleKeyDown = (ev: KeyboardEvent) => {
		let key = ev.key;

		if ((ev.target as Element).tagName === 'INPUT') {
			if (key === 'ArrowDown') {
				ev.preventDefault();
				// this.moveSelection(-1);

			} else if (key === 'ArrowUp') {
				ev.preventDefault();
				// this.moveSelection(+1);

			} else if (key === 'Escape') {
				ev.preventDefault();
				this.handleSearchToggle();
			}

			// No keyboard shortcuts while writing except the above
			return;
		}

		if (key === 'Escape') {
			close();

		} else if (key === 'ArrowDown' || key === 'j') { // Select next tab
			ev.preventDefault();
			// this.moveSelection(-1);
			
		} else if (key === 'ArrowUp' || key === 'k') { // Select previous tab
			ev.preventDefault();
			// this.moveSelection(+1);

		} else if (key === 'Tab') { // Select next/previous tab
			ev.preventDefault();
			// this.moveSelection(ev.shiftKey ? +1 : -1);  

		} else if (key === 'End') { // Select topmost tab
			ev.preventDefault();
			// this.moveSelectionTo(0);

		} else if (key === 'Home') { // Select bottommost tab
			ev.preventDefault();
			// this.moveSelectionTo(Infinity);

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
			let selectedTab = TabStore.getTabs().get(this.state.selectedTabId);
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
			this.handleExport();
		}
	};

	// private moveSelection(x: number, wrapsAround = true) {
	// 	let { windows } = this.props;
	// 	if (windows == null) {
	// 		throw new Error('No tabs available');
	// 	}
	// 	let selected = this.state.selectedTabId;
	// 	let tabs = windows.map(wnd => wnd.tabs).filter(isDefined).flat();
	// 	tabs.reverse();
	// 	let selectedIndex = tabs.findIndex(t => t.id === selected);
	// 	if (selectedIndex < 0) {
	// 		throw new Error('Selected tab not found');
	// 	}
	// 	let nextIndex = (selectedIndex + x);
	// 	if (wrapsAround) {
	// 		nextIndex = (nextIndex + tabs.length) % tabs.length;
	// 	} else if (nextIndex < 0) {
	// 		nextIndex = 0;
	// 	} else if (nextIndex > tabs.length - 1) {
	// 		nextIndex = tabs.length - 1;
	// 	}
	// 	let nextTab = tabs[nextIndex];
	// 	if (nextTab == null || nextTab.id == null) {
	// 		throw new Error('Next tab not found');
	// 	}
	// 	this.setState({ selectedTabId: nextTab.id });
	// }

	private endActionPopup() {
		(this.props.type === PopupType.ActionPopup) && close();
	}

	private activateTab(id: number | undefined) {
		if (id == null) {
			return;
		}
		browser.tabs.update(id, { active: true }).catch(logError);
		this.endActionPopup();
	}

	private closeTab(id: number | undefined) {
		if (id == null) {
			return;
		}
		browser.tabs.remove(id).catch(logError);
	}

	// private moveSelectionTo(index: number) {
	// 	let { windows } = this.props;
	// 	if (this.state.selectedTabId == null) {
	// 		return;
	// 	}
	// 	if (windows == null) {
	// 		throw new Error('No tabs available');
	// 	}
	// 	let tabs = windows.map(wnd => wnd.tabs).filter(isDefined).flat();
	// 	tabs.reverse();
	// 	if (index === Infinity) {
	// 		index = (tabs.length - 1);
	// 	}
	// 	let selected = tabs[index];
	// 	if (selected == null || selected.id == null) {
	// 		throw new Error('Index out of bounds');
	// 	}
	// 	this.setState({ selectedTabId: selected.id });
	// }

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
		openTabsEditor({});
		this.endActionPopup();
	};

	private handleImport = () => {
		openTabsEditor({ import: true });
		this.endActionPopup();
	};

	private handleUrlToggle = () => {
		this.setState(s => ({ showURL: !s.showURL }));
	};

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
