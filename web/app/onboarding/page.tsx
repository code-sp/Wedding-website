'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from '../auth.module.css';

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    relationToCouple: '',
    dietaryPreference: 'vegetarian',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.completeProfile(form);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="onboarding-title">
        <div className={styles.eyebrow}>Step 1 of 3 · Guest profile</div>
        <h1 className={styles.title} id="onboarding-title">Tell us who is celebrating with us.</h1>
        <p className={styles.copy}>This profile is required before RSVP, seating, rooms or other private wedding areas are available.</p>
        <div className={styles.progress} aria-hidden="true"><span className={styles.active} /><span /><span /></div>

        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span className={styles.label}>Full name</span>
            <input className={styles.input} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} maxLength={100} required />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Relation to the couple</span>
            <input className={styles.input} value={form.relationToCouple} onChange={(e) => update('relationToCouple', e.target.value)} maxLength={80} placeholder="Family, friend, colleague…" required />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Dietary preference</span>
            <select className={styles.select} value={form.dietaryPreference} onChange={(e) => update('dietaryPreference', e.target.value)}>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="jain">Jain</option>
              <option value="non-vegetarian">Non-vegetarian</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Phone</span>
            <input className={styles.input} value={form.phone} onChange={(e) => update('phone', e.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} required />
          </label>

          {error ? <div className={styles.error} role="alert">{error}</div> : null}
          <button className={styles.submit} type="submit" disabled={loading}>{loading ? 'Saving…' : 'Continue'}</button>
        </form>
      </section>
    </main>
  );
}
