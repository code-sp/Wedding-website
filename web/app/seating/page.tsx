'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { api } from '@/lib/api';
import styles from '../feature-overview.module.css';

type Section = { id: string; name?: string; type?: string; rows?: number; colsPerSide?: number; price?: number };
type Settings = { seatingConfig?: Section[] };

export default function SeatingPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api.session();
        const settings = await api.content<Settings>('client_settings', user.clientId);
        if (!cancelled) setSections(settings?.seatingConfig || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="eyebrow">Seating preview</div>
          <h1>Your celebration, comfortably arranged.</h1>
          <p>The configured seating sections are shown here without exposing another guest’s assignment. Interactive seat locking will use the same secure session identity.</p>
        </section>
        {loading ? <div className={styles.empty}>Loading seating…</div> : sections.length ? (
          <div className={styles.grid}>
            {sections.map((section) => (
              <article className={styles.card} key={section.id}>
                <h2>{section.name || section.id}</h2>
                <p>{section.type === 'sofa' ? 'Lounge-style seating' : 'Individual seating'}</p>
                <div className={styles.meta}>
                  {section.rows ? <span>{section.rows} rows</span> : null}
                  {section.colsPerSide ? <span>{section.colsPerSide} per side</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : <div className={styles.empty}>Seating details will appear here when the organisers publish a layout.</div>}
      </main>
    </div>
  );
}
