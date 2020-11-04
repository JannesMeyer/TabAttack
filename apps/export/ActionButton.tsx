import css, { X } from '../../lib/css.js';
import KeyCombination from '../../lib/KeyCombination.js';

interface P {
	title: string;
	onClick(): void;
	globalKey?: KeyCombination;
	className?: string;
}

export default class ActionButton extends React.Component<P> {

	static css = css`
	& {
		padding: 7px 12px 9px;
		cursor: pointer;
		font-family: inherit;
		font-size: 16px;
	
		outline: 0;
		border: none;
		background: transparent;
		color: inherit;
	}
	&:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}
	&:active {
		opacity: 0.6;
	}`;

	handleGlobal = this.props.globalKey?.on(() => this.props.onClick()).handle;

	componentDidMount() {
		this.handleGlobal && addEventListener('keydown', this.handleGlobal);
	}

	componentWillUnmount() {
		this.handleGlobal && removeEventListener('keydown', this.handleGlobal);
	}

	render() {
		let p = this.props;
		return <button onClick={p.onClick} className={X(ActionButton.css, p.className)} title={p.globalKey?.toString()}>{p.title}</button>;
	}
}
