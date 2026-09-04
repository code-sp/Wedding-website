'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import styles from '../auth.module.css';

const looksLikeSingleUseToken = (value: string) => /^[A-Za-z0-9_-]{40,}$/.test(value.trim());

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finishLogin = (user: { name?: string; isProfileComplete: boolean }) => {
    showToast(`Welcome${user.name ? `, ${user.name}` : ''}.`, 'success');
    router.replace(user.isProfileComplete ? '/' : '/onboarding');
    router.refresh();
  };

  useEffect(() => {
    setReady(true);
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const invite = params.get('invite');
    if (!invite) return;

    // Remove the secret fragment before any network request or user interaction.
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    let active = true;
    setLoading(true);
    setError('');

    api.exchangeInvitation(invite)
      .then(({ user }) => {
        if (active) finishLogin(user);
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : 'Unable to open invitation';
        setError(message);
        showToast(message, 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  // finishLogin intentionally uses stable router/toast services for this one-time fragment exchange.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      const credential = code.trim();
      const response = looksLikeSingleUseToken(credential)
        ? await api.exchangeInvitation(credential)
        : await api.login(credential);
      finishLogin(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.eyebrow}>Private wedding access</div>
        <h1 className={styles.title} id="login-title">Welcome to the celebration.</h1>
        <p className={styles.copy}>Open your private invitation link or enter the credential shared with you. Single-use invitation tokens are exchanged for secure httpOnly session cookies and are not stored in browser storage.</p>
        <form className={styles.form} onSubmit={submit} aria-busy={loading}>
          <label className={styles.field}>
            <span className={styles.label}>Invitation token or access code</span>
            <input
              className={styles.input}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode="text"
              minLength={6}
              maxLength={256}
              disabled={loading}
              required
            />
          </label>
          {error ? <div className={styles.error} role="alert">{error}</div> : null}
          <button className={styles.submit} type="submit" disabled={!ready || loading}>
            {loading ? <span className="inline-spinner" aria-hidden="true" /> : null}
            <span>{loading ? 'Opening invitation…' : ready ? 'Enter wedding' : 'Preparing secure sign-in…'}</span>
          </button>
          <span className="sr-only" aria-live="polite">{loading ? 'Opening your invitation securely.' : ''}</span>
        </form>
      </section>
    </main>
  );
}
