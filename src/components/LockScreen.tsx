'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { buzz } from '@/lib/fx';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/** Full-screen PIN pad. Works with taps and the keyboard. */
export function PinPad({ title, sub, onDone, error, errorKey = 0 }: { title: string; sub?: string; onDone: (pin: string) => void; error?: string | null; errorKey?: number }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { box.current?.focus(); }, []);
  useEffect(() => {
    if (!error) return;
    setShake(true);
    buzz([30, 40, 30]);
    setPin('');
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [error, errorKey]);

  const press = (k: string) => {
    if (k === 'del') { setPin((p) => p.slice(0, -1)); return; }
    if (!k) return;
    buzz(5);
    if (pin.length >= 4) return;
    const n = pin + k;
    setPin(n);
    if (n.length === 4) setTimeout(() => onDone(n), 120);
  };

  return (
    <div
      ref={box}
      className="pin"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) press(e.key);
        if (e.key === 'Backspace') press('del');
      }}
    >
      <div className="lp" style={{ width: 56, height: 56 }} />
      <h1 className="h1" style={{ textAlign: 'center' }}>{title}</h1>
      {sub && <p className="body center">{sub}</p>}
      <div className={`pin-dots${shake ? ' shake' : ''}`} role="img" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length ? 'on' : ''} />)}
      </div>
      <p className="err" aria-live="assertive" style={{ minHeight: 18 }}>{error ?? ''}</p>
      <div className="pin-keys">
        {KEYS.map((k, i) =>
          k === '' ? <span key={i} /> : (
            <button key={i} type="button" onClick={() => press(k)} aria-label={k === 'del' ? 'Delete' : k}>
              {k === 'del' ? <Icon name="back" /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export function LockScreen({ name, onUnlock, onForgot }: { name: string; onUnlock: (pin: string) => Promise<boolean>; onForgot: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="lockscreen">
      <div className="orbs" data-orbs="c" aria-hidden="true" />
      {confirming ? (
        <div className="pin">
          <div className="ico w" style={{ width: 56, height: 56, borderRadius: 18 }}><Icon name="warn" /></div>
          <h1 className="h1" style={{ textAlign: 'center' }}>Erase this phone’s data?</h1>
          <p className="body center">Your PIN can’t be recovered; we never stored it. Erasing removes everything saved on this phone. If you exported a backup, you can restore it after.</p>
          <div className="col" style={{ gap: 8, width: '100%', maxWidth: 320 }}>
            <button className="btn2" onClick={() => setConfirming(false)}>Go back</button>
            <button className="ghost" style={{ color: 'var(--amb-ink)' }} onClick={onForgot}>Erase and start over</button>
          </div>
        </div>
      ) : (
        <>
          <PinPad
            title={`Welcome back, ${name}`}
            sub="Enter your 4-digit PIN"
            error={error}
            errorKey={tries}
            onDone={async (pin) => {
              const ok = await onUnlock(pin);
              if (!ok) { setTries((t) => t + 1); setError(`Wrong PIN${tries >= 2 ? '. Take a breath, then try again.' : '.'}`); }
            }}
          />
          <button className="ghost" style={{ position: 'relative', marginTop: 4 }} onClick={() => setConfirming(true)}>Forgot PIN?</button>
        </>
      )}
    </div>
  );
}
