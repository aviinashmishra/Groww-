import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="scr">
      <div className="orbs" data-orbs="c" aria-hidden="true" />
      <span className="eye">404</span>
      <h1 className="h1" style={{ fontSize: 38, lineHeight: 1.08 }}>This page doesn’t exist.<br />Your money does.</h1>
      <div className="foot nonav">
        <Link className="btn" href="/">Back home</Link>
      </div>
    </main>
  );
}
