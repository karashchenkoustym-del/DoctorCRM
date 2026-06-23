'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ImageUploader from '@/components/ImageUploader';
import Lightbox from '@/components/Lightbox';

interface Client { id: string; name: string; phone: string; email: string; }
interface Appointment {
  id: string; clientId: string; date: string; time: string;
  duration: number; comments: string; status: 'scheduled' | 'completed' | 'cancelled';
  images: string[];
  client: Client | null;
}

type Period = 'day' | 'week' | 'month' | 'year';
const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

function toLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string) {
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(t: string) {
  const [h, min] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}

// Range of dates (inclusive, YYYY-MM-DD) covered by a period anchored on dateStr.
function computeRange(period: Period, dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr + 'T00:00:00');
  if (period === 'day') return { from: dateStr, to: dateStr };
  if (period === 'week') {
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toLocalDate(start), to: toLocalDate(end) };
  }
  if (period === 'month') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: toLocalDate(start), to: toLocalDate(end) };
  }
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear(), 11, 31);
  return { from: toLocalDate(start), to: toLocalDate(end) };
}

function formatRangeLabel(period: Period, dateStr: string): string {
  if (period === 'day') return formatDate(dateStr);
  const d = new Date(dateStr + 'T00:00:00');
  if (period === 'month') return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  if (period === 'year') return String(d.getFullYear());
  const { from, to } = computeRange(period, dateStr);
  const f = new Date(from + 'T00:00:00');
  const t = new Date(to + 'T00:00:00');
  const sameMonth = f.getMonth() === t.getMonth();
  const fromLabel = f.toLocaleDateString('en-GB', { day: 'numeric', month: sameMonth ? undefined : 'short' });
  const toLabel = t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fromLabel} – ${toLabel}`;
}

// 7 dates (Mon–Sun) for the week containing dateStr.
function buildWeekDates(dateStr: string): string[] {
  const { from } = computeRange('week', dateStr);
  const start = new Date(from + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toLocalDate(d);
  });
}

// Calendar grid cells (Mon–Sun rows) covering every week that overlaps the month of dateStr.
function buildMonthGrid(dateStr: string): { date: string; inMonth: boolean }[] {
  const d = new Date(dateStr + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const startDay = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() + (startDay === 0 ? -6 : 1 - startDay));

  const endDay = lastOfMonth.getDay();
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(lastOfMonth.getDate() + (endDay === 0 ? 0 : 7 - endDay));

  const cells: { date: string; inMonth: boolean }[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    cells.push({ date: toLocalDate(cur), inMonth: cur.getMonth() === month });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

// 12 month tiles (first-of-month date + label) for the year containing dateStr.
function buildYearMonths(dateStr: string): { date: string; label: string }[] {
  const year = new Date(dateStr + 'T00:00:00').getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return { date: toLocalDate(d), label: d.toLocaleDateString('en-GB', { month: 'long' }) };
  });
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_LABELS = { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' } as const;

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
interface AppointmentForm {
  clientId: string; date: string; time: string; duration: number; comments: string; status: AppointmentStatus;
  images: string[];
}
const EMPTY_FORM: AppointmentForm = {
  clientId: '', date: '', time: '09:00', duration: 60, comments: '', status: 'scheduled', images: [],
};

export default function SchedulePage() {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<Period>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<AppointmentForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Set today's date on mount (avoids hydration mismatch)
  useEffect(() => { setDate(toLocalDate(new Date())); }, []);

  const fetchAppointments = useCallback(async (d: string, p: Period) => {
    if (!d) return;
    setLoading(true);
    const { from, to } = computeRange(p, d);
    const url = p === 'day' ? `/api/appointments?date=${d}` : `/api/appointments?from=${from}&to=${to}`;
    const res = await fetch(url);
    setAppointments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { if (date) fetchAppointments(date, period); }, [date, period, fetchAppointments]);

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
  }, []);

  function shiftRange(n: number) {
    const d = new Date(date + 'T00:00:00');
    if (period === 'day') d.setDate(d.getDate() + n);
    else if (period === 'week') d.setDate(d.getDate() + n * 7);
    else if (period === 'month') d.setMonth(d.getMonth() + n, 1);
    else d.setFullYear(d.getFullYear() + n);
    setDate(toLocalDate(d));
  }

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: period === 'day' ? date : toLocalDate(new Date()) });
    setShowModal(true);
  }

  function openEdit(appt: Appointment) {
    setEditing(appt);
    setForm({ clientId: appt.clientId, date: appt.date, time: appt.time, duration: appt.duration, comments: appt.comments, status: appt.status, images: appt.images ?? [] });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.clientId || !form.date || !form.time) return;
    setSaving(true);
    if (editing) {
      await fetch(`/api/appointments/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowModal(false);
    fetchAppointments(date, period);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this appointment?')) return;
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    fetchAppointments(date, period);
  }

  const today = toLocalDate(new Date());
  const { from: rangeFrom, to: rangeTo } = date ? computeRange(period, date) : { from: '', to: '' };
  const isCurrentPeriod = !!date && today >= rangeFrom && today <= rangeTo;

  const statusCounts = { scheduled: 0, completed: 0, cancelled: 0 };
  appointments.forEach(a => { statusCounts[a.status]++; });

  const apptsByDate = new Map<string, Appointment[]>();
  appointments.forEach(a => {
    const arr = apptsByDate.get(a.date) ?? [];
    arr.push(a);
    apptsByDate.set(a.date, arr);
  });

  const apptsByMonth = new Map<string, Appointment[]>();
  appointments.forEach(a => {
    const key = a.date.slice(0, 7);
    const arr = apptsByMonth.get(key) ?? [];
    arr.push(a);
    apptsByMonth.set(key, arr);
  });

  function goToDay(d: string) {
    setPeriod('day');
    setDate(d);
  }

  function goToMonth(d: string) {
    setPeriod('month');
    setDate(d);
  }

  function renderCard(appt: Appointment) {
    return (
      <div key={appt.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
          {/* Time */}
          <div style={{ minWidth: 72, textAlign: 'center', paddingTop: 2 }}>
            <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>
              {formatTime(appt.time)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 3 }}>
              {appt.duration} min
            </div>
          </div>
          {/* Line */}
          <div style={{ width: 3, alignSelf: 'stretch', background: 'var(--accent-light)', borderRadius: 2, flexShrink: 0 }} />
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{appt.client?.name ?? 'Unknown'}</span>
                  <span className={`badge badge-${appt.status}`}>{STATUS_LABELS[appt.status]}</span>
                </div>
                {(appt.client?.phone || appt.client?.email) && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {appt.client.phone && <span>📞 {appt.client.phone}</span>}
                    {appt.client.email && <span>✉️ {appt.client.email}</span>}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                <button className="btn-ghost" onClick={() => openEdit(appt)} title="Edit">✏️</button>
                <button className="btn-danger" onClick={() => handleDelete(appt.id)} title="Delete">✕</button>
              </div>
            </div>
            {appt.comments && (
              <div style={{ fontSize: '0.875rem', color: '#334155', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', borderLeft: '3px solid var(--accent-light)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: '0.625rem' }}>
                {appt.comments}
              </div>
            )}
            {appt.images?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {appt.images.map((src, idx) => (
                  <img key={idx} src={src} alt={`Attachment ${idx + 1}`} onClick={() => setPreview(src)}
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid var(--border)', cursor: 'pointer' }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Schedule</h1>
        <button className="btn-primary" onClick={openNew} disabled={clients.length === 0}>
          + New Appointment
        </button>
      </div>

      {/* Period selector */}
      <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--accent-light)', borderRadius: '0.625rem', marginBottom: '1rem' }}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={p.value === period ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => shiftRange(-1)} style={{ padding: '0.375rem 0.875rem', fontWeight: 700 }}>←</button>
        <button className="btn-secondary" onClick={() => shiftRange(1)}  style={{ padding: '0.375rem 0.875rem', fontWeight: 700 }}>→</button>
        <div style={{ flex: 1, fontWeight: 600, fontSize: '0.9375rem' }}>
          {date ? formatRangeLabel(period, date) : ''}
          {isCurrentPeriod && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.125rem 0.5rem', borderRadius: 999 }}>
              Today
            </span>
          )}
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="form-input" style={{ width: 160 }} />
        {!isCurrentPeriod && (
          <button className="btn-secondary" onClick={() => setDate(today)} style={{ whiteSpace: 'nowrap', padding: '0.375rem 0.75rem' }}>
            Today
          </button>
        )}
      </div>

      {/* Summary (week / month / year) */}
      {period !== 'day' && !loading && (
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{appointments.length}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              appointment{appointments.length === 1 ? '' : 's'} this {period}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map(s => (
              <div key={s}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{statusCounts[s]}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{STATUS_LABELS[s]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointments */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading…</div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--foreground)' }}>No appointments</div>
          <div style={{ fontSize: '0.875rem' }}>
            {clients.length === 0 ? 'Go to Clients to add patients first.' : `Nothing scheduled this ${period}.`}
          </div>
        </div>
      ) : period === 'day' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {appointments.map(renderCard)}
        </div>
      ) : period === 'week' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.625rem' }}>
          {buildWeekDates(date).map(d => {
            const dayAppts = apptsByDate.get(d) ?? [];
            const isToday = d === today;
            return (
              <div key={d} className="card" style={{ padding: '0.625rem', minHeight: 260, display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => goToDay(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>
                    {WEEKDAY_LABELS[(new Date(d + 'T00:00:00').getDay() + 6) % 7]}
                  </div>
                  <div style={{
                    fontSize: '0.9375rem', fontWeight: 700, textAlign: 'center', margin: '0.25rem auto 0',
                    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                    color: isToday ? '#fff' : 'var(--foreground)', background: isToday ? 'var(--accent)' : 'transparent',
                  }}>
                    {Number(d.slice(8, 10))}
                  </div>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3125rem', overflowY: 'auto', flex: 1 }}>
                  {dayAppts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--border)', fontSize: '0.75rem', marginTop: '0.5rem' }}>—</div>
                  ) : dayAppts.map(appt => (
                    <button key={appt.id} onClick={() => openEdit(appt)} className={`badge badge-${appt.status}`}
                      style={{ textAlign: 'left', border: 'none', cursor: 'pointer', display: 'block', width: '100%', fontSize: '0.6875rem', lineHeight: 1.3, padding: '0.25rem 0.4375rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{formatTime(appt.time)}</strong> {appt.client?.name ?? 'Unknown'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : period === 'month' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>
            {WEEKDAY_LABELS.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{w}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {buildMonthGrid(date).map(cell => {
              const dayAppts = apptsByDate.get(cell.date) ?? [];
              const isToday = cell.date === today;
              const visible = dayAppts.slice(0, 3);
              const overflow = dayAppts.length - visible.length;
              return (
                <div key={cell.date} className="card" onClick={() => goToDay(cell.date)}
                  style={{ padding: '0.4375rem', minHeight: 92, opacity: cell.inMonth ? 1 : 0.4, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, alignSelf: 'flex-start',
                    width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                    color: isToday ? '#fff' : 'var(--foreground)', background: isToday ? 'var(--accent)' : 'transparent',
                  }}>
                    {Number(cell.date.slice(8, 10))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    {visible.map(appt => (
                      <div key={appt.id} className={`badge badge-${appt.status}`} style={{ fontSize: '0.625rem', padding: '0.0625rem 0.375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {formatTime(appt.time)} {appt.client?.name ?? ''}
                      </div>
                    ))}
                    {overflow > 0 && <div style={{ fontSize: '0.625rem', color: 'var(--muted)', paddingLeft: '0.375rem' }}>+{overflow} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {buildYearMonths(date).map(m => {
            const count = apptsByMonth.get(m.date.slice(0, 7))?.length ?? 0;
            const isCurrentMonth = m.date.slice(0, 7) === today.slice(0, 7);
            return (
              <div key={m.date} className="card" onClick={() => goToMonth(m.date)}
                style={{ padding: '1.25rem', cursor: 'pointer', textAlign: 'center', borderColor: isCurrentMonth ? 'var(--accent)' : undefined, borderWidth: isCurrentMonth ? 2 : 1 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{m.label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: count > 0 ? 'var(--accent)' : 'var(--border)' }}>{count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>appointment{count === 1 ? '' : 's'}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Appointment' : 'New Appointment'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Patient *</label>
              <select className="form-input" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">Select patient…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Time *</label>
                <input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Duration</label>
                <select className="form-input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}>
                  {[15, 30, 45, 60, 90, 120].map(v => <option key={v} value={v}>{v} min</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AppointmentStatus }))}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Comments / Notes</label>
              <textarea className="form-input" rows={3} value={form.comments} placeholder="Visit reason, notes, prescriptions…"
                onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
            <ImageUploader images={form.images} onChange={images => setForm(f => ({ ...f, images }))} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving || !form.clientId || !form.date || !form.time}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Appointment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {preview && <Lightbox src={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
