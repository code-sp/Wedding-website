import Link from 'next/link';
import { DioramaHero } from '@/components/DioramaHero';

const features = [
  {
    title: 'RSVP Journey',
    body: 'A guided guest flow with secure invitation access, profile completion, meal preferences and confirmation.'
  },
  {
    title: 'Seat Reservation',
    body: 'A visual seating experience designed for touch, with clear availability and confirmation states.'
  },
  {
    title: 'Room Booking',
    body: 'Accommodation discovery, room details, availability and booking information in one elegant flow.'
  }
];

export default function HomePage() {
  return (
    <div className="shell">
      <header className="site-header">
        <nav className="container navbar" aria-label="Wedding navigation">
          <Link className="brand" href="/">Sweta &amp; Shivpujan</Link>
          <div className="navlinks">
            <Link className="navlink" aria-current="page" href="/">Home</Link>
            <Link className="navlink" href="/events">Events</Link>
            <Link className="navlink" href="/rsvp">RSVP</Link>
            <Link className="navlink" href="/rooms">Rooms</Link>
            <Link className="navlink" href="/seating">Seating</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">Mithila · Bihar · Wedding Celebration</div>
              <h1>A wedding world you can step into.</h1>
              <p>
                A cinematic guest experience blending Mithila-inspired detailing with a
                hyper-dimensional miniature-diorama presentation, secure RSVP flows,
                seating and accommodation.
              </p>
              <div className="actions">
                <Link className="button button-primary" href="/rsvp">Open RSVP</Link>
                <Link className="button button-secondary" href="/events">Explore Events</Link>
              </div>
            </div>
            <DioramaHero />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="eyebrow">Guest experience</div>
            <h2>Designed as one continuous celebration.</h2>
            <div className="cards">
              {features.map((feature) => (
                <article className="card" key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
