import './options.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import t from '../messages';

import { ThemePicker } from './components/ThemePicker';

function Options() {
	return (
		<>
			<h3>{t('options_theme')}</h3>
			<ThemePicker />
		</>
	);
}

createRoot(document.body).render(<Options />);
