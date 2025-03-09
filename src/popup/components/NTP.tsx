import React from 'react';

type Shortcut = { url: string; iconUrl: string };

// TODO: use their manifest.json
const shortcuts: Shortcut[] = [
	{ url: 'https://news.ycombinator.com/', iconUrl: 'https://news.ycombinator.com/y18.svg' },
	{ url: 'https://open.spotify.com/', iconUrl: 'https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico' },
	{ url: 'https://mail.google.com/mail/u/0/#inbox', iconUrl: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
	{
		url: 'https://calendar.google.com/calendar/u/0/r',
		iconUrl: 'https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_31_256.ico',
	},
	{ url: 'https://www.tagesschau.de/', iconUrl: 'https://www.tagesschau.de/resources/assets/image/favicon/favicon.svg' },
	{ url: 'https://www.photopea.com/', iconUrl: 'https://www.photopea.com/promo/icon512.png' },
	{ url: 'https://github.com/notifications', iconUrl: 'https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg' },
	{ url: 'http://team1.localhost:8000/', iconUrl: 'https://app.airfocus.com/assets/logo-ec871cff40c8551b21ab.svg' },
];

export const NTP = ({ ref, ...props }: { ref: (element: HTMLElement | null) => void }) => {
	return (
		<div {...props} ref={ref} className={'DisplayTab ntp'}>
			{shortcuts.map(({ url, iconUrl }, i) => (
				<a
					key={i}
					href={url}
					tabIndex={1}
					onClick={(ev) => ev.currentTarget.focus()}
				>
					<img src={iconUrl} />
				</a>
			))}
		</div>
	);
};
