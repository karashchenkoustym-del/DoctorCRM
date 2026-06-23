'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Something went wrong');
    }
  }

  return (
    <div style={{ padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: 480, margin: '0 auto' }}>
      <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back
      </Link>

      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Settings</h1>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>Change password</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Current password</label>
            <input type="password" className="form-input" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="form-label">New password</label>
            <input type="password" className="form-input" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Confirm new password</label>
            <input type="password" className="form-input" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              Password updated.
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving || !newPassword || !confirmPassword}
            style={{ justifyContent: 'center' }}>
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
