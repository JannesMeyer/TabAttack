import { getString } from 'chrome-tool/i18n';
import { sendMessage } from 'chrome-tool/runtime';

import Preferences from './Preferences';
import { lightThemes, darkThemes } from './helpers/ace-themes';
import Toast from './components/Toast';

// Useful for testing purposes:
// import Storage from 'chrome-tool/storage-sync';
// Storage.clear()
// Storage.get(function(p) { console.log(p) })

// Load strings
document.title = getString('options');
var strings = {
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
Preferences.getAll().then(prefs => {
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
		Preferences.set(nextState);
	}

	handleChange(field, ev) {
		var value = (ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value);
		this.setState({ [field]: value });

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

				<label>
					<input type="checkbox" checked={s.showCopyPageAsMarkdown} onChange={this.handleChange.bind(this, 'showCopyPageAsMarkdown')} />
					{strings.showCopyPage}
				</label>

			</div>
		);
	}
}