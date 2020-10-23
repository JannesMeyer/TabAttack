import css from '../../lib/css.js';

const root = document.body.appendChild(document.createElement('div'));
root.className = css`
& {
	position: fixed;
	left: 15px;
	right: 15px;
	bottom: 20%;
	z-index: 1000;
	pointer-events: none;
	display: flex;
	flex-direction: column;
	align-items: center;
}
& > div {
	margin-top: 15px;
	padding: 8px 11px;
	color: #f0f0f0;
	background-color: #262626;
	border-radius: 3px;
	box-shadow: 0 2px 7px rgba(0, 0, 0, 0.5);
}`;

const toasts = new Map<number, React.ReactNode>();

export default function showToast(message: React.ReactNode, seconds = 3) {
	let id = setTimeout(() => toasts.delete(id) && render(), seconds * 1000);
	toasts.set(id, message);
	render();
}

function render() {
	ReactDOM.render(toasts.map((message, id) => <div key={id}>{message}</div>), root);
}
