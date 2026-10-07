import type { ReactNode } from 'react';

const PATHS = {
  home: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  lands: <path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" />,
  tip: (<><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>),
  circles: (<><circle cx="9" cy="9" r="3" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M16 6.5a3 3 0 0 1 0 5.5M17.5 14.5c2 .6 3.5 2.2 3.5 4.5" /></>),
  profile: (<><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M10 8v8h5" /></>),
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0" />,
  clock: (<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>),
  calendar: (<><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M8 3v4M16 3v4" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  play: <path d="M8 5l11 7-11 7z" />,
  coin: (<><circle cx="12" cy="12" r="8" /><path d="M9.5 9h5M9.5 12h5M10 9c3.5 0 3.5 3 0 3l4 4" /></>),
  trend: (<><path d="M4 18l5-6 4 3 7-9" /><path d="M15 6h5v5" /></>),
  fork: <path d="M12 4v7M12 11l-6 8M12 11l6 8" />,
  check: <path d="M5 12l5 5 9-10" />,
  chevR: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  warn: (<><path d="M12 4l9 15H3z" /><path d="M12 10v4M12 17v.01" /></>),
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />,
  eyeOff: <path d="M4 4l16 16M10 6.3A9 9 0 0 1 21 12a11 11 0 0 1-2.2 3M6.5 7.6A11 11 0 0 0 3 12a9.6 9.6 0 0 0 12.5 5.3" />,
  eye: (<><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /></>),
  bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  globe: (<><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" /></>),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  share: <path d="M12 15V4m0 0L8 8m4-4l4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />,
  sliders: (<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>),
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
  gift: (<><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M4 13h16M12 9v11M12 9c-2 0-4-1-4-3s3-2 4 3c1-5 4-5 4-3s-2 3-4 3" /></>),
  skip: <path d="M6 5l8 7-8 7M17 5v14" />,
  arrowR: <path d="M5 12h14m0 0l-5-5m5 5l-5 5" />,
  twin: (<><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 20c0-3 2.7-5 6-5 1.5 0 2.9.4 4 1.2 1.1-.8 2.5-1.2 4-1.2 3.3 0 6 2 6 5" /></>),
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
  copy: (<><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>),
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  trash: <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />,
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>),
  auto: (<><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" /></>),
  story: (<><rect x="6" y="3" width="12" height="18" rx="3" /><path d="M9 7h2M13 7h2M9 11h6" /></>),
  download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  wand: <path d="M4 20L15 9M14 4v3M18.5 5.5l-2 2M20 10h-3M9.5 5.5l2 2" />,
  jar: (<><path d="M8 3h8M9 3v3.2C6.6 7.4 5 9.6 5 12.2V18a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5.8c0-2.6-1.6-4.8-4-6V3" /><circle cx="10" cy="15" r="1.4" /><circle cx="14" cy="13" r="1.4" /><circle cx="13.5" cy="17.2" r="1.4" /></>),
  scale: (<><path d="M12 4v16M8 20h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" /></>),
  book: (<><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  receipt: (<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>),
  wallet: (<><path d="M4 7a2 2 0 0 1 2-2h11v4" /><rect x="4" y="7" width="16" height="12" rx="2.5" /><path d="M16 13h4" /><circle cx="16" cy="13" r=".6" /></>),
  pie: (<><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></>),
  rocket: (<><path d="M14 4c3 0 6 3 6 6l-7 7-6-6 7-7z" /><path d="M7 11l-3 1 2 2M13 17l-1 3-2-2M15.5 8.5h.01" /></>),
  bank: <path d="M4 10l8-5 8 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, small, className, style }: { name: IconName; small?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`i${small ? ' s' : ''}${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      {PATHS[name]}
    </svg>
  );
}
