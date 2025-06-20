import React from 'react';
import { usePref } from '../../common/util/usePrefs';
import type { TabStore } from '../TabStore';
import { Editable } from './Editable';

type WindowTitleProps = {
	id: number;
	incognito: boolean;
	store: TabStore;
};

export const WindowTitle = ({ id, incognito, store, ...props }: WindowTitleProps) => {
	const [value, setValue] = usePref(`windowTitle:${id}`, '');
	return (
		<div {...props}>
			<Editable className={'windowTitle'} value={value || (incognito ? 'Private' : 'Untitled')} onChange={setValue} />
		</div>
	);
};
