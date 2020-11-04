import syncPrefs from '../syncPrefs.js';
import getString from '../../lib/browser/getString.js';
import { getAceThemeList } from '../../lib/getAceThemes.js';
import type { AceTheme } from '../../lib/getAceThemes.js';
import css from '../../lib/css.js';
import debounce from '../../lib/debounce.js';
import PopupType from '../popup/PopupType.js';
import { isFirefox } from '../../lib/browser/runtime.js';
import DomainBlacklist from './DomainBlacklist.js';

type SyncPrefs = typeof syncPrefs.defaults;

// Set title
document.title = getString('options');

const savePrefs = debounce(syncPrefs.set.bind(syncPrefs), 200);

// Load preferences
Promise.all([syncPrefs.getAll(), getAceThemeList()]).then(([p, tl]) => {
	let themes = tl.themes.slice().sort((a, b) => a.name.localeCompare(b.name));
	ReactDOM.render(<OptionsApp
		prefs={p}
		lightThemes={themes.filter(t => !t.isDark)}
		darkThemes={themes.filter(t => t.isDark)}
	/>, document.querySelector('body > main'));
});

interface P {
	prefs: SyncPrefs;
	lightThemes: AceTheme[];
	darkThemes: AceTheme[];
}

interface S {
	prefs: SyncPrefs;
	showDomainBlacklist: boolean;
}

class OptionsApp extends React.Component<P, S> {

	constructor(p: P) {
		super(p);
		this.state = {
			prefs: p.prefs,
			showDomainBlacklist: false,
		};
	}

	private handleChange<K extends keyof SyncPrefs>({ target }: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: K) {
		let value = (target.type === 'checkbox' ? ('checked' in target ? target.checked : false) : target.value);
		this.setPref(field, value);
	}

	private setPref<K extends keyof SyncPrefs>(field: K, value: unknown) {
		this.setState(s => {
			let prefs = { ...s.prefs, [field]: value };
			savePrefs(prefs);
			return { prefs };
		});
	}

	private toggleDomainBlacklist = (ev: React.MouseEvent) => {
		ev.preventDefault();
		this.setState(s => ({ showDomainBlacklist: !s.showDomainBlacklist }));
	};

	static readonly css = css`
	:root {
		--in-content-link-color: #0060df;
		--in-content-link-color-hover: #003eaa;
		--in-content-link-color-active: #002275;
	}
	body {
		color: #0c0c0d;
	}
	h3 {
		font-size: 15px;
		font-weight: bold;
		margin-top: 16px;
		margin-bottom: 10px;
		color: inherit;
	}
	h3:first-child {
		margin-top: 8px;
	}
	.row {
		display: block;
		min-height: 28px;
	}
	.row span {
		display: inline-block;
		width: 160px;
		vertical-align: top;
		margin-top: 4px;
	}
	optgroup {
		background-color: #f0f0f0;
		color: inherit;
		font-style: normal;
		font-weight: bold;
	}
	option {
		background-color: #fff;
		color: inherit;
		font-style: normal;
	}
	input[type=checkbox] {
		vertical-align: -10%;
		margin: 0 4px 0 0;
	}
	a {
		color: var(--in-content-link-color);
		text-decoration: none;
	}
	a:hover {
		color: var(--in-content-link-color-hover);
		text-decoration: underline;
	}
	a:active {
		color: var(--in-content-link-color-active);
		text-decoration: none;
	}
	@media (prefers-color-scheme: dark) {
		body {
			background: #3b3b3b;
			color: #a7a7a7;
		}
		h3 {
			color: white;
		}
	}`;

	handleBlacklistChange = (list: string[]) => {
		this.setPref('domainBlacklist', list);
	};

	render() {
		let { props: p, state: s } = this;
		let { prefs } = s;
		if (s.showDomainBlacklist) {
			return <DomainBlacklist
				list={prefs.domainBlacklist}
				onChange={this.handleBlacklistChange}
				onBack={this.toggleDomainBlacklist}
			/>;
		}
		return <>
			<h3>{getString('options_export')}</h3>

			<label className="row">
				<span>Ignore Domains</span>
				<a href="" onClick={this.toggleDomainBlacklist}>{prefs.domainBlacklist.length} domain(s)</a>
			</label>

			<label className="row">
				<span>Ignore Pinned Tabs</span>
				<input type="checkbox" checked={prefs.ignorePinned} onChange={ev => this.handleChange(ev, 'ignorePinned')} />
			</label>

			<label className="row">
				<span>Export Format</span>
				<select value={prefs.format} onChange={ev => this.handleChange(ev, 'format')} style={{ width: 121 }}>
					<option value="markdown">Markdown</option>
					<option value="json">JSON</option>
				</select>
			</label>

			<label className="row">
				<span>Color Scheme</span>
				<select value={prefs.editorTheme} onChange={ev => this.handleChange(ev, 'editorTheme')} style={{ width: 203 }}>
					<optgroup label="Light">
						{p.lightThemes.map(t =>	<option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
					<optgroup label="Dark">
						{p.darkThemes.map(t => <option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
				</select>
			</label>

			<label className="row">
				<span>Color Scheme - Dark Mode</span>
				<select value={prefs.editorThemeDarkMode} onChange={ev => this.handleChange(ev, 'editorThemeDarkMode')} style={{ width: 203 }}>
					<optgroup label="Light">
						{p.lightThemes.map(t =>	<option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
					<optgroup label="Dark">
						{p.darkThemes.map(t => <option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
				</select>
			</label>

			<h3>Icon</h3>

			<label className="row">
				<span>Click Action</span>
				<select value={prefs.browserAction} onChange={ev => this.handleChange(ev, 'browserAction')} style={{ width: 203 }}>
					<option value={PopupType.ActionPopup}>Tab Switcher (Popup)</option>
					{isFirefox && <option value={PopupType.Sidebar}>Tab Switcher (Sidebar)</option>}
					<option value={PopupType.ExternalPopup}>Tab Switcher (Window)</option>
					<option value={PopupType.DirectExport}>Export Tabs</option>
				</select>
			</label>
			
			<label className="row">
				<span>Color</span>
				<input type="color" value={prefs.iconColor} onChange={ev => this.handleChange(ev, 'iconColor')} />
			</label>

			<label className="row">
				<span>Color - Dark Mode</span>
				<input type="color" value={prefs.iconColorDarkMode} onChange={ev => this.handleChange(ev, 'iconColorDarkMode')} />
			</label>

			<h3>Context Menu Items</h3>

			<div className="row">
				<label>
					<input type="checkbox" checked={prefs.showCopyLinkAsMarkdown} onChange={ev => this.handleChange(ev, 'showCopyLinkAsMarkdown')} />
					{getString('options_show_copy_link')}
				</label>
			</div>

			<div className="row">
				<label>
					<input type="checkbox" checked={prefs.showCopyPageAsMarkdown} onChange={ev => this.handleChange(ev, 'showCopyPageAsMarkdown')} />
					{getString('options_show_copy_page')}
				</label>
			</div>

		</>;
	}
}
