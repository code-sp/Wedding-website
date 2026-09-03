'use client';

import { useEffect, useRef, useState } from 'react';

const scenes = [
  {
    id: 'ganesh',
    eyebrow: '॥ ॐ श्री गणेशाय नमः ॥',
    title: 'Ganesh Puja',
    copy: 'An open-air ivory altar with brass diyas, lotus details, pine forest layers and misty Himalayan-style peaks.',
    accent: '#c7a66a',
    glow: 'rgba(223, 186, 112, .35)'
  },
  {
    id: 'haldi',
    eyebrow: 'हल्दी',
    title: 'Haldi Ceremony',
    copy: 'Turmeric, marigold and warm champagne tones interpreted as a playful miniature garden celebration.',
    accent: '#d2a13a',
    glow: 'rgba(242, 191, 73, .33)'
  },
  {
    id: 'mehendi',
    eyebrow: 'मेंहदी',
    title: 'Mehendi Evening',
    copy: 'Emerald foliage, refined Mithila motifs and ornamental mehendi geometry without the haunted-hand visual language.',
    accent: '#527154',
    glow: 'rgba(82, 113, 84, .3)'
  },
  {
    id: 'wedding',
    eyebrow: 'शुभ विवाह',
    title: 'Wedding',
    copy: 'The grandest miniature scene: a Bihari-touch mandap, layered mountains, complete circular stage and cinematic depth.',
    accent: '#7a1f3d',
    glow: 'rgba(122, 31, 61, .3)'
  }
];

export function DioramaCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % scenes.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const go = (index: number) => setActive((index + scenes.length) % scenes.length);
  const scene = scenes[active];

  return (
    <section
      className="diorama-carousel"
      aria-roledescription="carousel"
      aria-label="Wedding ceremony diorama carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current == null) return;
        const end = event.changedTouches[0]?.clientX ?? touchStart.current;
        const delta = end - touchStart.current;
        if (Math.abs(delta) > 42) go(active + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="carousel-scene" style={{ '--scene-accent': scene.accent, '--scene-glow': scene.glow } as React.CSSProperties}>
        <div className="carousel-mountains back" />
        <div className="carousel-mountains front" />
        <div className="carousel-forest" />
        <div className="carousel-platform" />
        <div className="carousel-pillar carousel-pillar-left" />
        <div className="carousel-pillar carousel-pillar-right" />
        <div className="carousel-board" key={scene.id}>
          <span>{scene.eyebrow}</span>
          <h3>{scene.title}</h3>
          <p>{scene.copy}</p>
        </div>
        <div className="carousel-orbit orbit-one" />
        <div className="carousel-orbit orbit-two" />
      </div>

      <div className="carousel-controls">
        <button className="carousel-arrow" type="button" onClick={() => go(active - 1)} aria-label="Previous ceremony">←</button>
        <div className="carousel-dots" role="tablist" aria-label="Choose ceremony">
          {scenes.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? 'carousel-dot active' : 'carousel-dot'}
              aria-label={`Show ${item.title}`}
              aria-selected={index === active}
              role="tab"
              onClick={() => go(index)}
            />
          ))}
        </div>
        <button className="carousel-arrow" type="button" onClick={() => go(active + 1)} aria-label="Next ceremony">→</button>
      </div>
    </section>
  );
}
