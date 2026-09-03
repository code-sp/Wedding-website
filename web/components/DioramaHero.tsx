'use client';

import { useEffect, useRef } from 'react';

export function DioramaHero() {
  const worldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = worldRef.current;
    if (!el) return;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `rotateX(${y * -3.5}deg) rotateY(${x * 5}deg)`;
    };

    const onLeave = () => {
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="diorama-frame" aria-label="Interactive miniature wedding diorama">
      <div
        ref={worldRef}
        className="diorama-world"
        style={{ transition: 'transform 220ms ease-out' }}
      >
        <div className="diorama-sky" />
        <div className="mountain back" />
        <div className="mountain front" />
        <div className="forest" />
        <div className="stage" />
        <div className="pillar left" />
        <div className="pillar right" />
        <div className="lotus one" />
        <div className="lotus two" />
        <article className="invitation-card">
          <small>शुभ विवाह</small>
          <h2>Sweta &amp; Shivpujan</h2>
          <p>
            A Mithila-inspired celebration presented as an open-air miniature diorama,
            framed by misty mountains, forest layers, ivory architecture and champagne-gold details.
          </p>
        </article>
      </div>
    </div>
  );
}
