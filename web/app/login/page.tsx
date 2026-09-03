'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      const { user } = await api.login(code);
      showToast(`Welcome${user.name ? `, ${user.name}` : ''}.`, 'success');
      router.replace(user.isProfileComplete ? '/' : '/onboarding');
      router.refresh();
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
        <p className={styles.copy}>Enter the invitation code shared with you. Your session is stored in a secure httpOnly cookie rather than browser storage.</p>
        <form className={styles.form} onSubmit={submit} aria-busy={loading}>
          <label className={styles.field}>
            <span className={styles.label}>Invitation code</span>
            <input
              className={styles.input}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              inputMode="text"
              minLength={6}
              maxLength={128}
              disabled={loading}
              required
            />
          </label>
          {error ? <div className={styles.error} role="alert">{error}</div> : null}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? <span className="inline-spinner" aria-hidden="true" /> : null}
            <span>{loading ? 'Signing in…' : 'Enter wedding'}</span>
          </button>
          <span className="sr-only" aria-live="polite">{loading ? 'Signing in securely.' : ''}</span>
        </form>
      </section>
    </main>
  );
}
