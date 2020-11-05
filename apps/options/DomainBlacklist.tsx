import css from '../../lib/css.js';
const { useState, useMemo, useCallback } = React;

interface P {
	list: string[];
	onChange(list: string[]): void;
	onBack(ev: React.MouseEvent): void;
}

export default function DomainBlacklist(p: P) {
	let listSet = useMemo(() => new Set(p.list), [p.list]);

	// Add item
	let [text, setText] = useState('');
	let addItem = useCallback((ev: React.FormEvent) => {
		ev.preventDefault();
		let list = p.list.slice();
		list.unshift(text.toLocaleLowerCase());
		setText('');
		p.onChange(list);
	}, [text, p.list, p.onChange]);

	// Remove item(s)
	let [selection, setSelection] = useState<string[]>([]);
	let remove = useCallback(() => {
		for (let value of selection) {
			listSet.delete(value);
		}
		setSelection([]);
		p.onChange(Array.from(listSet));
	}, [selection, listSet, p.onChange]);

	return <div className={DomainBlacklist.css}>
		<a href="" onClick={p.onBack}>Back</a>
		<h3>Ignore Domains When Exporting Tabs</h3>
		<form onSubmit={addItem}>
			<input autoFocus value={text} onChange={ev => setText(ev.target.value)} />
			<button type="button" disabled={listSet.has(text.toLocaleLowerCase()) || text.trim() === ''}>Add</button>
		</form>
		<p>
			<select
				size={12}
				multiple
				value={selection}
				onChange={ev => setSelection(Array.from(ev.target.selectedOptions, x => x.value))}
			>
				{p.list.map(x => <option key={x}>{x}</option>)}
			</select>
			<button type="button" onClick={remove} disabled={selection.length === 0}>Remove</button>
		</p>
	</div>;
}

DomainBlacklist.css = css`
& input {
	height: 24px;
}
& select, & input {
	min-width: 220px;
	box-sizing: border-box;
	vertical-align: bottom;
}
& button {
	margin-left: 5px;
	height: 24px;
	min-width: 70px;
	text-align: center;
	vertical-align: bottom;
}`;
