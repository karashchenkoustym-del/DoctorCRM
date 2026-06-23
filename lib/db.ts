import { fileDb } from './db-file';
import { postgresDb } from './db-postgres';

export type { Client, Appointment, AppointmentWithClient } from './types';

// If DATABASE_URL is set, data is stored permanently in Postgres.
// Otherwise it falls back to a local JSON file — convenient for development,
// but NOT persistent on most hosts (the file disappears on redeploy/restart).
export const db = process.env.DATABASE_URL ? postgresDb : fileDb;
