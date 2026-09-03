'use client';

import { useRef } from 'react';

const events = [
  {
    name: 'Ganesh Puja',
    eyebrow: 'Blessings · Devotion · Faith',
    copy: 'An open-air ivory altar with brass diyas, white lotus accents and a mountain-forest backdrop.'
  },
  {
    name: 'Haldi & Matkor',
    eyebrow: 'Turmeric · Earth · Ritual',
    copy: 'Warm saffron, marigold and handmade Mithila details shaped into a playful miniature celebration.'
  },
  {
    name: 'Mehendi',
    eyebrow: 'Artistry · Tradition · Love',
    copy: 'Intricate mehendi-inspired geometry, emerald foliage and champagne-gold architectural accents.'
  },
  {
    name: 'Shubh Vivah',
    eyebrow: 'Together · Forever · शुभ विवाह',
    copy: 'The grand wedding scene with a Bihar-inspired mandap, cinematic mountain depth and premium ivory materials.'
  }
];

export default function EventCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const move = (direction: number) => {
    trackRef.current?.scrollBy({
      left: direction * Math.min(420, window.innerWidth * 0.78),
      behavior: 'smooth'
    });
  };

  return (
    <section className="section" id="events" aria-labelledby="events-title">
      <div className="container">
        <div className="eyebrow">Celebration journey</div>
        <h2 id="events-title">Wedding events in miniature worlds.</h2>
        <div className="carousel-controls" aria-label="Event carousel controls">
          <button className="carousel-arrow" type="button" onClick={() => move(-1)} aria-label="Previous event">←</button>
          <button className="carousel-arrow" type="button" onClick={() => move(1)} aria-label="Next event">→</button>
        </div>
        <div className="carousel-track" ref={trackRef}>
          {events.map((event, index) => (
            <article className="event-slide" key={event.name}>
              <div className="event-visual" aria-hidden="true">
                <div className="event-orb" />
                <div className="event-stage" />
                <div className="event-board">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{event.name}</strong>
                </div>
              </div>
              <div className="event-copy">
                <div className="eyebrow">{event.eyebrow}</div>
                <h3>{event.name}</h3>
                <p>{event.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
