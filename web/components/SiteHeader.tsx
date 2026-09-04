'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './SiteHeader.module.css';

const navigation = [
  { label: 'Home', href: '/', type: 'route' as const },
  { label: 'Events', href: '/#events', type: 'hash' as const },
  { label: 'RSVP', href: '/rsvp', type: 'route' as const },
  { label: 'Rooms', href: '/rooms', type: 'route' as const },
  { label: 'Seating', href: '/seating', type: 'route' as const }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hash, setHash] = useState('');

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, [pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const isActive = (item: (typeof navigation)[number]) => {
    if (item.type === 'hash') return pathname === '/' && hash === '#events';
    if (item.href === '/') return pathname === '/' && hash !== '#events';
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const closeDrawer = () => setIsOpen(false);

  return (
    <header className={styles.header} data-open={isOpen || undefined}>
      <nav className={`container ${styles.navbar}`} aria-label="Wedding navigation">
        <Link className={styles.brand} href="/" onClick={closeDrawer}>
          <span className={styles.brandMark} aria-hidden="true">S&amp;S</span>
          <span className={styles.brandText}>Sweta &amp; Shivpujan</span>
        </Link>

        <div className={styles.desktopLinks}>
          {navigation.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                className={styles.navLink}
                data-active={active || undefined}
                aria-current={active ? 'page' : undefined}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          className={styles.menuButton}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-wedding-navigation"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={styles.menuLine} />
          <span className={styles.menuLine} />
          <span className={styles.menuLine} />
        </button>
      </nav>

      <button
        className={styles.backdrop}
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeDrawer}
      />

      <aside
        id="mobile-wedding-navigation"
        className={styles.drawer}
        aria-hidden={!isOpen}
      >
        <div className={styles.drawerHeading}>
          <span className={styles.drawerEyebrow}>Wedding celebration</span>
          <strong>Sweta &amp; Shivpujan</strong>
        </div>

        <div className={styles.mobileLinks}>
          {navigation.map((item, index) => {
            const active = isActive(item);
            return (
              <Link
                key={item.label}
                className={styles.mobileLink}
                data-active={active || undefined}
                aria-current={active ? 'page' : undefined}
                href={item.href}
                onClick={closeDrawer}
              >
                <span className={styles.mobileIndex}>{String(index + 1).padStart(2, '0')}</span>
                <span>{item.label}</span>
                <span className={styles.mobileArrow} aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>

        <p className={styles.drawerNote}>
          Mithila-inspired celebration · Bihar
        </p>
      </aside>
    </header>
  );
}
