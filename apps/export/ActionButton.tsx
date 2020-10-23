import css, { X } from '../../lib/css.js';
// import { ListenerBucket } from 'keypress-tool';

interface P {
	title: string;
	onClick(ev: Event): void;
	// keyPress?: ListenerBucket;
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

	// componentDidMount() {
	// 	let p = this.props;
	// 	if (p.keyPress) {
	// 		p.keyPress.addListener(p.onClick, true);
	// 	}
	// }

	// componentWillUnmount() {
	// 	let p = this.props;
	// 	if (p.keyPress) {
	// 		p.keyPress.removeListener(p.onClick);
	// 	}
	// }

	handleClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
		this.props.onClick(ev.nativeEvent);
	}

	render() {
		let p = this.props;
		return <button onClick={this.handleClick} className={X(ActionButton.css, p.className)}>{p.title}</button>;
	}

}