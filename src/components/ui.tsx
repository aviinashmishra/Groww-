'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { useStore } from '@/lib/store';
import { HIDDEN, rupees } from '@/lib/format';

/* ---------- Screen + nav ---------- */

export function Screen({ children, orbs = 'a', nav = true }: { children: ReactNode; orbs?: 'a' | 'b' | 'c'; nav?: boolean }) {
  return (
    <>
      <div className="orbs" data-orbs={orbs} aria-hidden="true" />
      <main className="scr">{children}</main>
      {nav && <Nav />}
    </>
  );
}

const TABS: { href: string; icon: IconName; key: 'home' | 'invest' | 'lands' | 'tips' | 'circles' | 'profile'; match: string[] }[] = [
  { href: '/', icon: 'home', key: 'home', match: ['/', '/pots', '/split', '/twin', '/shagun', '/notifications', '/worth', '/jar', '/learn'] },
  { href: '/invest', icon: 'trend', key: 'invest', match: ['/invest', '/portfolio', '/stocks', '/mf', '/sips', '/orders', '/wallet', '/ipo', '/kyc'] },
  { href: '/lands', icon: 'lands', key: 'lands', match: ['/lands'] },
  { href: '/tips', icon: 'tip', key: 'tips', match: ['/tips'] },
  { href: '/circles', icon: 'circles', key: 'circles', match: ['/circles'] },
  { href: '/profile', icon: 'profile', key: 'profile', match: ['/profile', '/fun'] },
];

export function Nav() {
  const path = usePathname();
  const { t } = useStore();
  const active = TABS.find((tab) => tab.match.some((m) => (m === '/' ? path === '/' : path.startsWith(m))))?.key;
  return (
    <nav className="nav" aria-label="Main">
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.href} className={active === tab.key ? 'on' : undefined} aria-label={t.nav[tab.key]} aria-current={active === tab.key ? 'page' : undefined}>
          <Icon name={tab.icon} />
        </Link>
      ))}
    </nav>
  );
}

export function TopBar({ back, label, close }: { back?: string; label: string; close?: boolean }) {
  return (
    <div className="row" style={{ gap: 10 }}>
      {back && (
        <Link className="av" href={back} aria-label={close ? 'Close' : 'Back'}>
          <Icon name={close ? 'close' : 'back'} />
        </Link>
      )}
      <span className="eye">{label}</span>
    </div>
  );
}

/* ---------- Money respects "Hide amounts" ---------- */

export function Money({ value, className = 'amt', style, always }: { value: number; className?: string; style?: React.CSSProperties; always?: boolean }) {
  const { state } = useStore();
  const hidden = state.settings.hideAmounts && !always;
  return (
    <span className={className} style={hidden ? { ...style, color: 'var(--ink3)' } : style} aria-label={hidden ? 'Amount hidden' : undefined}>
      {hidden ? HIDDEN : rupees(value)}
    </span>
  );
}

/* ---------- Ring ---------- */

export function Ring({ fill, size = 172, children }: { fill: number; size?: number; children: ReactNode }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fill));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, display: 'block' }} aria-hidden="true">
        <circle className="rg-t" cx={size / 2} cy={size / 2} r={r} />
        {f > 0 && <circle className="rg-p" cx={size / 2} cy={size / 2} r={r} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ strokeDasharray: `${f * c} ${c}` }} />}
      </svg>
      <div className="col" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Line chart ---------- */

export interface Series { values: number[]; kind: 'a' | 'b'; length?: number }

export function LineChart({ series, height = 150, min, max, refY, refFrom, refKind = 'w', label }: {
  series: Series[]; height?: number; min?: number; max?: number; refY?: number; refFrom?: number; refKind?: 'w' | 'b'; label: string;
}) {
  const W = 318, X0 = 8, X1 = 310, Y0 = 14, Y1 = height - 14;
  const all = series.flatMap((s) => s.values);
  const lo = min ?? Math.min(...all) * 0.96;
  const hi = max ?? Math.max(...all) * 1.04;
  const y = (v: number) => Y1 - ((v - lo) / (hi - lo || 1)) * (Y1 - Y0);
  const x = (i: number, n: number) => X0 + (i / Math.max(1, n - 1)) * (X1 - X0);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height, display: 'block' }} role="img" aria-label={label}>
      <path className="ln-g" d={`M8 ${height * 0.27}h302M8 ${height * 0.53}h302M8 ${height * 0.8}h302`} />
      {refY !== undefined && (
        <path className={refKind === 'w' ? 'ln-w' : 'ln-b'} d={`M${refFrom !== undefined ? x(refFrom, series[0].length ?? series[0].values.length) : X0} ${y(refY)}H${X1}`} />
      )}
      {series.map((s, k) => {
        const n = s.length ?? s.values.length;
        if (s.values.length < 1) return null;
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i, n).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
        const last = s.values.length - 1;
        return (
          <g key={k}>
            <path className={s.kind === 'a' ? 'ln-a' : 'ln-b'} d={d} />
            <circle className={s.kind === 'a' ? 'pt-a' : 'pt-b'} cx={x(last, n)} cy={y(s.values[last])} r={s.kind === 'a' ? 6 : 5} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Sheet (native dialog: focus trap + Esc for free) ---------- */

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const programmatic = useRef(false);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) {
      programmatic.current = true;
      d.close();
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="sheet glass"
      aria-label={label}
      onClose={() => {
        if (programmatic.current) {
          programmatic.current = false;
          return;
        }
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet-in">
          <div className="grab" />
          {children}
        </div>
      )}
    </dialog>
  );
}

/* ---------- Small parts ---------- */

export function Toggle({ on, onChange, labelledBy, label }: { on: boolean; onChange: (v: boolean) => void; labelledBy?: string; label?: string }) {
  return <button type="button" className="tog" role="switch" aria-checked={on} aria-labelledby={labelledBy} aria-label={label} onClick={() => onChange(!on)} />;
}

export function Dots({ values, size }: { values: boolean[]; size?: number }) {
  return (
    <span className="dots" role="img" aria-label={`${values.filter(Boolean).length} of ${values.length} showed up`}>
      {values.map((v, i) => (
        <span key={i} className={`dot${v ? '' : ' o'}`} style={size ? { width: size, height: size } : undefined} />
      ))}
    </span>
  );
}

export function AmountField({ id, value, onChange, label, max }: { id: string; value: string; onChange: (v: string) => void; label: string; max?: number }) {
  return (
    <div className="col" style={{ gap: 8 }}>
      <label htmlFor={id} className="eye" style={{ padding: '0 4px' }}>{label}</label>
      <div className="field">
        <span className="pre">₹</span>
        <input id={id} inputMode="numeric" autoComplete="off" value={value} placeholder="0" onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ''))} />
        {max !== undefined && (
          <button type="button" className="chip" onClick={() => onChange(String(max))}>Max</button>
        )}
      </div>
    </div>
  );
}
