'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import ImageUploader from '@/components/ImageUploader';

interface Client {
  id: string; name: string; phone: string; email: string; notes: string;
  visitCount: number; createdAt: string;
}

const EMPTY_FORM = { name: '', phone: '', email: '', notes: '', images: [] as string[] };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function fetchClients() {
    setLoading(true);
    const res = await fetch('/api/clients');
    setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      fetchClients();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Something went wrong');
    }
    setSaving(false);
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Clients</h1>
        <button className="btn-primary" onClick={openNew}>+ New Client</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
        <input
          type="search"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Count */}
      {!loading && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          {filtered.length} {filtered.length === 1 ? 'patient' : 'patients'}
          {search && ` matching "${search}"`}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            {search ? 'No patients found' : 'No patients yet'}
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            {search ? 'Try a different search.' : 'Click "+ New Client" to add your first patient.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(client => (
            <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: '1rem 1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                  }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{client.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {client.phone && <span>📞 {client.phone}</span>}
                      {client.email && <span>✉️ {client.email}</span>}
                    </div>
                  </div>
                  {/* Visit count */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{client.visitCount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{client.visitCount === 1 ? 'visit' : 'visits'}</div>
                  </div>
                  {/* Arrow */}
                  <div style={{ color: 'var(--muted)', fontSize: '1rem', flexShrink: 0 }}>›</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Client Modal */}
      {showModal && (
        <Modal title="New Patient" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" placeholder="Ivan Petrov" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" placeholder="+380 67 123 4567" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="patient@email.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} placeholder="Allergies, conditions, important notes…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>
            <ImageUploader images={form.images} onChange={images => setForm(f => ({ ...f, images }))} />
            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Add Patient'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
