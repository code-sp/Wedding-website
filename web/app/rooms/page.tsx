'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { api } from '@/lib/api';
import styles from '../feature-overview.module.css';

type Room = { id: string | number; name?: string; type?: string; capacity?: number; price?: string | number; available?: number };
type Settings = { rooms?: Room[] };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api.session();
        const settings = await api.content<Settings>('client_settings', user.clientId);
        if (!cancelled) setRooms(settings?.rooms || []);
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
          <div className="eyebrow">Stay with us</div>
          <h1>Wedding accommodation.</h1>
          <p>Browse the room configuration published for this wedding. Final allocation is confirmed by the organisers.</p>
        </section>
        {loading ? <div className={styles.empty}>Loading rooms…</div> : rooms.length ? (
          <div className={styles.grid}>
            {rooms.map((room) => (
              <article className={styles.card} key={room.id}>
                <h2>{room.name || 'Wedding room'}</h2>
                <p>{room.type || 'Accommodation'}</p>
                <div className={styles.meta}>
                  {room.capacity ? <span>Up to {room.capacity} guests</span> : null}
                  {typeof room.available === 'number' ? <span>{room.available} available</span> : null}
                  {room.price ? <span>{room.price}</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : <div className={styles.empty}>Room details will appear here when the organisers publish accommodation.</div>}
      </main>
    </div>
  );
}
