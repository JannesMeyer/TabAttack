import './defaults';
import marked from 'marked';
import KeyPress from './lib-browser/KeyPress';
import { getIsoDateString } from './lib/DateTime';
import { getTags, parseHTML } from './lib-browser/DOMHelpers'
import * as FileSystem from './lib-browser/FileSystem';
import * as TabManager from './lib-chrome/TabManager';
import Editor from './components/Editor';
import Toast from './components/Toast';

// Load strings
document.title = Chrome.getString('ext_name');
var strings = {
	save:      Chrome.getString('action_save'),
	close:     Chrome.getString('action_close_tabs'),
	loadFile:  Chrome.getString('action_load_file'),
	openLinks: Chrome.getString('action_open_links')
};

// Load document
Chrome.sendMessage({ operation: 'get_document' }).then(response => {
	React.render(<Page doc={response} />, document.body);
}).catch(err => {
	React.render(<Page error={err} />, document.body);
});

/**
 * Page component
 */
class Page extends React.Component {
	constructor(props) {
		super(props);
		this.state = { doc: props.doc, toastMessage: props.error };

		this.showToast = this.showToast.bind(this);
		this.downloadAsTextFile = this.downloadAsTextFile.bind(this);
		this.closeOtherTabs = this.closeOtherTabs.bind(this);
		this.loadFile = this.loadFile.bind(this);
		this.openLinks = this.openLinks.bind(this);
	}

	showToast(message) {
		this.setState({ toastMessage: message });
	}

	componentDidMount() {
		// File loading
		FileSystem.onFile(text => this.setState({ doc: { format: 'markdown', text } }));
		FileSystem.setupFileInput(this.refs.fileInput.getDOMNode());
		FileSystem.setupFileTarget(document.body);

		// Set keyboard shortcuts
		KeyPress('S', ['ctrl']).addListener(this.downloadAsTextFile, true);
		KeyPress('Q', ['ctrl']).addListener(this.closeOtherTabs, true);
		KeyPress('O', ['ctrl']).addListener(this.loadFile, true);
		KeyPress('O', ['ctrl', 'shift']).addListener(this.openLinks, true);
	}

	/**
	 * Action: Download the editor's content as a text file
	 */
	downloadAsTextFile(ev) {
		var doc = this.state.doc;
		var ext = (doc.format === 'json' ? '.json' : '.md');
		var filename = getIsoDateString() + ext;
		var text = this.refs.editor.getContent();
		FileSystem.saveTextFile(filename, text);
	}

	/**
	 * Action: Close all tabs
	 */
	closeOtherTabs(ev) {
		Chrome.getCurrentTab().then(tab => {
			TabManager.closeOtherTabs(tab);
		});
	}

	/**
	 * Action: Load file
	 */
	loadFile(ev) {
		this.refs.fileInput.getDOMNode().click();
	}

	/**
	 * Action: Open all links in tabs
	 */
	openLinks(ev) {
		// Markdown → HTML → DOM
		var text = this.refs.editor.getContent();
		var doc = parseHTML(marked(text));

		// Get all links inside of an <ul>
		var windows = getTags(doc, 'ul').map(ul => {
			ul.parentNode.removeChild(ul);
			return getTags(ul, 'a').map(a => a.href);
		});

		// Check for leftovers
		if (getTags(doc, 'a').length > 0) {
			this.showToast(Chrome.getString('link_outside_list_error'));
			return;
		}

		TabManager.restoreWindows(windows);
	}

	render() {
		var doc = this.state.doc;
		var openButton = (doc.format === 'markdown' && <button onClick={this.openLinks} className="item-open" title={strings.openLinks}>{strings.openLinks}</button>);
		return (
			<div className="m-container">
				<div className="m-toolbar">
					<input type="file" ref="fileInput" style={{display: 'none'}} />
					<button onClick={this.downloadAsTextFile} className="item-save" title={strings.save}>{strings.save}</button>
					<button onClick={this.closeOtherTabs} className="item-close" title={strings.close}>{strings.close}</button>
					<button onClick={this.loadFile} className="item-load-file" title={strings.loadFile}>{strings.loadFile}</button>
					{openButton}
				</div>
				<Toast>{this.state.toastMessage}</Toast>
				<Editor ref="editor" doc={doc} showToast={this.showToast} />
			</div>
		);
	}
}
Page.defaultProps = { doc: { format: 'markdown', text: '' } };