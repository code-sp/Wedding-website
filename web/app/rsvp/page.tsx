'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { api, RSVPData, SessionUser } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import styles from './rsvp.module.css';

const emptyForm: RSVPData = {
  name: '',
  email: '',
  mobile: '',
  attending: 'yes',
  guests: 1,
  guestDetails: [],
  seatNumbers: [],
  accommodation: '',
  roomNumber: '',
  mealPreference: '',
  message: ''
};

export default function RSVPPage() {
  const { showToast } = useToast();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [form, setForm] = useState<RSVPData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [{ user }, rsvpResult] = await Promise.all([api.session(), api.myRsvp()]);
        if (cancelled) return;

        setSessionUser(user);
        if (user.role === 'user') {
          const current = rsvpResult.rsvp;
          setForm(current ? {
            ...emptyForm,
            ...current,
            name: current.name || user.name || ''
          } : {
            ...emptyForm,
            name: user.name || ''
          });
          setSavedId(current?.id || null);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : 'Unable to load RSVP', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [showToast]);

  const guestLabel = useMemo(() => form.guests === 1 ? 'guest' : 'guests', [form.guests]);

  const update = <K extends keyof RSVPData>(key: K, value: RSVPData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sessionUser?.role !== 'user') return;

    setSaving(true);
    try {
      const result = await api.saveRsvp({
        ...form,
        guests: form.attending === 'yes' ? form.guests : 0
      });
      setForm((current) => ({ ...current, ...result.rsvp }));
      setSavedId(result.id);
      showToast('Your RSVP has been saved.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save RSVP', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <main className={styles.main} aria-busy="true">
          <div className={styles.loadingCard}>
            <span className="inline-spinner" aria-hidden="true" />
            <span>Loading your invitation…</span>
          </div>
        </main>
      </div>
    );
  }

  if (sessionUser?.role !== 'user') {
    return (
      <div className={styles.page}>
        <SiteHeader />
        <main className={styles.main}>
          <section className={styles.organizerCard}>
            <div className="eyebrow">Organiser account</div>
            <h1>Guest RSVP is ready for invited guests.</h1>
            <p>
              Organiser and admin accounts manage guest responses from the management portal.
              This page intentionally avoids creating an RSVP against an organiser identity.
            </p>
            <Link className="button button-secondary" href="/">Return home</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.intro}>
          <div className="eyebrow">Your invitation</div>
          <h1>Will you celebrate with us?</h1>
          <p>
            Tell us your attendance, party size and meal preference. You can return and update
            this response later using your secure session.
          </p>
          {savedId ? <div className={styles.savedBadge}>✓ RSVP saved</div> : null}
        </section>

        <form className={styles.form} onSubmit={submit} aria-busy={saving}>
          <fieldset className={styles.card} disabled={saving}>
            <legend>Attendance</legend>
            <div className={styles.choiceGrid}>
              <label className={styles.choice} data-active={form.attending === 'yes' || undefined}>
                <input
                  type="radio"
                  name="attending"
                  value="yes"
                  checked={form.attending === 'yes'}
                  onChange={() => update('attending', 'yes')}
                />
                <strong>Joyfully attending</strong>
                <span>Count me in for the celebration.</span>
              </label>
              <label className={styles.choice} data-active={form.attending === 'no' || undefined}>
                <input
                  type="radio"
                  name="attending"
                  value="no"
                  checked={form.attending === 'no'}
                  onChange={() => update('attending', 'no')}
                />
                <strong>Unable to attend</strong>
                <span>Sending my love from afar.</span>
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.card} disabled={saving}>
            <legend>Your details</legend>
            <div className={styles.fields}>
              <label>
                <span>Full name</span>
                <input
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  maxLength={160}
                  autoComplete="email"
                  required={form.attending === 'yes'}
                />
              </label>
              <label>
                <span>Mobile</span>
                <input
                  value={form.mobile}
                  onChange={(event) => update('mobile', event.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  required={form.attending === 'yes'}
                />
              </label>
            </div>
          </fieldset>

          {form.attending === 'yes' ? (
            <>
              <fieldset className={styles.card} disabled={saving}>
                <legend>Party & meal</legend>
                <div className={styles.partyRow}>
                  <div>
                    <strong>Party size</strong>
                    <span>{form.guests} {guestLabel}</span>
                  </div>
                  <div className={styles.stepper} aria-label="Party size">
                    <button
                      type="button"
                      onClick={() => update('guests', Math.max(1, form.guests - 1))}
                      disabled={form.guests <= 1}
                      aria-label="Decrease party size"
                    >−</button>
                    <output>{form.guests}</output>
                    <button
                      type="button"
                      onClick={() => update('guests', Math.min(10, form.guests + 1))}
                      disabled={form.guests >= 10}
                      aria-label="Increase party size"
                    >+</button>
                  </div>
                </div>

                <label className={styles.fullField}>
                  <span>Meal preference</span>
                  <select
                    value={form.mealPreference || ''}
                    onChange={(event) => update('mealPreference', event.target.value as RSVPData['mealPreference'])}
                  >
                    <option value="">Select preference</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="jain">Jain</option>
                    <option value="non-vegetarian">Non-vegetarian</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className={styles.fullField}>
                  <span>Accommodation preference</span>
                  <select
                    value={form.accommodation || ''}
                    onChange={(event) => update('accommodation', event.target.value)}
                  >
                    <option value="">No accommodation request</option>
                    <option value="required">I may need a room</option>
                    <option value="confirmed-elsewhere">I have arranged my stay</option>
                  </select>
                </label>
              </fieldset>

              <fieldset className={styles.card} disabled={saving}>
                <legend>Message</legend>
                <label className={styles.fullField}>
                  <span>Anything you would like us to know?</span>
                  <textarea
                    value={form.message || ''}
                    onChange={(event) => update('message', event.target.value)}
                    maxLength={500}
                    rows={5}
                    placeholder="A note, dietary detail or message for the couple…"
                  />
                </label>
              </fieldset>
            </>
          ) : null}

          <div className={styles.actions}>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? <><span className="inline-spinner" aria-hidden="true" /> Saving RSVP…</> : savedId ? 'Update RSVP' : 'Submit RSVP'}
            </button>
            <Link className="button button-ghost" href="/">Cancel</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
