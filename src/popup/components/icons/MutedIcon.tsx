import React from 'react';

/**
 * https://github.com/mozilla/gecko-dev/blob/master/browser/themes/shared/tabbrowser/tab-audio-muted-small.svg
 */
export const MutedIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg {...props} viewBox={'0 0 12 12'} width={12} height={12} fill='currentColor'>
		<path d='m2.791 3.581 1.347-2.294C4.654.408 6 .774 6 1.793v8.413c0 1.02-1.346 1.386-1.862.507L2.791 8.419c-.031-.053-.051-.111-.071-.169H1a1 1 0 0 1-1-1v-2.5a1 1 0 0 1 1-1h1.72a.93.93 0 0 1 .071-.169zm8.325-.081L9.5 5.116 7.884 3.5 7 4.384 8.616 6 7 7.616l.884.884L9.5 6.884 11.116 8.5 12 7.616 10.384 6 12 4.384l-.884-.884z' />
	</svg>
);
