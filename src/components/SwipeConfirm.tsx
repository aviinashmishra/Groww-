'use client';

import { useRef, useState } from 'react';
import { Icon, type IconName } from './Icon';
import { buzz } from '@/lib/fx';

/**
 * Slide to confirm. Big money moves get a deliberate gesture instead of a tap.
 * Keyboard and switch users press Enter or Space on the focused control.
 */
export function SwipeConfirm({ label, onConfirm, warn, icon = 'arrowR', disabled }: { label: string; onConfirm: () => void; warn?: boolean; icon?: IconName; disabled?: boolean }) {
  const track = useRef<HTMLButtonElement>(null);
  const [x, setX] = useState(0);
  const [done, setDone] = useState(false);
  const drag = useRef<{ start: number; max: number } | null>(null);
  const crossed = useRef(false);

  const finish = () => {
    setDone(true);
    buzz([10, 30, 20]);
    onConfirm();
  };

  return (
    <button
      ref={track}
      type="button"
      className={`swipe${warn ? ' warn' : ''}${done ? ' done' : ''}`}
      aria-label={`${label}. Slide, or press Enter, to confirm`}
      disabled={disabled || done}
      onClick={(e) => {
        // Keyboard activation reports detail 0; pointer taps don't confirm.
        if (e.detail === 0 && !done) finish();
      }}
      onPointerDown={(e) => {
        if (disabled || done || !track.current) return;
        const w = track.current.getBoundingClientRect().width;
        drag.current = { start: e.clientX - x, max: w - 60 };
        crossed.current = false;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const nx = Math.max(0, Math.min(d.max, e.clientX - d.start));
        setX(nx);
        if (!crossed.current && nx > d.max * 0.9) {
          crossed.current = true;
          buzz(6);
        }
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (x > d.max * 0.9) {
          setX(d.max);
          finish();
        } else setX(0);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setX(0);
      }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <span className="fill" style={{ width: x + 60 }} />
      <span className="lbl" style={{ opacity: Math.max(0, 1 - x / 160) }}><span className="shine">{label}</span></span>
      <span className="knob" style={{ left: 4 + x, transition: drag.current ? 'none' : 'left .25s cubic-bezier(.2,.8,.2,1)' }}>
        <Icon name={done ? 'check' : icon} />
      </span>
    </button>
  );
}
