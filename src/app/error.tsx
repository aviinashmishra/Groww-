'use client';

import { useEffect } from 'react';

/** Any screen that crashes lands here. Data lives in localStorage, so it is never lost by a crash. */
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const saveRaw = () => {
    try {
      const raw = localStorage.getItem('gz-state-v1') ?? '{}';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      a.download = `groww-genz-rescue-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch {
      /* nothing to save */
    }
  };

  return (
    <main className="scr">
      <div className="orbs" data-orbs="c" aria-hidden="true" />
      <span className="eye">Something broke</span>
      <h1 className="h1" style={{ fontSize: 36, lineHeight: 1.08 }}>That’s on us, not you.</h1>
      <p className="body">This screen hit a bug. Your pots and history are safe on this phone; nothing was lost.</p>
      <div className="foot nonav">
        <button className="btn" onClick={reset}>Try again</button>
        <button className="btn2" onClick={() => { window.location.href = '/'; }}>Go home</button>
        <button className="ghost" onClick={saveRaw}>Save a copy of my data</button>
      </div>
    </main>
  );
}
