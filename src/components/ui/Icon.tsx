// Minimal outline icon set (stroke-based, inherits currentColor).
type IconName =
  | 'home' | 'user' | 'file' | 'plus' | 'download' | 'upload' | 'trash' | 'copy'
  | 'print' | 'check' | 'sun' | 'moon' | 'menu' | 'drag' | 'eye' | 'eye-off'
  | 'chevron-up' | 'chevron-down' | 'x' | 'alert' | 'info' | 'settings';

const PATHS: Record<IconName, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  user: 'M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6M12 11a4 4 0 100-8 4 4 0 000 8z',
  file: 'M6 2h8l4 4v16H6zM14 2v4h4',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
  upload: 'M12 21V9m0 0l-4 4m4-4l4 4M4 3h16',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  copy: 'M9 9h10v10H9zM5 15H3V3h12v2',
  print: 'M7 9V3h10v6M7 19H5a2 2 0 01-2-2v-4h18v4a2 2 0 01-2 2h-2M7 15h10v6H7z',
  check: 'M5 13l4 4L19 7',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.6 5.6l1.4 1.4M4.9 4.9l1.4 1.4m0 11.4l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 100 8 4 4 0 000-8z',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  drag: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z M12 15a3 3 0 100-6 3 3 0 000 6z',
  'eye-off': 'M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.1A10 10 0 0112 5c7 0 11 7 11 7a18 18 0 01-3 3.7M6.1 6.1A18 18 0 001 12s4 7 11 7a10 10 0 003.9-.8',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6L6 18',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z',
  info: 'M12 16v-5m0-4h.01M12 22a10 10 0 100-20 10 10 0 000 20z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 005 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 13.6H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 5l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 3.1V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1A1.6 1.6 0 0021 10.3h0a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
};

export function Icon({ name, size = 18, className, style }: { name: IconName; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export type { IconName };
