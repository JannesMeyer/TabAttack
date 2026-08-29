import React from 'react';
import { useSnapshot } from 'valtio';
import { CHROME_THEMES, type ChromeTheme } from '../../lib/chromeThemes';
import { syncPrefs } from '../../prefs';

export function ThemePicker() {
	const prefs = useSnapshot(syncPrefs.values);
	return (
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
			{CHROME_THEMES.map((theme, id) => {
				const isSelected = prefs.theme === id;
				return (
					<button
						key={id}
						type='button'
						onClick={() => syncPrefs.values.theme = id}
						style={{
							position: 'relative',
							borderRadius: 16,
							border: 'none',
							cursor: 'pointer',
							padding: 12,
							// transform: active ? 'scale(0.96)' : 'none',
							// transition: 'transform 100ms ease',
						}}
					>
						<Preview {...theme} />
						{isSelected && (
							<div
								style={{
									position: 'absolute',
									top: -2,
									right: -2,
									width: 18,
									height: 18,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: '#0b57d0',
									color: '#ffffff',
									border: '2px solid light-dark(#ffffff, #282a2d)',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
								}}
							>
								<svg
									width={11}
									height={11}
									viewBox='0 0 16 16'
									fill='none'
									stroke='currentColor'
									strokeWidth={2.5}
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<path d='M3 8.5l3.5 3.5 6.5-7.5' />
								</svg>
							</div>
						)}
					</button>
				);
			})}
		</div>
	);
}

const Preview = ({ light, dark }: { light: ChromeTheme; dark: ChromeTheme }) => {
	const clipId = React.useId();
	return (
		<svg width={48} height={48} viewBox='0 0 48 48'>
			<defs>
				<clipPath id={clipId}>
					<circle cx='24' cy='24' r='24' />
				</clipPath>
			</defs>
			<g clipPath={`url(#${clipId})`}>
				<rect x='0' y='0' width='48' height='24' fill={`light-dark(${light.frame}, ${dark.frame})`} />
				<rect x='0' y='24' width='24' height='24' fill={`light-dark(${light.activeTab}, ${dark.activeTab})`} />
				<rect x='24' y='24' width='24' height='24' fill={`light-dark(${light.accentSubtle}, ${dark.accentSubtle})`} />
			</g>
		</svg>
	);
};
