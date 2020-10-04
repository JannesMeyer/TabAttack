import preferences, { Prefs } from './preferences.js';
import { lightThemes, darkThemes } from './lib/AceThemes.js';
import getString from './lib/browser/getString.js';
import { sendMessage } from './lib/browser/sendMessage.js';
import assertDefined from './lib/assertDefined.js';

// Useful for testing purposes:
// browser.storage.sync.clear();
// browser.storage.sync.get().then(console.log);

// Load strings
document.title = getString('options');
let strings = {
	exportHeadline:      getString('options_export'),
	exportFormat:        getString('options_export_format'),
	exportAddDomain:     getString('options_export_add_domain'),
	exportIgnoreDomains: getString('options_export_ignore_domains'),
	exportIgnorePinned:  getString('options_export_ignore_pinned'),
	editorHeadline:      getString('options_editor'),
	editorTheme:         getString('options_editor_theme'),
	contextMenuHeadline: getString('options_context_menu'),
	showCopyLink:        getString('options_show_copy_link'),
	showCopyPage:        getString('options_show_copy_page')
};

// Load preferences
preferences.getAll().then(prefs => {
	ReactDOM.render(<Page {...prefs} />, document.querySelector('body > main'));
});

class Page extends React.Component<Prefs, Prefs> {

	constructor(p: Prefs) {
		super(p);
		this.state = p;
	}

	componentWillUpdate(_: Prefs, nextState: Prefs) {
		preferences.set(nextState);
	}

	handleChange<K extends keyof Prefs>(field: K, ev: React.ChangeEvent) {
		let target: any = ev.target;
		let value = (target.type === 'checkbox' ? target.checked : target.value);
		this.setState({ [field]: value } as any);

		// Live update
		if (field === 'showCopyLinkAsMarkdown') {
			if (value) {
				sendMessage('show copyLinkItem');
			} else {
				sendMessage('hide copyLinkItem');
			}
		} else if (field === 'showCopyPageAsMarkdown') {
			if (value) {
				sendMessage('show copyPageItem');
			} else {
				sendMessage('hide copyPageItem');
			}
		}
	}

	addDomain = (ev: React.FormEvent) => {
		ev.preventDefault();
		let input = assertDefined(this.domainInput.current);
		let list = this.state.domainBlacklist;

		// Check if the blacklist already contains the domain
		if (list.indexOf(input.value) !== -1) {
			// TODO: Toast instead
			return alert('Already exists');
		}

		// Add the domain to the beginning of the blacklist
		list.unshift(input.value);
		input.value = '';
		this.forceUpdate();
	};

	deleteDomain = (index: number, ev: React.MouseEvent) => {
		ev.preventDefault();
		this.state.domainBlacklist.splice(index, 1);
		this.forceUpdate();
	};

	domainInput = React.createRef<HTMLInputElement>();

	render() {
		let s = this.state;
		return (
			<div>

				<h3>{strings.exportHeadline}</h3>

				<label>
					{strings.exportFormat}
					<select value={s.format} onChange={ev => this.handleChange('format', ev)}>
						<option value="markdown">Markdown</option>
						<option value="json">JSON</option>
					</select>
				</label>

				<label>
					{strings.exportIgnoreDomains}
					<div className="settings-list" ref="domainBlacklist">
						<div className="row editing">
							<form onSubmit={this.addDomain}>
								<input type="text" ref={this.domainInput} placeholder={strings.exportAddDomain} required />
							</form>
						</div>
						{s.domainBlacklist && s.domainBlacklist.map((domain, i) =>
							<div className="row" key={domain}>
								<span>{domain}</span>
								<a className="delete-button" href="" onClick={ev => this.deleteDomain(i, ev)} />
							</div>
						)}
					</div>
				</label>

				<label>
					<input type="checkbox" checked={s.ignorePinned} onChange={this.handleChange.bind(this, 'ignorePinned')} />
					{strings.exportIgnorePinned}
				</label>

				<h3>{strings.editorHeadline}</h3>

				<label>
					{strings.editorTheme}
					<select ref="editorTheme" value={s.editorTheme} onChange={this.handleChange.bind(this, 'editorTheme')}>
						<optgroup label="Light">
						{lightThemes.map(t =>
							<option value={t.name} key={t.name}>{t.caption}</option>
						)}
						</optgroup>
						<optgroup label="Dark">
						{darkThemes.map(t =>
							<option value={t.name} key={t.name}>{t.caption}</option>
						)}
						</optgroup>
					</select>
				</label>

				<h3>{strings.contextMenuHeadline}</h3>

				<label>
					<input type="checkbox" checked={s.showCopyLinkAsMarkdown} onChange={this.handleChange.bind(this, 'showCopyLinkAsMarkdown')} />
					{strings.showCopyLink}
				</label>

				<label>
					<input type="checkbox" checked={s.showCopyPageAsMarkdown} onChange={this.handleChange.bind(this, 'showCopyPageAsMarkdown')} />
					{strings.showCopyPage}
				</label>

			</div>
		);
	}
}