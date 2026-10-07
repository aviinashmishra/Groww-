'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Screen, TopBar, Toggle, Money, Sheet, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { PinPad } from '@/components/LockScreen';
import { ThemeSwitch } from '@/components/Theme';
import { useStore } from '@/lib/store';
import { AVATAR_COLORS, PERSONAS } from '@/lib/data';
import { hashPin, lockSupported, newSalt } from '@/lib/lock';
import { fmtDate, parseAmount, rupees } from '@/lib/format';
import type { Language, PersonaId } from '@/lib/types';

const LANGS: [Language, string, string?][] = [['en', 'English'], ['hinglish', 'Hinglish'], ['hi', 'हिन्दी', 'hi'], ['mr', 'मराठी', 'mr']];

type SheetName = null | 'profile' | 'pin' | 'erase' | 'reset' | 'restore';

export default function Settings() {
  const { state, update, toast, exportBackup, importBackup, erase, lockNow } = useStore();
  const [sheet, setSheet] = useState<SheetName>(null);
  const file = useRef<HTMLInputElement>(null);
  const s = state.settings;
  const never = state.pots.find((p) => p.bucket === 'never');

  const download = () => {
    const blob = new Blob([exportBackup()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `groww-genz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup saved. Keep it somewhere safe.');
  };

  return (
    <Screen orbs="c">
      <TopBar back="/profile" label="Profile · settings" />
      <h1 className="h1" style={{ fontSize: 32 }}>Your app,<br />your rules.</h1>

      {/* You */}
      <button className="glass row" style={{ textAlign: 'left', font: 'inherit', color: 'inherit', width: '100%' }} onClick={() => setSheet('profile')}>
        <Avatar size={52} />
        <span className="col grow" style={{ gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>{state.name}</span>
          <span className="cap">{state.settings.hideAmounts ? 'Amounts hidden' : `${rupees(state.monthlyIncome)} in · ${rupees(state.monthlySpend)} a month`} · {state.sample ? 'sample data' : 'your numbers'}</span>
        </span>
        <span className="chip"><Icon name="edit" small />Edit</span>
      </button>

      {/* Privacy & security */}
      <section className="glass col" style={{ gap: 12 }}>
        <span className="eye" style={{ padding: '0 4px' }}>Privacy and security</span>
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
        <div className="row">
          <div className="ico n"><Icon name="lock" /></div>
          <div className="col grow">
            <span id="lock-l" className="med">App lock</span>
            <span className="cap">{s.lock ? 'PIN on open, and after a minute away' : lockSupported() ? '4-digit PIN. Stored only as a salted hash.' : 'Needs a secure (https) connection'}</span>
          </div>
          <Toggle
            on={!!s.lock}
            labelledBy="lock-l"
            onChange={(v) => {
              if (!lockSupported()) { toast('App lock needs https. It works once deployed.'); return; }
              if (v) setSheet('pin');
              else { update((d) => { d.settings.lock = null; }); toast('App lock off'); }
            }}
          />
        </div>
        {s.lock && (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn2" style={{ minHeight: 48 }} onClick={() => setSheet('pin')}>Change PIN</button>
            <button className="btn2" style={{ minHeight: 48 }} onClick={lockNow}><Icon name="lock" small />Lock now</button>
          </div>
        )}
      </section>

      {/* Look & feel */}
      <section className="glass col" style={{ gap: 12 }}>
        <span className="eye" style={{ padding: '0 4px' }}>Look and feel</span>
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
          <div className="ico n"><Icon name="heart" /></div>
          <div className="col grow"><span id="hap-l" className="med">Vibration</span><span className="cap">Little taps on saves, swipes and stickers</span></div>
          <Toggle on={s.haptics} labelledBy="hap-l" onChange={(v) => update((d) => { d.settings.haptics = v; })} />
        </div>
        <div className="row">
          <div className="ico n"><Icon name="twin" /></div>
          <div className="col grow"><span id="pause-l" className="med">24-hour pause before I sell</span><span className="cap">Lazy Twin steps in on Never touch pots</span></div>
          <Toggle on={state.twin.pauseBeforeSell} labelledBy="pause-l" onChange={(v) => update((d) => { d.twin.pauseBeforeSell = v; })} />
        </div>
        <div className="col" style={{ gap: 8 }}>
          <div className="row">
            <div className="ico n"><Icon name="globe" /></div>
            <div className="col grow"><span className="med">Language</span><span className="cap">Numbers always read as ₹1,25,000</span></div>
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {LANGS.map(([code, label, lang]) => (
              <button key={code} className="chip" lang={lang} aria-pressed={s.language === code} onClick={() => update((d) => { d.settings.language = code; })}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Your data */}
      <section className="glass col" style={{ gap: 8 }}>
        <span className="eye" style={{ padding: '0 4px' }}>Your data, forever</span>
        <p className="cap" style={{ padding: '0 4px' }}>Everything lives on this phone, not on a server. Back it up to move phones or keep it safe.</p>
        <button className="plate row" onClick={download}>
          <div className="ico"><Icon name="download" /></div>
          <span className="col grow"><span className="med">Save a backup</span><span className="cap">One small file with all your pots, history and stickers</span></span>
        </button>
        <button className="plate row" onClick={() => setSheet('restore')}>
          <div className="ico n"><Icon name="refresh" /></div>
          <span className="col grow"><span className="med">Restore from a backup</span><span className="cap">Replaces what’s on this phone</span></span>
        </button>
        <button className="plate row" onClick={() => setSheet('reset')}>
          <div className="ico n"><Icon name="sliders" /></div>
          <span className="col grow"><span className="med">Start over</span><span className="cap">With your own numbers or sample data</span></span>
        </button>
        <button className="plate row" onClick={() => setSheet('erase')}>
          <div className="ico w"><Icon name="trash" /></div>
          <span className="col grow"><span className="med" style={{ color: 'var(--amb-ink)' }}>Erase everything</span><span className="cap">Wipes this phone’s data. Can’t be undone.</span></span>
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            const ok = importBackup(await f.text());
            toast(ok ? 'Restored. Welcome back.' : 'That file isn’t a backup from this app.');
            setSheet(null);
          }}
        />
      </section>

      <p className="cap center">Here since {fmtDate(state.joinedAt)}</p>

      <div className="foot">
        <Link className="btn" href="/">Done</Link>
      </div>

      {sheet === 'profile' && <ProfileSheet onClose={() => setSheet(null)} />}
      {sheet === 'pin' && <PinSheet onClose={() => setSheet(null)} />}
      {sheet === 'reset' && <ResetSheet onClose={() => setSheet(null)} />}

      <Sheet open={sheet === 'restore'} onClose={() => setSheet(null)} label="Restore from a backup">
        <h2 className="h1" style={{ fontSize: 26 }}>Restore a backup?</h2>
        <p className="body">Pick a backup file you saved earlier. It replaces everything on this phone right now.</p>
        <button className="btn" onClick={() => file.current?.click()}><Icon name="download" />Choose backup file</button>
        <button className="ghost" onClick={() => setSheet(null)}>Cancel</button>
      </Sheet>

      <Sheet open={sheet === 'erase'} onClose={() => setSheet(null)} label="Erase everything">
        <div className="ico w" style={{ width: 52, height: 52, borderRadius: 18 }}><Icon name="warn" /></div>
        <h2 className="h1" style={{ fontSize: 26 }}>Erase everything on this phone?</h2>
        <p className="body">Pots, history, stickers, settings and your PIN. There’s no account behind this app, so nothing can bring it back unless you saved a backup.</p>
        <button className="btn2" onClick={download}><Icon name="download" small />Save a backup first</button>
        <button className="ghost" style={{ color: 'var(--amb-ink)' }} onClick={erase}>Erase and start over</button>
      </Sheet>
    </Screen>
  );
}

function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore();
  const [name, setName] = useState(state.name);
  const [income, setIncome] = useState(String(state.monthlyIncome));
  const [spend, setSpend] = useState(String(state.monthlySpend));
  const [color, setColor] = useState(state.avatar);
  const sp = parseAmount(spend);
  return (
    <Sheet open onClose={onClose} label="Edit profile">
      <h2 className="h1" style={{ fontSize: 26 }}>You</h2>
      <div className="col" style={{ gap: 8 }}>
        <label htmlFor="pf-name" className="eye" style={{ padding: '0 4px' }}>Name</label>
        <div className="field"><input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoComplete="given-name" /></div>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <span className="eye" id="pf-col" style={{ padding: '0 4px' }}>Colour</span>
        <div className="swatches" role="group" aria-labelledby="pf-col">
          {AVATAR_COLORS.map((c) => (
            <button key={c} aria-pressed={color === c} aria-label={`Colour ${c}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
      <AmountField id="pf-inc" label="Monthly income" value={income} onChange={setIncome} />
      <AmountField id="pf-sp" label="A month costs me" value={spend} onChange={setSpend} />
      <button
        className="btn"
        disabled={!name.trim() || sp < 1}
        onClick={() => {
          update((d) => { d.name = name.trim(); d.avatar = color; d.monthlyIncome = parseAmount(income); d.monthlySpend = sp; });
          toast('Saved. Everything updates to match.');
          onClose();
        }}
      >
        Save
      </button>
    </Sheet>
  );
}

function PinSheet({ onClose }: { onClose: () => void }) {
  const { update, toast } = useStore();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  return (
    <Sheet open onClose={onClose} label="Set a PIN">
      <PinPad
        key={first ? 'confirm' : 'enter'}
        title={first ? 'Once more, to be sure' : 'Choose a 4-digit PIN'}
        sub={first ? undefined : 'Pick something only you know. Not your birthday.'}
        error={error}
        errorKey={tries}
        onDone={async (pin) => {
          if (!first) { setFirst(pin); setError(null); return; }
          if (pin !== first) { setFirst(null); setTries((t) => t + 1); setError('Those didn’t match. Start again.'); return; }
          const salt = newSalt();
          const hash = await hashPin(salt, pin);
          update((d) => { d.settings.lock = { salt, hash }; });
          toast('App lock on. Only you get in.');
          onClose();
        }}
      />
    </Sheet>
  );
}

function ResetSheet({ onClose }: { onClose: () => void }) {
  const { state, update, reset, toast } = useStore();
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaId>(state.persona);
  return (
    <Sheet open onClose={onClose} label="Start over">
      <h2 className="h1" style={{ fontSize: 26 }}>Start over</h2>
      <button
        className="plate row"
        onClick={() => { update((d) => { d.onboarded = false; }); onClose(); router.push('/welcome'); }}
      >
        <div className="ico"><Icon name="edit" /></div>
        <span className="col grow"><span className="med">With my own numbers</span><span className="cap">Two quick steps: you, then income, spend and savings</span></span>
        <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
      </button>
      <span className="eye" style={{ padding: '4px 4px 0' }}>Or explore with sample data</span>
      <div className="col" style={{ gap: 6 }}>
        {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
          <button key={id} className={`plate row${persona === id ? ' you' : ''}`} aria-pressed={persona === id} onClick={() => setPersona(id)}>
            <span className="col grow"><span className="med">{PERSONAS[id].label}</span><span className="cap">{PERSONAS[id].blurb}</span></span>
            <span className={`dot${persona === id ? '' : ' o'}`} />
          </button>
        ))}
      </div>
      <p className="cap">Your display settings and PIN stay. Save a backup first if you want to come back.</p>
      <button
        className="btn"
        onClick={() => {
          reset(persona, state.name, true);
          onClose();
          toast(`Sample data: ${PERSONAS[persona].label}`);
          router.push('/');
        }}
      >
        Load sample data
      </button>
    </Sheet>
  );
}
