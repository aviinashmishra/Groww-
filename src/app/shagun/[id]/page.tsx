'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar, Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { note } from '@/lib/logic';
import { encodeShagun, GREETING, shagunImage } from '@/lib/shagun';
import { fmtDay, rupees } from '@/lib/format';
import type { Shagun } from '@/lib/types';

function Rangoli() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" style={{ position: 'absolute', top: -125, right: -95, width: 300, height: 300 }}>
      <g style={{ fill: 'none', stroke: 'var(--acc-line)', strokeWidth: 1.2 }}>
        {[14, 46, 88, 96].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
        {Array.from({ length: 8 }, (_, k) => <ellipse key={`a${k}`} cx="100" cy="54" rx="13" ry="30" transform={`rotate(${k * 45} 100 100)`} />)}
        {Array.from({ length: 8 }, (_, k) => <ellipse key={`b${k}`} cx="100" cy="74" rx="5" ry="11" transform={`rotate(${22.5 + k * 45} 100 100)`} />)}
      </g>
    </svg>
  );
}

function ShagunCard({ s }: { s: Pick<Shagun, 'to' | 'occasion' | 'amount' | 'message' | 'from'> }) {
  return (
    <section className="glass" style={{ padding: 10 }}>
      <div className="plate col" style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 22, gap: 6, minHeight: 400, justifyContent: 'flex-end' }}>
        <Rangoli />
        <span className="eye accx" style={{ position: 'relative' }}>{GREETING[s.occasion] ?? s.occasion}, {s.to}</span>
        <span className="hero" style={{ position: 'relative', fontSize: s.amount >= 10000 ? 64 : 84 }}>{rupees(s.amount)}</span>
        <span style={{ position: 'relative', fontSize: 17, fontWeight: 500 }}>of the Nifty 50 index fund, in your name.</span>
        <div className="hr" style={{ margin: '10px 0 6px' }} />
        <p className="body ink" style={{ position: 'relative' }}>{s.message}</p>
        <span className="cap" style={{ position: 'relative' }}>From {s.from}</span>
      </div>
    </section>
  );
}

export default function ShagunCardPage() {
  const { id } = useParams<{ id: string }>();
  const { state, update, toast } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const s = state.shaguns.find((x) => x.id === id);

  if (!s) {
    return (
      <Screen orbs="c" nav={false}>
        <TopBar back="/shagun" label="Shagun" />
        <h1 className="h1">This card isn’t here any more.</h1>
        <div className="foot nonav"><Link className="btn" href="/shagun">Send a shagun</Link></div>
      </Screen>
    );
  }

  const share = async () => {
    const url = `${window.location.origin}/shagun/claim?d=${encodeShagun(s)}`;
    const text = `${GREETING[s.occasion] ?? s.occasion}, ${s.to}! A ${rupees(s.amount)} shagun that grows. Claim it here:`;
    let ok = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'A shagun for you', text, url });
        ok = true;
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        ok = true;
        toast('Link copied. Paste it in WhatsApp.');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${text} ${url}`);
          ok = true;
          toast('Link copied. Paste it in WhatsApp.');
        } catch {
          toast('Couldn’t share. Try again.');
        }
      }
    }
    if (ok && !s.shared) {
      update((d) => {
        const x = d.shaguns.find((y) => y.id === s.id);
        if (x) x.shared = true;
        note(d, `Shagun sent to ${s.to}`, `${rupees(s.amount)}, claim by ${fmtDay(s.claimBy)}.`, `/shagun/${s.id}`);
      });
    }
  };

  const saveImage = async () => {
    try {
      const blob = await shagunImage({ ...s, greeting: GREETING[s.occasion] ?? s.occasion, amountText: rupees(s.amount) });
      const file = new File([blob], `shagun-${s.to.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'A shagun for you' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast('Card saved to your downloads');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') toast('Couldn’t make the image. Try again.');
    }
  };

  return (
    <Screen orbs="c" nav={false}>
      <TopBar back="/shagun" label={s.claimed ? 'Shagun · claimed' : 'Shagun · ready to send'} />
      <ShagunCard s={s} />
      <div className="row" style={{ padding: '0 4px' }}>
        <Icon name={s.claimed ? 'check' : 'clock'} style={{ color: 'var(--ink3)' }} />
        <span className="cap grow">
          {s.claimed ? `${s.to} claimed it. It’s growing in their name now.` : `${s.to} has till ${fmtDay(s.claimBy)} to claim. You’ll know the moment they do.`}
        </span>
      </div>
      <div className="foot nonav">
        <button className="btn" onClick={share}><Icon name="share" />{s.shared ? 'Share the card again' : 'Share the card'}</button>
        <button className="btn2" onClick={saveImage}><Icon name="download" small />Save card as image</button>
        <Link className="ghost" href={`/shagun/claim?d=${encodeShagun(s)}`}>Preview what {s.to} sees</Link>
        {!s.shared && <button className="ghost" onClick={() => setEditOpen(true)}>Edit message</button>}
      </div>
      {editOpen && <EditMessage s={s} onClose={() => setEditOpen(false)} />}
    </Screen>
  );
}

function EditMessage({ s, onClose }: { s: Shagun; onClose: () => void }) {
  const { update } = useStore();
  const [m, setM] = useState(s.message);
  return (
    <Sheet open onClose={onClose} label="Edit message">
      <h2 className="h1" style={{ fontSize: 26 }}>Your message</h2>
      <div className="field">
        <label htmlFor="msg" className="sr">Message</label>
        <textarea id="msg" rows={3} value={m} maxLength={120} onChange={(e) => setM(e.target.value)} />
      </div>
      <span className="cap">{120 - m.length} characters left</span>
      <button className="btn" disabled={!m.trim()} onClick={() => { update((d) => { const x = d.shaguns.find((y) => y.id === s.id); if (x) x.message = m.trim(); }); onClose(); }}>Save</button>
    </Sheet>
  );
}
