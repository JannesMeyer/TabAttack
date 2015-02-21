import ace from 'brace';
import 'brace/mode/json';
import 'brace/mode/markdown';
import 'brace/theme/chrome';
import 'brace/theme/clouds';
import 'brace/theme/crimson_editor';
import 'brace/theme/dawn';
import 'brace/theme/dreamweaver';
import 'brace/theme/eclipse';
import 'brace/theme/github';
import 'brace/theme/solarized_light';
import 'brace/theme/textmate';
import 'brace/theme/tomorrow';
import 'brace/theme/xcode';
import 'brace/theme/kuroir';
import 'brace/theme/katzenmilch';
import 'brace/theme/ambiance';
import 'brace/theme/chaos';
import 'brace/theme/clouds_midnight';
import 'brace/theme/cobalt';
import 'brace/theme/idle_fingers';
import 'brace/theme/kr_theme';
import 'brace/theme/merbivore';
import 'brace/theme/merbivore_soft';
import 'brace/theme/mono_industrial';
import 'brace/theme/monokai';
import 'brace/theme/pastel_on_dark';
import 'brace/theme/solarized_dark';
import 'brace/theme/terminal';
import 'brace/theme/tomorrow_night';
import 'brace/theme/tomorrow_night_blue';
import 'brace/theme/tomorrow_night_bright';
import 'brace/theme/tomorrow_night_eighties';
import 'brace/theme/twilight';
import 'brace/theme/vibrant_ink';

/**
 * Ace editor component
 */
export default class Editor extends React.Component {

	constructor() {
		super();
		this.handleUnload = this.handleUnload.bind(this);
		this.handleCopy = this.handleCopy.bind(this);
	}

	componentDidMount() {
		this.editor = ace.edit('editor');
		this.editor.setOption('fontSize', '14px');
		this.editor.setOption('showLineNumbers', false);
		this.editor.setOption('showPrintMargin', false);
		Chrome.getPreference('editorTheme').then(theme => {
			this.editor.setTheme('ace/theme/' + theme);
		});
		this.updateContent();

		window.addEventListener('beforeunload', this.handleUnload);
		window.addEventListener('copy', this.handleCopy);
	}

	componentWillUnmount() {
		window.removeEventListener('beforeunload', this.handleUnload);
		window.removeEventListener('copy', this.handleCopy);
	}

	handleUnload(ev) {
		if (this.editor.session.getUndoManager().isClean()) {
			return;
		}
		var message = Chrome.getString('confirm_unload');
		ev.returnValue = message;
		return message;
	}

	handleCopy(ev) {
		if (ev.clipboardData.getData('text/plain') !== '') {
			return;
		}
		ev.clipboardData.setData('text/plain', this.getContent());
		// TODO: Toast instead of alert
		alert('Copied the whole document');
	}

	componentDidUpdate(prevProps, prevState) {
		this.updateContent();
	}

	updateContent() {
		var doc = this.props.doc;
		if (!doc) { return; }

		this.editor.session.setMode('ace/mode/' + doc.format);
		// session.setValue: see https://github.com/ajaxorg/ace/issues/1243
		this.editor.session.setValue(doc.text);
		this.editor.gotoLine(doc.highlightLine || 0);
		this.editor.focus();
	}

	getContent() {
		this.editor.session.getUndoManager().markClean();
		return this.editor.getValue();
	}

	render() {
		return <div id="editor" />;
	}

}