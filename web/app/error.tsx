'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="route-error" role="alert">
      <section className="route-error-card surface-card" aria-labelledby="route-error-title">
        <div className="eyebrow">Something interrupted the celebration</div>
        <h1 id="route-error-title">This page could not be opened.</h1>
        <p>Nothing you entered has been intentionally discarded. Try loading this part of the wedding experience again.</p>
        <button className="button button-primary" type="button" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
