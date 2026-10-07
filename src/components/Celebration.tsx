'use client';

import { useEffect, useRef } from 'react';
import { Icon, type IconName } from './Icon';
import { buzz, reducedMotion } from '@/lib/fx';

export interface Cheer {
  id: string;
  title: string;
  body: string;
  icon: IconName;
  eyebrow?: string;
  href?: string;
  cta?: string;
}

const COLORS = ['#00D09C', '#8CEBCD', '#96A0FF', '#F5A524', '#00A87E', '#FFFFFF'];

/** A short burst of paper confetti, drawn once on a canvas. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || reducedMotion()) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.scale(dpr, dpr);
    const parts = Array.from({ length: 110 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H * 0.42,
      vx: (Math.random() - 0.5) * 13,
      vy: -Math.random() * 15 - 5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.3,
    }));
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 2600);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      }
      if (t < 2600) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

export function Celebration({ cheer, onDone, onGo }: { cheer: Cheer; onDone: () => void; onGo: (href: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    buzz([18, 40, 18]);
  }, [cheer.id]);
  return (
    <dialog ref={ref} className="cheer" aria-labelledby="cheer-t" onClose={onDone}>
      <Confetti />
      <div className="cheer-card glass">
        <div className="cheer-badge"><Icon name={cheer.icon} style={{ width: 34, height: 34 }} /></div>
        <span className="eye accx">{cheer.eyebrow ?? 'New sticker'}</span>
        <h2 id="cheer-t" className="h1" style={{ fontSize: 30, textAlign: 'center' }}>{cheer.title}</h2>
        <p className="body center">{cheer.body}</p>
        <div className="col" style={{ gap: 2, width: '100%' }}>
          {cheer.href ? (
            <>
              <button className="btn" autoFocus onClick={() => { ref.current?.close(); onGo(cheer.href!); }}>{cheer.cta ?? 'See it'}</button>
              <button className="ghost" onClick={() => ref.current?.close()}>Nice</button>
            </>
          ) : (
            <button className="btn" autoFocus onClick={() => ref.current?.close()}>Nice</button>
          )}
        </div>
      </div>
    </dialog>
  );
}
