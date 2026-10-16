import type { SVGAttributes } from 'react';

/**
 * Taska symbol: three stacked task cards forming a T.
 *
 * Rendered in `currentColor` so it adapts to every context it is used in
 * (white on the sidebar's primary tile, black/white in the header and auth
 * layouts, and both themes). The two-colour brand version lives in the
 * favicon and app-icon assets.
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 256 256"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <g fill="currentColor">
                <rect x="40" y="48" width="176" height="44" rx="16" />
                <rect x="92" y="106" width="72" height="44" rx="16" />
                <rect x="92" y="164" width="72" height="44" rx="16" />
            </g>
        </svg>
    );
}
