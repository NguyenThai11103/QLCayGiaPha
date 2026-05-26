import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
    name:
        | 'home'
        | 'dashboard'
        | 'tree'
        | 'users'
        | 'link'
        | 'book'
        | 'calendar'
        | 'sparkle'
        | 'settings'
        | 'search'
        | 'bell'
        | 'plus'
        | 'arrow-right'
        | 'arrow-up-right'
        | 'chevron-down'
        | 'chevron-right'
        | 'branch'
        | 'layers'
        | 'photo'
        | 'edit'
        | 'ai'
        | 'add-user'
        | 'fit'
        | 'minus'
        | 'pin'
        | 'heart'
        | 'scroll'
        | 'lotus'
        | 'logout'
        | 'menu'
        | 'x'
        | 'camera'
        | 'check'
        | 'map'
        | 'copy'
        | 'trash'
        | 'crosshair'
        | 'moon'
        | 'clock';
    size?: number;
};

export default function Icon({ name, size = 18, strokeWidth = 1.75, ...props }: IconProps) {
    const common = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        ...props,
    };

    switch (name) {
        case 'home':
            return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></svg>;
        case 'dashboard':
            return <svg {...common}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
        case 'tree':
            return <svg {...common}><circle cx="12" cy="4" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="4" cy="20" r="1.5" /><circle cx="9" cy="20" r="1.5" /><circle cx="15" cy="20" r="1.5" /><circle cx="20" cy="20" r="1.5" /><path d="M12 6v3M6 14v3M18 14v3M4 18.5V17h14v1.5" /><path d="M12 9h-6M12 9h6" /></svg>;
        case 'users':
            return <svg {...common}><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c0-3 3-5.5 6-5.5s6 2.5 6 5.5" /><path d="M15 18c0-2 2-3.5 4-3.5s2 1 2 1" /></svg>;
        case 'link':
            return <svg {...common}><path d="M10 14a4 4 0 010-6l3-3a4 4 0 116 6l-1.5 1.5" /><path d="M14 10a4 4 0 010 6l-3 3a4 4 0 11-6-6l1.5-1.5" /></svg>;
        case 'book':
            return <svg {...common}><path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 014 17.5z" /><path d="M4 17.5A2.5 2.5 0 016.5 15H20" /></svg>;
        case 'calendar':
            return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
        case 'sparkle':
            return <svg {...common}><path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15l-1.7-4L6 9.3l4.3-1.7z" /><path d="M19 4l.6 1.6L21 6.2l-1.4.6L19 8l-.6-1.2L17 6.2l1.4-.6z" /></svg>;
        case 'settings':
            return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3 1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>;
        case 'search':
            return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
        case 'bell':
            return <svg {...common}><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 004 0" /></svg>;
        case 'plus':
            return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
        case 'arrow-right':
            return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
        case 'arrow-up-right':
            return <svg {...common}><path d="M7 17L17 7M9 7h8v8" /></svg>;
        case 'chevron-down':
            return <svg {...common}><path d="M6 9l6 6 6-6" /></svg>;
        case 'chevron-right':
            return <svg {...common}><path d="M9 6l6 6-6 6" /></svg>;
        case 'branch':
            return <svg {...common}><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="12" r="2" /><path d="M6 7v10M8 5h2a4 4 0 014 4 4 4 0 004 4M8 19h2a4 4 0 004-4" /></svg>;
        case 'layers':
            return <svg {...common}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5M3 18l9 5 9-5" /></svg>;
        case 'photo':
            return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M3 17l5-5 5 5 3-3 5 5" /></svg>;
        case 'edit':
            return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z" /></svg>;
        case 'ai':
            return <svg {...common}><rect x="5" y="7" width="14" height="11" rx="2" /><path d="M12 7V3M9 11h.01M15 11h.01M9 15h6" /><path d="M3 13v2M21 13v2" /></svg>;
        case 'add-user':
            return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M3 19c0-3 3-5.5 6-5.5s6 2.5 6 5.5" /><path d="M19 8v6M16 11h6" /></svg>;
        case 'fit':
            return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16M4 9h16" /></svg>;
        case 'minus':
            return <svg {...common}><path d="M5 12h14" /></svg>;
        case 'pin':
            return <svg {...common}><path d="M12 2v6" /><path d="M5 8h14l-2 6H7z" /><path d="M12 14v8" /></svg>;
        case 'heart':
            return <svg {...common}><path d="M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z" /></svg>;
        case 'scroll':
            return <svg {...common}><path d="M5 3h12a3 3 0 013 3v12a3 3 0 01-3 3H7a3 3 0 01-3-3V6a3 3 0 013-3z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
        case 'lotus':
            return <svg {...common}><path d="M12 21c-4 0-8-2-9-6 2 0 4 0 5-2-2-1-3-3-3-5 2 0 4 1 5 3 0-3 1-6 2-8 1 2 2 5 2 8 1-2 3-3 5-3 0 2-1 4-3 5 1 2 3 2 5 2-1 4-5 6-9 6z" /></svg>;
        case 'logout':
            return <svg {...common}><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></svg>;
        case 'menu':
            return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
        case 'x':
            return <svg {...common}><path d="M18 6L6 18M6 6l12 12" /></svg>;
        case 'camera':
            return <svg {...common}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
        case 'check':
            return <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>;
        case 'map':
            return <svg {...common}><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3z" /><path d="M9 3v15M15 6v15" /></svg>;
        case 'copy':
            return <svg {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 012-2h10" /></svg>;
        case 'trash':
            return <svg {...common}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 14h10l1-14" /><path d="M9 7V4h6v3" /></svg>;
        case 'crosshair':
            return <svg {...common}><circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="1" /></svg>;
        case 'moon':
            return <svg {...common}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>;
        case 'clock':
            return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    }
}
