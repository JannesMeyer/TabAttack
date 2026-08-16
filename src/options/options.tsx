import './options.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import getString from '../lib/getString';
import { syncPrefs } from '../prefs';

import { ThemePicker } from './components/ThemePicker';

function Options() {
	const [showCopyLinkAsMarkdown, setShowCopyLinkAsMarkdown] = syncPrefs.use('showCopyLinkAsMarkdown');
	const [showCopyPageAsMarkdown, setShowCopyPageAsMarkdown] = syncPrefs.use('showCopyPageAsMarkdown');

	return (
		<>
			<h3>{getString('options_editor_theme')}</h3>
			<ThemePicker />

			<h3>Context menu</h3>

			<div className='row'>
				<label>
					<input
						type='checkbox'
						checked={showCopyLinkAsMarkdown}
						onChange={ev => setShowCopyLinkAsMarkdown(ev.target.checked)}
					/>
					{getString('options_show_copy_link')}
				</label>
			</div>

			<div className='row'>
				<label>
					<input
						type='checkbox'
						checked={showCopyPageAsMarkdown}
						onChange={ev => setShowCopyPageAsMarkdown(ev.target.checked)}
					/>
					{getString('options_show_copy_page')}
				</label>
			</div>
		</>
	);
}

document.title = getString('options');
createRoot(document.body).render(<Options />);
