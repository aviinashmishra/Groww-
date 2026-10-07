'use client';

import { Icon } from './Icon';
import { useStore } from '@/lib/store';
import type { ThemePref } from '@/lib/types';

/** One tap flips light and dark, with a circular reveal from the button. */
export function ThemeToggle() {
  const { state, setTheme } = useStore();
  const isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';
  const next: ThemePref = isDark ? 'light' : 'dark';
  return (
    <button
      className="av spin"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      data-pref={state.settings.theme}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <Icon name={isDark ? 'sun' : 'moon'} />
    </button>
  );
}

const OPTIONS: [ThemePref, string, 'sun' | 'moon' | 'auto'][] = [
  ['light', 'Light', 'sun'],
  ['dark', 'Dark', 'moon'],
  ['auto', 'Auto', 'auto'],
];

export function ThemeSwitch() {
  const { state, setTheme } = useStore();
  return (
    <div className="themeseg" role="group" aria-label="Theme">
      {OPTIONS.map(([v, label, icon]) => (
        <button
          key={v}
          aria-pressed={state.settings.theme === v}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTheme(v, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
        >
          <Icon name={icon} small />{label}
        </button>
      ))}
    </div>
  );
}
