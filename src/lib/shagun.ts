import type { Shagun } from './types';

type Payload = Pick<Shagun, 'id' | 'to' | 'occasion' | 'amount' | 'message' | 'from' | 'claimBy'>;

/** The claim link carries the gift itself, so it opens on any phone. */
export function encodeShagun(s: Payload): string {
  const json = JSON.stringify({ i: s.id, t: s.to, o: s.occasion, a: s.amount, m: s.message, f: s.from, c: s.claimBy });
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShagun(d: string): Payload | null {
  try {
    const b64 = d.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof o.a !== 'number' || typeof o.t !== 'string') return null;
    return { id: String(o.i), to: o.t, occasion: String(o.o), amount: o.a, message: String(o.m ?? ''), from: String(o.f ?? ''), claimBy: String(o.c) };
  } catch {
    return null;
  }
}

export const GREETING: Record<string, string> = {
  Diwali: 'Shubh Deepavali',
  Rakhi: 'Happy Raksha Bandhan',
  Shaadi: 'Shaadi mubarak',
  Birthday: 'Happy birthday',
};

/** Draws the card as a 1080×1350 image for WhatsApp status and stories. */
export async function shagunImage(s: Payload & { greeting: string; amountText: string }): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const font = getComputedStyle(document.body).fontFamily;
  // ground + orbs
  ctx.fillStyle = '#ECF0F0';
  ctx.fillRect(0, 0, W, H);
  const orb = (x: number, y: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(236,240,240,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  orb(90, 120, 620, 'rgba(0,208,156,.55)');
  orb(1080, 620, 600, 'rgba(150,160,255,.5)');
  orb(160, 1300, 640, 'rgba(140,235,205,.75)');
  // card
  const x = 70, y = 70, w = W - 140, h = H - 140, r = 64;
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  // rangoli
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  ctx.translate(x + w - 120, y + 140);
  ctx.strokeStyle = '#00A87E'; ctx.lineWidth = 3;
  for (const rr of [40, 130, 250, 272]) { ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke(); }
  for (let k = 0; k < 8; k++) {
    ctx.save(); ctx.rotate((k * Math.PI) / 4);
    ctx.beginPath(); ctx.ellipse(0, -130, 37, 85, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(Math.PI / 8);
    ctx.beginPath(); ctx.ellipse(0, -74, 14, 31, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  // text
  const left = x + 70;
  ctx.fillStyle = '#00694F';
  ctx.font = `600 34px ${font}`;
  ctx.fillText(`${s.greeting.toUpperCase()}, ${s.to.toUpperCase()}`, left, y + h - 470);
  ctx.fillStyle = '#0D1B1A';
  ctx.font = `600 ${s.amountText.length > 7 ? 170 : 210}px ${font}`;
  ctx.fillText(s.amountText, left - 6, y + h - 290);
  ctx.font = `500 40px ${font}`;
  ctx.fillText('of the Nifty 50 index fund, in your name.', left, y + h - 220);
  ctx.fillStyle = 'rgba(13,27,26,.12)';
  ctx.fillRect(left, y + h - 180, w - 140, 2);
  ctx.fillStyle = '#0D1B1A';
  ctx.font = `400 38px ${font}`;
  ctx.fillText(s.message.slice(0, 48), left, y + h - 120);
  ctx.fillStyle = '#56676A';
  ctx.font = `500 30px ${font}`;
  ctx.fillText(`From ${s.from}`, left, y + h - 70);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('render failed'))), 'image/png'));
}
