export default class ActionButton extends React.Component {
	componentDidMount() {
		var p = this.props;
		if (p.keyPress) {
			p.keyPress.addListener(p.onClick, true);
		}
	}

	componentWillUnmount() {
		var p = this.props;
		if (p.keyPress) {
			p.keyPress.removeListener(p.onClick);
		}
	}

	render() {
		var p = this.props;
		var description = p.title + (p.keyPress ? ' (' + p.keyPress + ')' : '');
		return <button onClick={p.onClick} className={p.className} title={description}>{p.title}</button>;
	}
}