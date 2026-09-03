'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await api.login(code);
      router.replace(user.isProfileComplete ? '/' : '/onboarding');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
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
        <form className={styles.form} onSubmit={submit}>
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
              required
            />
          </label>
          {error ? <div className={styles.error} role="alert">{error}</div> : null}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Enter wedding'}
          </button>
        </form>
      </section>
    </main>
  );
}
