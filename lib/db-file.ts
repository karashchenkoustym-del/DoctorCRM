import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Client, Appointment, AppointmentWithClient, DB } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'db.json');

interface DBData {
  clients: Client[];
  appointments: Appointment[];
}

async function readDB(): Promise<DBData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as DBData;
  } catch {
    return { clients: [], appointments: [] };
  }
}

async function writeDB(data: DBData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// File-based storage. Only suitable for local development — on most hosts
// (serverless functions, ephemeral containers) this file does not persist.
// Set DATABASE_URL to use the Postgres-backed store instead (see db-postgres.ts).
export const fileDb: DB = {
  // ── Clients ──────────────────────────────────────────────
  async getClients() {
    const d = await readDB();
    return [...d.clients].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getClient(id) {
    const d = await readDB();
    return d.clients.find(c => c.id === id) ?? null;
  },

  async createClient(data) {
    const d = await readDB();
    const client: Client = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    d.clients.push(client);
    await writeDB(d);
    return client;
  },

  async updateClient(id, data) {
    const d = await readDB();
    const idx = d.clients.findIndex(c => c.id === id);
    if (idx === -1) return null;
    d.clients[idx] = { ...d.clients[idx], ...data };
    await writeDB(d);
    return d.clients[idx];
  },

  async deleteClient(id) {
    const d = await readDB();
    const before = d.clients.length;
    d.clients = d.clients.filter(c => c.id !== id);
    d.appointments = d.appointments.filter(a => a.clientId !== id);
    await writeDB(d);
    return d.clients.length < before;
  },

  // ── Appointments ─────────────────────────────────────────
  async getAppointments(filter) {
    const d = await readDB();
    const clientMap = new Map(d.clients.map(c => [c.id, c]));
    let appts = d.appointments;
    if (filter?.date) {
      appts = appts.filter(a => a.date === filter.date);
    } else if (filter?.from || filter?.to) {
      appts = appts.filter(a =>
        (!filter.from || a.date >= filter.from) && (!filter.to || a.date <= filter.to)
      );
    }
    return appts
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map(a => ({ ...a, client: clientMap.get(a.clientId) ?? null })) as AppointmentWithClient[];
  },

  async getAppointmentsByClient(clientId) {
    const d = await readDB();
    return d.appointments
      .filter(a => a.clientId === clientId)
      .sort((a, b) => {
        const ta = `${a.date}T${a.time}`;
        const tb = `${b.date}T${b.time}`;
        return tb.localeCompare(ta); // newest first
      });
  },

  async countAppointmentsByClient(clientId) {
    const d = await readDB();
    return d.appointments.filter(a => a.clientId === clientId).length;
  },

  async createAppointment(data) {
    const d = await readDB();
    const appt: Appointment = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    d.appointments.push(appt);
    await writeDB(d);
    return appt;
  },

  async updateAppointment(id, data) {
    const d = await readDB();
    const idx = d.appointments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    d.appointments[idx] = { ...d.appointments[idx], ...data };
    await writeDB(d);
    return d.appointments[idx];
  },

  async deleteAppointment(id) {
    const d = await readDB();
    const before = d.appointments.length;
    d.appointments = d.appointments.filter(a => a.id !== id);
    await writeDB(d);
    return d.appointments.length < before;
  },
};
