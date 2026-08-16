import React from 'react';

export const WindowIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg
		{...props}
		viewBox='0 0 16 16'
		width={14}
		height={14}
		fill='none'
		stroke='currentColor'
		strokeWidth='1.25'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<rect x='1.5' y='2.5' width='13' height='11' rx='1.5' />
		<line x1='1.5' y1='6' x2='14.5' y2='6' />
	</svg>
);
