import './options.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import getString from '../lib/browser/getString';
import { isFirefox } from '../lib/browser/runtime';
import { aceThemes } from '../lib/getAceThemes';
import { syncPrefs } from '../prefs';
import DomainBlacklist from './DomainBlacklist';

function Options() {
	const lightThemes = aceThemes.filter(t => !t.isDark);
	const darkThemes = aceThemes.filter(t => t.isDark);
	const [domainBlacklist, setDomainBlacklist] = syncPrefs.use('domainBlacklist');
	const [ignorePinned, setIgnorePinned] = syncPrefs.use('ignorePinned');
	const [format, setFormat] = syncPrefs.use('format');
	const [editorTheme, setEditorTheme] = syncPrefs.use('editorTheme');
	const [editorThemeDarkMode, setEditorThemeDarkMode] = syncPrefs.use('editorThemeDarkMode');
	const [iconColor, setIconColor] = syncPrefs.use('chromiumIconColor');
	const [showCopyLinkAsMarkdown, setShowCopyLinkAsMarkdown] = syncPrefs.use('showCopyLinkAsMarkdown');
	const [showCopyPageAsMarkdown, setShowCopyPageAsMarkdown] = syncPrefs.use('showCopyPageAsMarkdown');

	const [showDomainBlacklist, setShowDomainBlacklist] = React.useState(false);
	const toggleDomainBlacklist = (ev: React.MouseEvent) => {
		ev.preventDefault();
		setShowDomainBlacklist(s => !s);
	};
	if (showDomainBlacklist) {
		return (
			<DomainBlacklist
				list={domainBlacklist}
				onChange={setDomainBlacklist}
				onBack={toggleDomainBlacklist}
			/>
		);
	}
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

			<h3>{getString('options_export')}</h3>

			<label className='row'>
				<span>Ignore Domains</span>
				<a href='' onClick={toggleDomainBlacklist}>{domainBlacklist.length} domain(s)</a>
			</label>

			<label className='row'>
				<span>Ignore Pinned Tabs</span>
				<input type='checkbox' checked={ignorePinned} onChange={ev => setIgnorePinned(ev.target.checked)} />
			</label>

			<label className='row'>
				<span>Export Format</span>
				<select value={format} onChange={ev => setFormat(ev.target.value)} style={{ width: 121 }}>
					<option value='markdown'>Markdown</option>
					<option value='json'>JSON</option>
				</select>
			</label>

			<label className='row'>
				<span>Color Scheme (light)</span>
				<select
					value={editorTheme}
					onChange={ev => setEditorTheme(ev.target.value)}
					style={{ width: 210 }}
				>
					<optgroup label='Light'>
						{lightThemes.map(t => <option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
					<optgroup label='Dark'>
						{darkThemes.map(t => <option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
				</select>
			</label>

			<label className='row'>
				<span>Color Scheme (dark)</span>
				<select
					value={editorThemeDarkMode}
					onChange={ev => setEditorThemeDarkMode(ev.target.value)}
					style={{ width: 210 }}
				>
					<optgroup label='Light'>
						{lightThemes.map(t => <option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
					<optgroup label='Dark'>
						{darkThemes.map(t => <option value={t.name} key={t.name}>{t.caption}</option>)}
					</optgroup>
				</select>
			</label>
		</>
	);
}

document.title = getString('options');
createRoot(document.body).render(<Options />);
