'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/Modal';
import ImageUploader from '@/components/ImageUploader';
import Lightbox from '@/components/Lightbox';

interface Appointment {
  id: string; date: string; time: string; duration: number;
  comments: string; status: 'scheduled' | 'completed' | 'cancelled';
  images: string[];
}

interface ClientDetail {
  id: string; name: string; phone: string; email: string; notes: string;
  images: string[]; createdAt: string; visitCount: number; appointments: Appointment[];
}

const STATUS_LABELS = { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' } as const;

function formatDate(iso: string) {
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t: string) {
  const [h, min] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', notes: '', images: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/clients/${id}`);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setClient(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  function openEdit() {
    if (!client) return;
    setEditForm({ name: client.name, phone: client.phone, email: client.email, notes: client.notes, images: client.images ?? [] });
    setShowEdit(true);
  }

  async function handleSave() {
    if (!editForm.name.trim()) return;
    setSaving(true);
    await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setShowEdit(false);
    fetchClient();
  }

  async function handleDelete() {
    if (!confirm(`Delete ${client?.name}? This will also delete all their appointments.`)) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    router.push('/clients');
  }

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
  );

  if (notFound) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Patient not found</div>
      <Link href="/clients" style={{ color: 'var(--accent)' }}>← Back to Clients</Link>
    </div>
  );

  if (!client) return null;

  return (
    <div style={{ padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: 800, margin: '0 auto' }}>
      {/* Back */}
      <Link href="/clients" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to Clients
      </Link>

      {/* Profile card */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '1.5rem', flexShrink: 0,
          }}>
            {client.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: '0 0 0.375rem', fontSize: '1.375rem', fontWeight: 700 }}>{client.name}</h1>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
              {client.phone && <span>📞 {client.phone}</span>}
              {client.email && <span>✉️ {client.email}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                background: 'var(--accent-light)', color: 'var(--accent)',
                padding: '0.25rem 0.75rem', borderRadius: 999,
                fontSize: '0.8125rem', fontWeight: 600,
              }}>
                {client.visitCount} {client.visitCount === 1 ? 'visit' : 'visits'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Patient since {new Date(client.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button className="btn-secondary" onClick={openEdit}>✏️ Edit</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Notes
            </div>
            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>{client.notes}</div>
          </div>
        )}

        {/* Photos */}
        {client.images?.length > 0 && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Photos
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {client.images.map((src, idx) => (
                <img key={idx} src={src} alt={`Photo ${idx + 1}`} onClick={() => setPreview(src)}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border)', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visit history */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700 }}>Visit History</h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{client.appointments.length} {client.appointments.length === 1 ? 'visit' : 'visits'}</span>
      </div>

      {client.appointments.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div>No visits recorded yet.</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Schedule an appointment from the{' '}
            <Link href="/" style={{ color: 'var(--accent)' }}>Schedule</Link> page.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {client.appointments.map(appt => (
            <div key={appt.id} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Date/Time */}
                <div style={{ minWidth: 110, flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(appt.date)}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{formatTime(appt.time)} · {appt.duration} min</div>
                </div>
                {/* Comments */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {appt.comments ? (
                    <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{appt.comments}</div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>No notes</div>
                  )}
                </div>
                {/* Photos */}
                {appt.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    {appt.images.map((src, idx) => (
                      <img key={idx} src={src} alt={`Attachment ${idx + 1}`} onClick={() => setPreview(src)}
                        style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid var(--border)', cursor: 'pointer' }} />
                    ))}
                  </div>
                )}
                {/* Status */}
                <span className={`badge badge-${appt.status}`} style={{ flexShrink: 0 }}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Patient" onClose={() => setShowEdit(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" type="tel" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>
            <ImageUploader images={editForm.images} onChange={images => setEditForm(f => ({ ...f, images }))} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button className="btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !editForm.name.trim()}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
