'use client';

import { useRef } from 'react';

const events = [
  { title: 'Ganesh Puja', note: 'A serene open-air beginning with ivory details, brass accents and sacred florals.' },
  { title: 'Haldi', note: 'Warm turmeric, marigold and Mithila-inspired miniature styling.' },
  { title: 'Mehendi', note: 'Emerald foliage, intricate mehendi motifs and elegant handcrafted textures.' },
  { title: 'Matkor', note: 'Earth, water and Bihar wedding traditions interpreted as a cinematic diorama.' },
  { title: 'Marwa', note: 'A richly layered Bihari mandap environment reserved for the traditional ceremony.' },
  { title: 'Shubh Vivah', note: 'The grand wedding scene with canopy, mountains, pine forest and luminous stage.' }
];

export default function EventCarousel() {
  const track = useRef<HTMLDivElement>(null);

  const move = (direction: number) => {
    track.current?.scrollBy({ left: direction * Math.max(280, track.current.clientWidth * 0.72), behavior: 'smooth' });
  };

  return (
    <section className="section" id="events" aria-labelledby="events-title">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
          <div>
            <span className="eyebrow">Celebration journey</span>
            <h2 id="events-title">Wedding events in miniature worlds</h2>
          </div>
          <div className="actions" aria-label="Carousel controls">
            <button className="button button-secondary" type="button" onClick={() => move(-1)} aria-label="Previous events">←</button>
            <button className="button button-secondary" type="button" onClick={() => move(1)} aria-label="Next events">→</button>
          </div>
        </div>
        <div
          ref={track}
          style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(17rem, 32%)', gap: '1rem', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '.5rem 0 1.25rem' }}
        >
          {events.map((event, index) => (
            <article
              key={event.title}
              className="card"
              style={{ minHeight: '20rem', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', justifyContent: 'end', position: 'relative', overflow: 'hidden', background: `linear-gradient(155deg, rgba(122,31,61,${0.08 + index * 0.012}), rgba(255,250,242,.92) 48%, rgba(199,166,106,.48))` }}
            >
              <span className="eyebrow">0{index + 1}</span>
              <h3>{event.title}</h3>
              <p>{event.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
