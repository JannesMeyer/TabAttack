import React from 'react';
import marked from 'marked';
import KeyPress from 'keypress-tool';
import { getIsoDateString } from 'date-tool';
import { getTags, parseHTML } from '../lib-browser/dom-tool';
import * as FileSystem from '../lib-browser/FileSystem';
import Editor from './Editor';
import Toast from './Toast';
import ActionButton from './ActionButton';
var { getString, sendMessage } = ContentRuntime; // Injected by webpack

var ctrlS      = KeyPress('S', ['ctrl']);
var ctrlQ      = KeyPress('Q', ['ctrl']);
var ctrlO      = KeyPress('O', ['ctrl']);
var ctrlShiftO = KeyPress('O', ['ctrl', 'shift']);

/**
 * Page component
 */
export default class Page extends React.Component {
	constructor(props) {
		super();
		this.state = {
			doc: props.doc,
			toastMessage: props.message
		};

		// Bind methods
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
		document.title = getString('ext_name');

		// File loading
		FileSystem.onFile(text => this.setState({
			doc: { format: 'markdown', text },
			toastMessage: undefined
		}));
		FileSystem.setupFileInput(this.refs.fileInput.getDOMNode());
		FileSystem.setupFileTarget(document.body);
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
	 * Action: Close all tabs except the current tab
	 */
	closeOtherTabs(ev) {
		sendMessage('close_other_tabs');
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
		var windows = getTags('ul', doc).map(ul => {
			ul.parentNode.removeChild(ul);
			return getTags('a', ul).map(a => a.href);
		});

		// Check for leftovers
		if (getTags('a', doc).length > 0) {
			this.showToast(getString('link_outside_list_error'));
			return;
		}

		sendMessage('open_windows', windows);
	}

	render() {
		var doc = this.state.doc;
		return (
			<div className="m-container">
				<div className="m-toolbar">
					<input type="file" ref="fileInput" style={{display: 'none'}} />
					<ActionButton className="item-save" onClick={this.downloadAsTextFile} keyPress={ctrlS} title={getString('action_save')} />
					<ActionButton className="item-close" onClick={this.closeOtherTabs} keyPress={ctrlQ} title={getString('action_close_tabs')} />
					<ActionButton className="item-load-file" onClick={this.loadFile} keyPress={ctrlO} title={getString('action_load_file')} />
					{doc.format === 'markdown' &&
					<ActionButton className="item-open" onClick={this.openLinks} keyPress={ctrlShiftO} title={getString('action_open_links')} />}
				</div>
				<Toast duration={4}>{this.state.toastMessage}</Toast>
				<Editor ref="editor" doc={doc} showToast={this.showToast} />
			</div>
		);
	}
}
Page.defaultProps = { doc: { format: 'markdown', text: '' } };