import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { Client, Appointment, AppointmentWithClient, DB } from './types';

// Postgres-backed storage — use this in production so data survives
// restarts/redeploys on hosts with an ephemeral filesystem (Vercel, etc).
// Point DATABASE_URL at any Postgres instance (Neon, Supabase, Railway, RDS...).

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable')
    ? false
    : { rejectUnauthorized: false },
});

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        images JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 60,
        comments TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'scheduled',
        images JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

interface ClientRow {
  id: string; name: string; phone: string; email: string; notes: string;
  images: string[] | null; created_at: string | Date;
}

interface AppointmentRow {
  id: string; client_id: string; date: string; time: string; duration: number;
  comments: string; status: 'scheduled' | 'completed' | 'cancelled';
  images: string[] | null; created_at: string | Date;
}

function rowToClient(r: ClientRow): Client {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    notes: r.notes,
    images: r.images ?? [],
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

function rowToAppointment(r: AppointmentRow): Appointment {
  return {
    id: r.id,
    clientId: r.client_id,
    date: r.date,
    time: r.time,
    duration: r.duration,
    comments: r.comments,
    status: r.status,
    images: r.images ?? [],
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

export const postgresDb: DB = {
  // ── Clients ──────────────────────────────────────────────
  async getClients() {
    await ensureSchema();
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    return rows.map(rowToClient);
  },

  async getClient(id) {
    await ensureSchema();
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    return rows[0] ? rowToClient(rows[0]) : null;
  },

  async createClient(data) {
    await ensureSchema();
    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO clients (id, name, phone, email, notes, images)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, data.name, data.phone, data.email, data.notes, JSON.stringify(data.images ?? [])]
    );
    return rowToClient(rows[0]);
  },

  async updateClient(id, data) {
    await ensureSchema();
    const current = await postgresDb.getClient(id);
    if (!current) return null;
    const merged = { ...current, ...data };
    const { rows } = await pool.query(
      `UPDATE clients SET name = $2, phone = $3, email = $4, notes = $5, images = $6
       WHERE id = $1 RETURNING *`,
      [id, merged.name, merged.phone, merged.email, merged.notes, JSON.stringify(merged.images ?? [])]
    );
    return rows[0] ? rowToClient(rows[0]) : null;
  },

  async deleteClient(id) {
    await ensureSchema();
    const { rowCount } = await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },

  // ── Appointments ─────────────────────────────────────────
  async getAppointments(filter) {
    await ensureSchema();
    const baseSelect = `SELECT a.*, c.id AS c_id, c.name AS c_name, c.phone AS c_phone, c.email AS c_email,
                  c.notes AS c_notes, c.images AS c_images, c.created_at AS c_created_at
           FROM appointments a LEFT JOIN clients c ON c.id = a.client_id`;

    let where = '';
    const params: string[] = [];
    if (filter?.date) {
      where = 'WHERE a.date = $1';
      params.push(filter.date);
    } else if (filter?.from || filter?.to) {
      const clauses: string[] = [];
      if (filter.from) { params.push(filter.from); clauses.push(`a.date >= $${params.length}`); }
      if (filter.to) { params.push(filter.to); clauses.push(`a.date <= $${params.length}`); }
      where = `WHERE ${clauses.join(' AND ')}`;
    }

    const { rows } = await pool.query(
      `${baseSelect} ${where} ORDER BY a.date ASC, a.time ASC`,
      params
    );
    return rows.map(r => ({
      ...rowToAppointment(r),
      client: r.c_id
        ? rowToClient({
            id: r.c_id, name: r.c_name, phone: r.c_phone, email: r.c_email,
            notes: r.c_notes, images: r.c_images, created_at: r.c_created_at,
          })
        : null,
    })) as AppointmentWithClient[];
  },

  async getAppointmentsByClient(clientId) {
    await ensureSchema();
    const { rows } = await pool.query(
      'SELECT * FROM appointments WHERE client_id = $1 ORDER BY date DESC, time DESC',
      [clientId]
    );
    return rows.map(rowToAppointment);
  },

  async countAppointmentsByClient(clientId) {
    await ensureSchema();
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS count FROM appointments WHERE client_id = $1',
      [clientId]
    );
    return Number(rows[0].count);
  },

  async createAppointment(data) {
    await ensureSchema();
    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO appointments (id, client_id, date, time, duration, comments, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, data.clientId, data.date, data.time, data.duration, data.comments, data.status, JSON.stringify(data.images ?? [])]
    );
    return rowToAppointment(rows[0]);
  },

  async updateAppointment(id, data) {
    await ensureSchema();
    const { rows: existingRows } = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (!existingRows[0]) return null;
    const current = rowToAppointment(existingRows[0]);
    const merged = { ...current, ...data };
    const { rows } = await pool.query(
      `UPDATE appointments SET client_id = $2, date = $3, time = $4, duration = $5,
              comments = $6, status = $7, images = $8
       WHERE id = $1 RETURNING *`,
      [id, merged.clientId, merged.date, merged.time, merged.duration, merged.comments, merged.status, JSON.stringify(merged.images ?? [])]
    );
    return rows[0] ? rowToAppointment(rows[0]) : null;
  },

  async deleteAppointment(id) {
    await ensureSchema();
    const { rowCount } = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },

  // ── Settings ─────────────────────────────────────────────
  async getSetting(key) {
    await ensureSchema();
    const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    return rows[0]?.value ?? null;
  },

  async setSetting(key, value) {
    await ensureSchema();
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, value]
    );
  },
};
