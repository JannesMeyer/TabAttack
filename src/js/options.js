import './defaults';
import { lightThemes, darkThemes } from './lib-browser/aceThemeList';

// Useful for testing purposes:
// chrome.storage.sync.clear()
// chrome.storage.sync.get(function(p) { console.log(p) })

// Load strings
document.title = Chrome.getString('options');
var strings = {
	exportHeadline:      Chrome.getString('options_export'),
	exportFormat:        Chrome.getString('options_export_format'),
	exportAddDomain:     Chrome.getString('options_export_add_domain'),
	exportIgnoreDomains: Chrome.getString('options_export_ignore_domains'),
	exportIgnorePinned:  Chrome.getString('options_export_ignore_pinned'),
	editorHeadline:      Chrome.getString('options_editor'),
	editorTheme:         Chrome.getString('options_editor_theme'),
	contextMenuHeadline: Chrome.getString('options_context_menu'),
	showCopyLink:        Chrome.getString('options_show_copy_link')
};

// Load preferences
Chrome.getPreferences().then(prefs => {
	React.render(<Page prefs={prefs} />, document.body);
});

/**
 * Page component
 */
class Page extends React.Component {
	constructor(props) {
		this.state = props.prefs;

		this.addDomain = this.addDomain.bind(this);
		this.deleteDomain = this.deleteDomain.bind(this);
	}

	componentWillUpdate(nextProps, nextState) {
		Chrome.setPreferences(nextState);
	}

	handleChange(field, ev) {
		var value = (ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value);
		this.setState({ [field]: value });

		// Live update
		if (field === 'showCopyLinkAsMarkdown') {
			Chrome.sendMessage({ operation: (value ? 'add_context_menu' : 'remove_context_menu') });
		}
	}

	addDomain(ev) {
		ev.preventDefault();
		var input = this.refs.domainInput.getDOMNode();
		var list = this.state.domainBlacklist;

		// Check if the blacklist already contains the domain
		if (list.indexOf(input.value) !== -1) {
			// TODO: Toast instead
			return alert('Already exists');
		}

		// Add the domain to the beginning of the blacklist
		list.unshift(input.value);
		input.value = '';
		this.forceUpdate();
	}

	deleteDomain(index, ev) {
		ev.preventDefault();
		this.state.domainBlacklist.splice(index, 1);
		this.forceUpdate();
	}

	render() {
		var s = this.state;
		return (
			<div>

				<h3>{strings.exportHeadline}</h3>

				<label>
					{strings.exportFormat}
					<select value={s.format} onChange={this.handleChange.bind(this, 'format')}>
						<option value="markdown">Markdown</option>
						<option value="json">JSON</option>
					</select>
				</label>

				<label>
					{strings.exportIgnoreDomains}
					<div className="settings-list" ref="domainBlacklist">
						<div className="row editing"><form onSubmit={this.addDomain}><input type="text" ref="domainInput" placeholder={strings.exportAddDomain} required /></form></div>
						{s.domainBlacklist && s.domainBlacklist.map((domain, i) =>
							<div className="row" key={domain}><span>{domain}</span><a className="delete-button" href="" onClick={this.deleteDomain.bind(this, i)} /></div>
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

			</div>
		);
	}
}