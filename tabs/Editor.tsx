import getString from '../lib/browser/getString.js';
import { Ace } from 'ace-builds';
import css from '../lib/css.js';
import assertDefined from '../lib/assertDefined.js';
import { AceThemeModule } from '../lib/getAceThemes.js';

interface P {
	theme: AceThemeModule;
	text?: string;
	highlightLine?: number;
	format?: 'markdown' | 'json';
	fontSize?: number;
	showToast: (message: string) => void;
}

/**
 * Ace editor component
 */
export default class Editor extends React.Component<P> {

	editor!: Ace.Editor;

	constructor(p: P) {
		super(p);
	}

	componentDidMount() {
		let p = this.props;
		this.editor = ace.edit(assertDefined(this.ref.current));
		this.editor.setTheme(p.theme.theme);
		this.editor.setOption('showLineNumbers', false);
		this.editor.setOption('showPrintMargin', false);
		if (p.fontSize != null) {
			this.editor.setOption('fontSize', p.fontSize);
		}
		addEventListener('beforeunload', this.handleUnload);
		addEventListener('copy', this.handleCopy);
	}

	componentWillUnmount() {
		this.editor.destroy();
		removeEventListener('beforeunload', this.handleUnload);
		removeEventListener('copy', this.handleCopy);
	}

	private handleUnload = (ev: BeforeUnloadEvent) => {
		if (this.editor.session.getUndoManager().isAtBookmark()) {
			return;
		}
		return ev.returnValue = getString('confirm_unload');
	};

	private handleCopy = (ev: any) => {
		if (ev.clipboardData.getData('text/plain') !== '') {
			return;
		}
		ev.clipboardData.setData('text/plain', this.getContent());
		this.props.showToast(getString('toast_copied_document'));
	};

	componentDidUpdate(op: Readonly<P>) {
		let { props: p, editor } = this;
		if (p.theme !== op.theme) {
			editor.setTheme(p.theme.theme);
		}
		if (p.format !== op.format && p.format != null) {
			editor.session.setMode('ace/mode/' + p.format);
		}
		if (p.text !== op.text) {
			// session.setValue: see https://github.com/ajaxorg/ace/issues/1243
			editor.session.setValue(this.props.text ?? '');
			editor.gotoLine(p.highlightLine ?? 0, 0, false);
			editor.focus();
		}
	}

	getContent() {
		this.editor.session.getUndoManager().bookmark();
		return this.editor.getValue();
	}

	static readonly css = css`
	.ace_underline {
		text-decoration: none !important;
	}`;

	ref = React.createRef<HTMLDivElement>();

	render() {
		return <div ref={this.ref} />;
	}

}