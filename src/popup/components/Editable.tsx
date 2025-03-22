import * as React from 'react';
import css, { cx } from '../../lib/css';

type Props = {
	value: string;
	onChange: (value: string) => void;
	ref?: React.Ref<HTMLInputElement>;
	className?: string;
};

export const Editable = ({ value, onChange, ...props }: Props) => {
	const [editing, setEditing] = React.useState(false);
	const className = cx(editable, props.className);
	if (!editing) {
		return <div {...props} className={className} onDoubleClick={() => setEditing(true)}>{value}</div>;
	}
	const submit = (ev: React.SyntheticEvent<HTMLInputElement>) => {
		const nextValue = ev.currentTarget.value.trim();
		if (nextValue !== value) {
			onChange(nextValue);
		}
		setEditing(false);
	};
	return (
		<input
			{...props}
			className={className}
			autoFocus
			onFocus={ev => ev.currentTarget.select()}
			defaultValue={value}
			onKeyDown={ev => {
				if (ev.key === 'Enter') {
					ev.preventDefault();
					submit(ev);
					return;
				}
				if (ev.key === 'Escape') {
					ev.preventDefault();
					setEditing(false);
					return;
				}
			}}
			onBlur={submit}
		/>
	);
};

const editable = css`
& {
	width: 100%;
	padding: 0;
	border: none;
	background: none;
	outline: none;
	font: inherit;
	color: inherit;
}
input& {
	cursor: text;
}`;
