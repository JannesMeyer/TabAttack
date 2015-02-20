import './setDefaults';
import { lightThemes, darkThemes } from './lib-browser/aceThemeList';

// Useful for testing purposes:
// chrome.storage.sync.clear()
// chrome.storage.sync.get(function(p) { console.log(p) })

var Page = React.createClass({

	componentWillMount() {
		Chrome.getPreferences().then(p => this.replaceState(p));
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

	showSavedMessage() {
		this.refs.toast.show(Chrome.getString('options_saved'));
	},

	render() {
		var s = this.state || {};
		return (
			<div>

				<h3>Export options</h3>

				<label>
					Format:
					<select value={s.format} onChange={this.handleValueChange.bind(this, 'format')}>
						<option value="markdown">Markdown</option>
						<option value="json">JSON</option>
					</select>
				</label>

				<label>
					Ignore these domains:
					<div className="settings-list" ref="domainBlacklist">
						<div className="row editing"><form onSubmit={this.addDomain}><input type="text" ref="domainInput" placeholder="Add a domain" required /></form></div>
						{s.domainBlacklist && s.domainBlacklist.map((domain, i) =>
							<div className="row" key={domain}><span>{domain}</span><a className="delete-button" href="" onClick={this.deleteDomain.bind(this, i)} /></div>
						)}
					</div>
				</label>

				<label>
					<input type="checkbox" checked={s.ignorePinned} onChange={this.handleCheckedChange.bind(this, 'ignorePinned')} />
					Ignore pinned tabs
				</label>

				<h3>Editor options</h3>

				<label>
					Default theme:
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