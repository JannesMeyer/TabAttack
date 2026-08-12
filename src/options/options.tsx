import './options.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import getString from '../lib/getString';
import { isFirefox } from '../lib/isFirefox';
import { syncPrefs } from '../lib/prefs';

function Options() {
	const [iconColor, setIconColor] = syncPrefs.use('chromiumIconColor');
	const [showCopyLinkAsMarkdown, setShowCopyLinkAsMarkdown] = syncPrefs.use('showCopyLinkAsMarkdown');
	const [showCopyPageAsMarkdown, setShowCopyPageAsMarkdown] = syncPrefs.use('showCopyPageAsMarkdown');

	return (
		<>
			{!isFirefox && (
				<label className='row'>
					<span>Icon color</span>
					<input
						type='color'
						value={iconColor}
						onChange={ev => setIconColor(ev.target.value)}
					/>
				</label>
			)}

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
