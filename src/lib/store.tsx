'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { OwnNumbers, PersonaId, State, ThemePref } from './types';
import { createState } from './data';
import { needsSettle, note, potsTotal, settle } from './logic';
import { ensureInvest, investDue, settleInvest } from './invest';
import { DICT, LANG_ATTR } from './i18n';
import { STICKERS, earnedIds } from './stickers';
import { buzz, revealTheme, setHaptics } from './fx';
import { localDay, uid } from './format';
import { hashPin, RELOCK_MS } from './lock';
import { Celebration, type Cheer } from '@/components/Celebration';
import { LockScreen } from '@/components/LockScreen';

const KEY = 'gz-state-v1';

interface ToastAction { label: string; run: () => void }

interface Ctx {
  state: State;
  /** Apply a change. Pass `undo` to show a toast with an Undo button that restores the state before it. */
  update: (recipe: (draft: State) => void, undo?: string) => void;
  reset: (persona: PersonaId, name?: string, onboarded?: boolean, own?: OwnNumbers) => void;
  toast: (msg: string, action?: ToastAction) => void;
  celebrate: (c: Omit<Cheer, 'id'>) => void;
  setTheme: (theme: ThemePref, origin?: { x: number; y: number }) => void;
  exportBackup: () => string;
  importBackup: (text: string) => boolean;
  erase: () => void;
  lockNow: () => void;
  t: (typeof DICT)['en'];
}

const StoreCtx = createContext<Ctx | null>(null);

/** Routes reachable before onboarding: the welcome flow and a shared shagun link. */
const OPEN_ROUTES = ['/welcome', '/crash', '/shagun/claim'];

const today = () => localDay();

function resolveTheme(t: ThemePref): 'light' | 'dark' {
  if (t !== 'auto') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Fill keys added after a device first saved its state; earned stickers are recorded silently. */
function prepare(s: State): State {
  const base = createState(s.persona ?? 'salary');
  const out: State = { ...base, ...s, settings: { ...base.settings, ...s.settings } };
  if (!Array.isArray(s.stickers)) out.stickers = earnedIds(out);
  if (!Array.isArray(s.snapshots)) out.snapshots = [];
  out.invest = ensureInvest(out);
  if (needsSettle(out)) settle(out);
  if (investDue(out)) settleInvest(out);
  snapshot(out);
  return out;
}

function snapshot(d: State) {
  const day = today();
  const saved = potsTotal(d);
  const last = d.snapshots[d.snapshots.length - 1];
  if (last && last.day === day) last.saved = saved;
  else d.snapshots.push({ day, saved });
  d.snapshots = d.snapshots.slice(-60);
}

function isState(x: unknown): x is State {
  const s = x as State;
  return !!s && s.v === 1 && Array.isArray(s.pots) && typeof s.monthlySpend === 'number' && typeof s.persona === 'string';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [toastMsg, setToastMsg] = useState<{ msg: string; action?: ToastAction } | null>(null);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [locked, setLocked] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cheered = useRef(new Set<string>());
  const hiddenAt = useRef<number | null>(null);
  const stateRef = useRef<State | null>(null);
  stateRef.current = state;
  const router = useRouter();
  const pathname = usePathname();

  // Load once from this device.
  useEffect(() => {
    let loaded: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isState(parsed)) loaded = parsed;
      }
    } catch {
      /* storage blocked: start fresh */
    }
    const s = prepare(structuredClone(loaded ?? createState('salary')));
    if (s.settings.lock && s.onboarded) setLocked(true);
    setState(s);
  }, []);

  // Persist.
  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Ask the browser not to evict this app's storage.
  useEffect(() => {
    if (state?.onboarded) navigator.storage?.persist?.().catch(() => {});
  }, [state?.onboarded]);

  // Pending credits invest themselves at 6 pm; orders fill, SIPs run, units get allotted.
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        const credits = needsSettle(prev);
        const invest = investDue(prev);
        if (!credits && !invest) return prev;
        const d = structuredClone(prev);
        if (credits) settle(d);
        if (invest) settleInvest(d);
        snapshot(d);
        return d;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Relock after time in the background.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_MS && stateRef.current?.settings.lock) setLocked(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // New stickers: record them, note them, and celebrate each once.
  useEffect(() => {
    if (!state || !state.onboarded) return;
    const fresh = earnedIds(state).filter((id) => !state.stickers.includes(id) && !cheered.current.has(id));
    if (!fresh.length) return;
    fresh.forEach((id) => cheered.current.add(id));
    setState((prev) => {
      if (!prev) return prev;
      const d = structuredClone(prev);
      for (const id of fresh) {
        if (d.stickers.includes(id)) continue;
        const st = STICKERS.find((x) => x.id === id)!;
        d.stickers.push(id);
        note(d, `New sticker: ${st.name}`, st.blurb, '/profile');
      }
      return d;
    });
    setCheers((q) => [
      ...q,
      ...fresh.map((id) => {
        const st = STICKERS.find((x) => x.id === id)!;
        return { id: uid(), title: st.name, body: st.blurb, icon: st.icon, href: '/profile#stickers', cta: 'See my stickers' };
      }),
    ]);
  }, [state]);

  // Theme, lite mode, language and haptics.
  const theme = state?.settings.theme;
  const lite = state?.settings.lite;
  const lang = state?.settings.language;
  const haptics = state?.settings.haptics;
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      root.dataset.theme = resolveTheme(theme);
      root.dataset.lite = String(!!lite);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])') ?? Object.assign(document.head.appendChild(document.createElement('meta')), { name: 'theme-color' });
      meta.setAttribute('content', root.dataset.theme === 'dark' ? '#0A1012' : '#F4F8F7');
      try {
        localStorage.setItem('gz-theme', JSON.stringify({ theme, lite: !!lite }));
      } catch {
        /* ignore */
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, lite]);
  useEffect(() => {
    if (lang) document.documentElement.lang = LANG_ATTR[lang];
  }, [lang]);
  useEffect(() => {
    setHaptics(haptics !== false);
  }, [haptics]);

  // Onboarding guard.
  useEffect(() => {
    if (state && !state.onboarded && !OPEN_ROUTES.some((r) => pathname.startsWith(r))) {
      router.replace('/welcome');
    }
  }, [state, pathname, router]);

  const toast = useCallback((msg: string, action?: ToastAction) => {
    setToastMsg({ msg, action });
    buzz(8);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), action ? 6000 : 3200);
  }, []);

  const update = useCallback((recipe: (draft: State) => void, undo?: string) => {
    let before: State | null = null;
    setState((prev) => {
      if (!prev) return prev;
      before = prev;
      const d = structuredClone(prev);
      recipe(d);
      snapshot(d);
      return d;
    });
    if (undo) {
      toast(undo, {
        label: 'Undo',
        run: () => {
          if (before) setState(before);
          setToastMsg(null);
          buzz([6, 30, 6]);
        },
      });
    }
  }, [toast]);

  const reset = useCallback((persona: PersonaId, name?: string, onboarded = true, own?: OwnNumbers) => {
    setState((prev) => {
      const next = createState(persona, name, onboarded, own);
      if (prev) next.settings = { ...prev.settings };
      next.stickers = earnedIds(next);
      snapshot(next);
      return next;
    });
  }, []);

  const celebrate = useCallback((c: Omit<Cheer, 'id'>) => setCheers((q) => [...q, { ...c, id: uid() }]), []);

  const setTheme = useCallback((next: ThemePref, origin?: { x: number; y: number }) => {
    revealTheme(() => {
      document.documentElement.dataset.theme = resolveTheme(next);
      setState((prev) => {
        if (!prev) return prev;
        const d = structuredClone(prev);
        d.settings.theme = next;
        return d;
      });
    }, origin);
    buzz(10);
  }, []);

  const exportBackup = useCallback(() => JSON.stringify({ app: 'groww-genz', exportedAt: new Date().toISOString(), state: stateRef.current }, null, 2), []);

  const importBackup = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      const s = parsed?.state ?? parsed;
      if (!isState(s)) return false;
      const next = prepare(structuredClone(s));
      next.onboarded = true;
      cheered.current = new Set(next.stickers);
      setState(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const erase = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem('gz-theme');
    } catch {
      /* ignore */
    }
    cheered.current = new Set();
    setCheers([]);
    setLocked(false);
    setState(createState('salary'));
    router.replace('/welcome');
  }, [router]);

  const lockNow = useCallback(() => setLocked(true), []);

  const value = useMemo<Ctx | null>(
    () => (state ? { state, update, reset, toast, celebrate, setTheme, exportBackup, importBackup, erase, lockNow, t: DICT[state.settings.language] } : null),
    [state, update, reset, toast, celebrate, setTheme, exportBackup, importBackup, erase, lockNow],
  );

  if (!value) {
    return (
      <div className="splash" aria-busy="true" aria-label="Loading">
        <div className="lp" />
      </div>
    );
  }

  if (locked && value.state.settings.lock) {
    const lock = value.state.settings.lock;
    return (
      <LockScreen
        name={value.state.name}
        onUnlock={async (pin) => {
          const ok = (await hashPin(lock.salt, pin)) === lock.hash;
          if (ok) { setLocked(false); buzz(12); }
          return ok;
        }}
        onForgot={erase}
      />
    );
  }

  const blocked = !value.state.onboarded && !OPEN_ROUTES.some((r) => pathname.startsWith(r));
  const cheer = cheers[0];

  return (
    <StoreCtx.Provider value={value}>
      {blocked ? (
        <div className="splash" aria-busy="true">
          <div className="lp" />
        </div>
      ) : (
        children
      )}
      {toastMsg && (
        <div className={`toast${toastMsg.action ? ' has-action' : ''}`} role="status" aria-live="polite">
          <span>{toastMsg.msg}</span>
          {toastMsg.action && (
            <button type="button" className="toast-act" onClick={toastMsg.action.run}>{toastMsg.action.label}</button>
          )}
        </div>
      )}
      {cheer && (
        <Celebration
          key={cheer.id}
          cheer={cheer}
          onDone={() => setCheers((q) => q.slice(1))}
          onGo={(href) => router.push(href)}
        />
      )}
    </StoreCtx.Provider>
  );
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}
