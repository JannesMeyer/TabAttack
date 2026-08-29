import './options.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import t from '../messages';

import { syncPrefs } from '../prefs';
import { ThemePicker } from './components/ThemePicker';

function Options() {
	const [dynamicIcon, setDynamicIcon] = syncPrefs.use('dynamicIcon');

	return (
		<>
			<h3>{t('options_theme')}</h3>
			<ThemePicker />
			<h3>{t('options_dynamic_icon')}</h3>
			<label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
				<input
					type='checkbox'
					checked={dynamicIcon}
					onChange={e => setDynamicIcon(e.target.checked)}
				/>
				{t('options_dynamic_icon_description')}
			</label>
		</>
	);
}

createRoot(document.body).render(<Options />);
