'use client';

/** Last-resort boundary when the root layout itself fails. Plain styles: globals.css may not have loaded. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F8F7', color: '#0B1A19', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 360, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>The app hit a snag.</h1>
          <p style={{ color: '#3C4E4C', lineHeight: 1.5 }}>Your data is safe on this phone. Reloading usually fixes it.</p>
          <button onClick={reset} style={{ marginTop: 12, height: 52, padding: '0 28px', border: 0, borderRadius: 26, background: '#00D09C', color: '#04261D', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
