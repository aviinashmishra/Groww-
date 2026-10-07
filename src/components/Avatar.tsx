'use client';

import { useStore } from '@/lib/store';

/** The user's initial on their chosen colour. */
export function Avatar({ size = 44, href }: { size?: number; href?: string }) {
  const { state } = useStore();
  const initial = state.name.trim().charAt(0).toUpperCase() || 'Y';
  const dark = state.avatar === '#0B1A19';
  const style = { width: size, height: size, background: state.avatar, color: dark ? '#F0F5F4' : '#0B1A19', fontSize: Math.round(size * 0.4) };
  return href ? (
    <a className="av avatar" href={href} style={style} aria-label="Your profile">{initial}</a>
  ) : (
    <span className="av avatar" style={style} aria-hidden="true">{initial}</span>
  );
}
