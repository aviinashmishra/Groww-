'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar, Toggle, Money, Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { PERSONAS } from '@/lib/data';
import type { Language, PersonaId } from '@/lib/types';
import { ThemeSwitch } from '@/components/Theme';

const LANGS: [Language, string, string?][] = [['en', 'English'], ['hinglish', 'Hinglish'], ['hi', 'हिन्दी', 'hi'], ['mr', 'मराठी', 'mr']];

export default function Settings() {
  const { state, update, reset, toast } = useStore();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const [persona, setPersona] = useState<PersonaId>(state.persona);
  const s = state.settings;
  const never = state.pots.find((p) => p.bucket === 'never');

  return (
    <Screen orbs="c">
      <TopBar back="/profile" label="Profile · settings" />
      <h1 className="h1" style={{ fontSize: 32 }}>Your screen,<br />your rules.</h1>

      <section className="glass col" style={{ gap: 12 }}>
        <div className="row">
          <div className="ico n"><Icon name="eyeOff" /></div>
          <div className="col grow"><span id="hide-l" className="med">Hide amounts</span><span className="cap">For the metro, the mess, the family sofa</span></div>
          <Toggle on={s.hideAmounts} labelledBy="hide-l" onChange={(v) => update((d) => { d.settings.hideAmounts = v; })} />
        </div>
        {never && (
          <div className="plate row sp">
            <div className="col"><span className="eye">Never touch</span><span className="med">{never.name}</span></div>
            <Money value={never.balance} />
          </div>
        )}
        <div className="hr" />
        <div className="col" style={{ gap: 10 }}>
          <div className="row">
            <div className="ico n"><Icon name={s.theme === 'dark' ? 'moon' : s.theme === 'light' ? 'sun' : 'auto'} /></div>
            <div className="col grow"><span className="med">Theme</span><span className="cap">{s.theme === 'auto' ? 'Follows your phone' : s.theme === 'dark' ? 'Always dark' : 'Always light'}</span></div>
          </div>
          <ThemeSwitch />
        </div>
        <div className="row">
          <div className="ico n"><Icon name="bolt" /></div>
          <div className="col grow"><span id="lite-l" className="med">Lite mode</span><span className="cap">No blur. Smoother on slower phones.</span></div>
          <Toggle on={s.lite} labelledBy="lite-l" onChange={(v) => update((d) => { d.settings.lite = v; })} />
        </div>
        <div className="row">
          <div className="ico n"><Icon name="twin" /></div>
          <div className="col grow"><span id="pause-l" className="med">24-hour pause before I sell</span><span className="cap">Lazy Twin steps in on Never touch pots</span></div>
          <Toggle on={state.twin.pauseBeforeSell} labelledBy="pause-l" onChange={(v) => update((d) => { d.twin.pauseBeforeSell = v; })} />
        </div>
      </section>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="row">
          <div className="ico n"><Icon name="globe" /></div>
          <div className="col grow"><span className="med">Language</span><span className="cap">Numbers always read as ₹1,25,000</span></div>
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          {LANGS.map(([code, label, lang]) => (
            <button key={code} className="chip" lang={lang} aria-pressed={s.language === code} onClick={() => update((d) => { d.settings.language = code; })}>{label}</button>
          ))}
        </div>
      </section>

      <section className="glass col" style={{ gap: 8 }}>
        <span className="eye" style={{ padding: '0 4px' }}>Demo</span>
        <button className="plate row" onClick={() => setResetOpen(true)}>
          <div className="ico n"><Icon name="refresh" /></div>
          <span className="col grow"><span className="med">Switch profile or reset</span><span className="cap">Now: {PERSONAS[state.persona].label}</span></span>
          <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
        </button>
      </section>

      <div className="foot">
        <Link className="btn" href="/">Done</Link>
      </div>

      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} label="Switch profile">
        <h2 className="h1" style={{ fontSize: 26 }}>Start over as</h2>
        <div className="col" style={{ gap: 6 }}>
          {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
            <button key={id} className={`plate row${persona === id ? ' you' : ''}`} aria-pressed={persona === id} onClick={() => setPersona(id)}>
              <span className="col grow"><span className="med">{PERSONAS[id].label}</span><span className="cap">{PERSONAS[id].blurb}</span></span>
              <span className={`dot${persona === id ? '' : ' o'}`} />
            </button>
          ))}
        </div>
        <p className="cap">Pots, credits, tips and your licence go back to the sample data. Your display settings stay.</p>
        <button
          className="btn"
          onClick={() => {
            reset(persona, state.name, true);
            setResetOpen(false);
            toast(`Reset as ${PERSONAS[persona].label}`);
            router.push('/');
          }}
        >
          Reset demo data
        </button>
      </Sheet>
    </Screen>
  );
}
