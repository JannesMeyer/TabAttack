import React from 'react';

export const DragHandleIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg {...props} viewBox='0 0 16 16' fill='currentColor'>
		<circle cx='5' cy='3' r='1.5' />
		<circle cx='11' cy='3' r='1.5' />
		<circle cx='5' cy='8' r='1.5' />
		<circle cx='11' cy='8' r='1.5' />
		<circle cx='5' cy='13' r='1.5' />
		<circle cx='11' cy='13' r='1.5' />
	</svg>
);
