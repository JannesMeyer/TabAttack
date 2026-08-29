import './options.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import t from '../messages';

import { useSnapshot } from 'valtio';
import { syncPrefs } from '../prefs';
import { ThemePicker } from './components/ThemePicker';

function Options() {
	const prefs = useSnapshot(syncPrefs.values);

	return (
		<>
			<h3>{t('options_theme')}</h3>
			<ThemePicker />
			<h3>{t('options_dynamic_icon')}</h3>
			<label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
				<input
					type='checkbox'
					checked={prefs.dynamicIcon}
					onChange={ev => syncPrefs.values.dynamicIcon = ev.target.checked}
				/>
				{t('options_dynamic_icon_description')}
			</label>
		</>
	);
}

createRoot(document.body).render(<Options />);
