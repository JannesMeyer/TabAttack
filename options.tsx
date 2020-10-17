import prefs, { Prefs } from './preferences.js';
import getString from './lib/browser/getString.js';
import { getAceThemeList, AceTheme } from './lib/getAceThemes.js';
import css from './lib/css.js';

// Set title
document.title = getString('options');

// Load preferences
Promise.all([prefs.getAll(), getAceThemeList()]).then(([p, tl]) => {
	let themes = tl.themes.slice().sort((a, b) => a.name.localeCompare(b.name));
	ReactDOM.render(<OptionsApp
		prefs={p}
		lightThemes={themes.filter(t => !t.isDark)}
		darkThemes={themes.filter(t => t.isDark)}
	/>, document.querySelector('body > main'));
});

interface P {
	prefs: Prefs;
	lightThemes: AceTheme[];
	darkThemes: AceTheme[];
}

interface S {
	prefs: Prefs;
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

	handleChange<K extends keyof Prefs>(ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: K) {
		let target = ev.target;
		let value = ('checked' in target ? target.checked : target.value);
		this.setPref(field, value);
	}

	setPref<K extends keyof Prefs>(field: K, value: unknown) {
		this.setState(s => {
			let np = { ...s.prefs, [field]: value };
			prefs.set(np);
			return { prefs: np };
		});
	}

	toggleDomainBlacklist = (ev: React.MouseEvent) => {
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

	render() {
		let { props: p, state: s } = this;
		let { prefs } = s;
		if (s.showDomainBlacklist) {
			return <DomainBlacklist
				list={prefs.domainBlacklist}
				onChange={list => this.setPref('domainBlacklist', list)}
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
				<select value={prefs.editorTheme} onChange={ev => this.handleChange(ev, 'editorTheme')}>
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
				<select value={prefs.editorThemeDarkMode} onChange={ev => this.handleChange(ev, 'editorThemeDarkMode')}>
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
				<span>Text Color</span>
				<input type="color" value={prefs.iconColor} onChange={ev => this.handleChange(ev, 'iconColor')} />
			</label>

			<label className="row">
				<span>Text Color - Dark Mode</span>
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

const { useState, useMemo, useCallback } = React;

const DomainBlacklistCSS = css`
& select, & input {
	min-width: 220px;
	box-sizing: border-box;
}
& button {
	min-width: 70px;
	text-align: center;
	vertical-align: bottom;
}
`;

function DomainBlacklist(p: { list: string[], onChange(list: string[]): void, onBack(ev: React.MouseEvent): void }) {
	let list = useMemo(() => new Set(p.list), [p.list]);

	// Add item
	let [text, setText] = useState('');
	let addItem = useCallback((ev: React.FormEvent) => {
		ev.preventDefault();
		let list = p.list.slice();
		list.unshift(text.toLocaleLowerCase());
		setText('');
		p.onChange(list);
	}, [text, p.list, p.onChange]);

	// Remove item(s)
	let [selection, setSelection] = useState<string[]>([]);
	let remove = useCallback(() => {
		for (let value of selection) {
			list.delete(value);
		}
		setSelection([]);
		p.onChange(Array.from(list));
	}, [selection, list, p.onChange]);

	return <div className={DomainBlacklistCSS}>
		<a href="" onClick={p.onBack}>Back</a>
		<h3>Ignore Domains When Exporting Tabs</h3>
		<form onSubmit={addItem}>
			<input autoFocus value={text} onChange={ev => setText(ev.target.value)} />
			<button disabled={list.has(text.toLocaleLowerCase()) || text.trim() === ''}>Add</button>
		</form>
		<p>
			<select
				size={12}
				multiple
				value={selection}
				onChange={ev => setSelection(Array.from(ev.target.selectedOptions, x => x.value))}
			>
				{p.list.map(x => <option key={x}>{x}</option>)}
			</select>
			<button onClick={remove} disabled={selection.length === 0}>Remove</button>
		</p>
	</div>;
}
