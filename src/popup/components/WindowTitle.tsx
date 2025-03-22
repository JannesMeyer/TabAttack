import React from 'react';
import { useLocalStorage } from '../../common/util/useLocalStorage';
import { Editable } from './Editable';

export const WindowTitle = ({ index, ...props }: { index: number }) => {
	const [value, setValue] = useLocalStorage(`window-${index}`);
	return <Editable {...props} className={'windowTitle'} value={value ?? 'Untitled'} onChange={setValue} />;
};
