import preferences, { Prefs } from './preferences.js';
import getString from './lib/browser/getString.js';
import { getAceThemeList, AceTheme } from './lib/getAceThemes.js';

// Useful for testing purposes:
// browser.storage.sync.clear();
// browser.storage.sync.get().then(console.log);

// Load strings
document.title = getString('options');

// Load preferences
Promise.all([preferences.getAll(), getAceThemeList()]).then(([prefs, tl]) => {
	ReactDOM.render(<OptionsApp
		prefs={prefs}
		lightThemes={tl.themes.filter(t => !t.isDark)}
		darkThemes={tl.themes.filter(t => t.isDark)}
		themesByName={tl.themesByName}
	/>, document.querySelector('body > main'));
});

interface P {
	prefs: Prefs;
	lightThemes: AceTheme[];
	darkThemes: AceTheme[];
	themesByName: { [name: string]: AceTheme };
}

class OptionsApp extends React.Component<P, Prefs> {

	constructor(p: P) {
		super(p);
		this.state = { ...p.prefs };
	}

	componentDidUpdate() {
		preferences.set(this.state);
		// if (os.editorTheme !== this.state.editorTheme) {
		// 	getAceTheme(this.props.themesByName[this.state.editorTheme].theme).then(theme => console.log(theme));
		// }
	}

	handleChange<K extends keyof Prefs>(ev: React.ChangeEvent, field: K) {
		let target: any = ev.target;
		let value = (target.type === 'checkbox' ? target.checked : target.value);
		this.setState({ [field]: value } as any);
	}

	// addDomain = (ev: React.FormEvent) => {
	// 	ev.preventDefault();
	// 	let input = assertDefined(this.domainInput.current);
	// 	let list = this.state.domainBlacklist;

	// 	// Check if the blacklist already contains the domain
	// 	if (list.indexOf(input.value) !== -1) {
	// 		// TODO: Toast instead
	// 		return alert('Already exists');
	// 	}

	// 	// Add the domain to the beginning of the blacklist
	// 	list.unshift(input.value);
	// 	input.value = '';
	// 	this.forceUpdate();
	// };

	// deleteDomain = (index: number, ev: React.MouseEvent) => {
	// 	ev.preventDefault();
	// 	this.state.domainBlacklist.splice(index, 1);
	// 	this.forceUpdate();
	// };

	// domainInput = React.createRef<HTMLInputElement>();

	render() {
		let { props: p, state: s } = this;
		return <>
			<h3>{getString('options_export')}</h3>

			<label className="row">
				<span>Ignore Domains</span>
				<a href="">{s.domainBlacklist.length} domains</a>
			</label>

			<label className="row">
				<span>Ignore Pinned Tabs</span>
				<input type="checkbox" checked={s.ignorePinned} onChange={ev => this.handleChange(ev, 'ignorePinned')} />
			</label>

			<label className="row">
				<span>Export Format</span>
				<select value={s.format} onChange={ev => this.handleChange(ev, 'format')} style={{ width: 121 }}>
					<option value="markdown">Markdown</option>
					<option value="json">JSON</option>
				</select>
			</label>

			<label className="row">
				<span>Color Scheme</span>
				<select value={s.editorTheme} onChange={ev => this.handleChange(ev, 'editorTheme')}>
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
				<select value={s.editorThemeDarkMode} onChange={ev => this.handleChange(ev, 'editorThemeDarkMode')}>
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
				<input type="color" value={s.iconColor} onChange={ev => this.handleChange(ev, 'iconColor')} />
			</label>

			<label className="row">
				<span>Text Color - Dark Mode</span>
				<input type="color" value={s.iconColorDarkMode} onChange={ev => this.handleChange(ev, 'iconColorDarkMode')} />
			</label>

			<h3>Context Menu Items</h3>

			<div className="row">
				<label>
					<input type="checkbox" checked={s.showCopyLinkAsMarkdown} onChange={ev => this.handleChange(ev, 'showCopyLinkAsMarkdown')} />
					{getString('options_show_copy_link')}
				</label>
			</div>

			<div className="row">
				<label>
					<input type="checkbox" checked={s.showCopyPageAsMarkdown} onChange={ev => this.handleChange(ev, 'showCopyPageAsMarkdown')} />
					{getString('options_show_copy_page')}
				</label>
			</div>

		</>;
	}
}