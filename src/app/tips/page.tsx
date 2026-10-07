'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Screen } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { COMPANIES, findCompany } from '@/lib/data';
import { tipOutcome } from '@/lib/logic';
import { changeWords, fmtDay, uid } from '@/lib/format';

function looksLikeLink(s: string) {
  return /^(https?:\/\/|www\.)|instagram\.com|youtube\.com|youtu\.be|t\.me|telegram|whatsapp|wa\.me/i.test(s.trim());
}

function sourceOf(s: string) {
  if (/instagram/i.test(s)) return 'Reel';
  if (/youtu/i.test(s)) return 'YouTube';
  if (/t\.me|telegram/i.test(s)) return 'Telegram group';
  if (/whatsapp|wa\.me/i.test(s)) return 'WhatsApp';
  return 'Link';
}

function Tips() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get('tab') === 'graveyard' ? 'graveyard' : 'check';
  const setTab = (t: string) => router.replace(t === 'graveyard' ? '/tips?tab=graveyard' : '/tips', { scroll: false });

  return (
    <Screen orbs={tab === 'check' ? 'b' : 'a'}>
      <div className="seg" role="tablist" aria-label="Tip Check">
        <button role="tab" aria-selected={tab === 'check'} onClick={() => setTab('check')}>Check a tip</button>
        <button role="tab" aria-selected={tab === 'graveyard'} onClick={() => setTab('graveyard')}>Tip Graveyard</button>
      </div>
      {tab === 'check' ? <Check /> : <Graveyard />}
    </Screen>
  );
}

function Check() {
  const { update } = useStore();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [stock, setStock] = useState('');
  const [handle, setHandle] = useState('');
  const [quote, setQuote] = useState('');
  const [error, setError] = useState('');
  const [clipNote, setClipNote] = useState('');
  const isLink = looksLikeLink(input);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) { setInput(text.trim()); setClipNote(''); } else setClipNote('Your clipboard is empty.');
    } catch {
      setClipNote('Clipboard access was blocked. Paste into the box instead.');
    }
  };

  const check = () => {
    const q = isLink ? stock : input;
    const c = findCompany(q);
    if (!c) {
      setError(q.trim() ? `“${q.trim()}” isn’t in the demo dataset yet.` : 'Type the stock name the tip is about.');
      return;
    }
    const id = uid();
    update((d) => {
      d.tips.unshift({
        id, companyId: c.id, checkedAt: new Date().toISOString(), parked: false, mine: true,
        source: isLink ? sourceOf(input) : 'Typed in',
        handle: handle.trim().replace(/^@/, '') || undefined,
        quote: quote.trim() || undefined,
      });
    });
    router.push(`/tips/${id}`);
  };

  return (
    <>
      <div className="col" style={{ gap: 6, marginTop: 6 }}>
        <h1 className="h1" style={{ fontSize: 32 }}>Kisi ne tip di?<br />Check before you chase.</h1>
        <p className="body">Paste what you saw. You get facts, not a verdict.</p>
      </div>

      <section className="glass col" style={{ gap: 10 }}>
        <label htmlFor="tip" className="eye" style={{ padding: '0 4px' }}>Stock name or reel link</label>
        <div className="field">
          <Icon name="link" style={{ color: 'var(--ink3)' }} />
          <input id="tip" type="text" placeholder="Paste here" value={input} list="companies" onChange={(e) => { setInput(e.target.value); setError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') check(); }} />
        </div>
        <datalist id="companies">{COMPANIES.map((c) => <option key={c.id} value={c.name} />)}</datalist>
        {!input && (
          <button className="plate row sp" onClick={paste}>
            <span className="col" style={{ gap: 2 }}><span className="cap">On your clipboard?</span><span className="med">Paste the link or name</span></span>
            <span className="chip acc">Use this</span>
          </button>
        )}
        {clipNote && <p className="err">{clipNote}</p>}
        {isLink && (
          <>
            <div className="col" style={{ gap: 8 }}>
              <label htmlFor="stock" className="eye" style={{ padding: '0 4px' }}>Which stock does it name?</label>
              <div className="field"><input id="stock" list="companies" value={stock} onChange={(e) => { setStock(e.target.value); setError(''); }} placeholder="Zentra Polymers" /></div>
            </div>
            <div className="col" style={{ gap: 8 }}>
              <label htmlFor="handle" className="eye" style={{ padding: '0 4px' }}>Who posted it? (optional)</label>
              <div className="field"><span className="pre">@</span><input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="paisa.guru.raj" autoCapitalize="none" /></div>
            </div>
            <div className="col" style={{ gap: 8 }}>
              <label htmlFor="quote" className="eye" style={{ padding: '0 4px' }}>What did they claim? (optional)</label>
              <div className="field"><input id="quote" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Will double by Diwali" /></div>
            </div>
          </>
        )}
        {error && (
          <p className="err">{error} Try {COMPANIES.slice(0, 3).map((c) => c.name.replace(' Ltd', '')).join(', ')}.</p>
        )}
      </section>

      {!isLink && (
        <section className="col" style={{ gap: 10, padding: '0 4px' }}>
          {['Plain facts about the company', 'Is the tipster SEBI-registered? Yes or no', 'A follow-up in 90 days, automatic'].map((s) => (
            <div key={s} className="row"><Icon name="check" style={{ color: 'var(--acc-ink)' }} /><span className="body ink">{s}</span></div>
          ))}
        </section>
      )}

      <div className="foot">
        <button className="btn" onClick={check} disabled={!input.trim()}>Check this tip</button>
      </div>
    </>
  );
}

function Graveyard() {
  const { state } = useStore();
  const parked = state.tips.filter((t) => t.parked);
  const rows = parked.map((t) => ({ t, o: tipOutcome(t) }));
  const resolved = rows.filter((r) => r.o.resolved);
  const lower = resolved.filter((r) => r.o.halted || r.o.after90 < 0).length;
  const nifty = resolved.length ? resolved.reduce((a, r) => a + r.o.nifty90, 0) / resolved.length : 0;
  const waiting = rows.filter((r) => !r.o.resolved);

  return (
    <>
      <h1 className="h1">
        {resolved.length ? `${lower} of your ${resolved.length} tips were lower after 90 days.` : 'No tips have reached 90 days yet.'}
      </h1>

      {resolved.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <div className="plate col" style={{ gap: 8 }}>
            <span className="dots" style={{ gap: 9 }} role="img" aria-label={`${lower} lower, ${resolved.length - lower} higher`}>
              {resolved.map((r) => <span key={r.t.id} className={`dot${r.o.halted || r.o.after90 < 0 ? ' o' : ''}`} />)}
            </span>
            <span className="cap">Hollow: lower than the day you checked. Filled: higher.</span>
          </div>
          <div className="plate row sp">
            <span className="cap ink2">Nifty 50 index fund, same days</span>
            <span className="amt" style={{ fontSize: 15 }}>{changeWords(nifty)}</span>
          </div>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Parked</h2><span className="cap">Follow-up at 90 days</span></div>
          {waiting.map(({ t, o }) => (
            <Link key={t.id} href={`/tips/${t.id}`} className="plate row">
              <div className="col grow" style={{ gap: 2 }}><span className="med">{o.company?.name.replace(' Ltd', '')}</span><span className="cap">{t.handle ? `@${t.handle}` : t.source} · checked {fmtDay(t.checkedAt)}</span></div>
              <span className="chip"><Icon name="clock" small />{fmtDay(o.due)}</span>
            </Link>
          ))}
        </section>
      )}

      {resolved.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          {resolved.map(({ t, o }) => (
            <Link key={t.id} href={`/tips/${t.id}`} className="plate row">
              <div className="col grow" style={{ gap: 2 }}><span className="med">{o.company?.name.replace(' Ltd', '')}</span><span className="cap">{t.handle ? `@${t.handle}` : t.source} · checked {fmtDay(t.checkedAt)}</span></div>
              <span className={`amt${o.halted ? ' ambx' : ''}`} style={{ fontSize: 15 }}>{o.halted ? 'Trading halted' : changeWords(o.after90)}</span>
            </Link>
          ))}
        </section>
      )}

      <p className="cap">Demo dataset of fictional companies. In the real app, outcomes come from exchange prices.</p>

      <div className="foot">
        <Link className="btn" href="/tips">Check a new tip</Link>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Tips />
    </Suspense>
  );
}
