import './setDefaults';
import { lightThemes, darkThemes } from './lib-browser/aceThemeList';

// Useful for testing purposes:
// chrome.storage.sync.clear()
// chrome.storage.sync.get(function(p) { console.log(p) })

var strings = {
	exportHeadline:      Chrome.getString('options_export'),
	exportFormat:        Chrome.getString('options_export_format'),
	exportIgnoreDomains: Chrome.getString('options_export_ignore_domains'),
	exportIgnorePinned:  Chrome.getString('options_export_ignore_pinned'),
	editorHeadline:      Chrome.getString('options_editor'),
	editorTheme:         Chrome.getString('options_editor_theme')
};

var Page = React.createClass({

	componentWillMount() {
		document.title = Chrome.getString('options');
		Chrome.getPreferences().then(p => this.setState(p));
	},

	componentWillUpdate(nextProps, nextState) {
		Chrome.setPreferences(nextState);
	},

	handleCheckedChange(field, ev) {
		this.setState({ [field]: ev.target.checked });
	},

	handleValueChange(field, ev) {
		this.setState({ [field]: ev.target.value });
	},

	addDomain(ev) {
		ev.preventDefault();
		var input = this.refs.domainInput.getDOMNode();
		var domainBlacklist = this.state.domainBlacklist;
		if (domainBlacklist.indexOf(input.value) === -1) {
			domainBlacklist.unshift(input.value);
			this.setState({ domainBlacklist });
			input.value = '';
		} else {
			alert('Already exists');
		}
	},

	deleteDomain(index, ev) {
		ev.preventDefault();
		var domainBlacklist = this.state.domainBlacklist;
		domainBlacklist.splice(index, 1);
		this.setState({ domainBlacklist });
	},

	render() {
		var s = this.state || {};
		return (
			<div>

				<h3>{strings.exportHeadline}</h3>

				<label>
					{strings.exportFormat}
					<select value={s.format} onChange={this.handleValueChange.bind(this, 'format')}>
						<option value="markdown">Markdown</option>
						<option value="json">JSON</option>
					</select>
				</label>

				<label>
					{strings.exportIgnoreDomains}
					<div className="settings-list" ref="domainBlacklist">
						<div className="row editing"><form onSubmit={this.addDomain}><input type="text" ref="domainInput" placeholder="Add a domain" required /></form></div>
						{s.domainBlacklist && s.domainBlacklist.map((domain, i) =>
							<div className="row" key={domain}><span>{domain}</span><a className="delete-button" href="" onClick={this.deleteDomain.bind(this, i)} /></div>
						)}
					</div>
				</label>

				<label>
					<input type="checkbox" checked={s.ignorePinned} onChange={this.handleCheckedChange.bind(this, 'ignorePinned')} />
					{strings.exportIgnorePinned}
				</label>

				<h3>{strings.editorHeadline}</h3>

				<label>
					{strings.editorTheme}
					<select ref="editorTheme" value={s.editorTheme} onChange={this.handleValueChange.bind(this, 'editorTheme')}>
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

			</div>
		);
	}
});

React.render(<Page />, document.body);