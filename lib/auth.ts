import { db } from './db';

export const AUTH_COOKIE = 'app_auth';
const PASSWORD_SETTING_KEY = 'app_password';

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// A password changed via the Settings page (stored in the DB) always wins;
// otherwise fall back to the APP_PASSWORD env var; if neither is set, the
// app is left open rather than locking everyone out by accident.
export async function getAppPassword(): Promise<string | undefined> {
  const stored = await db.getSetting(PASSWORD_SETTING_KEY);
  return stored ?? process.env.APP_PASSWORD;
}

export async function setAppPassword(password: string): Promise<void> {
  await db.setSetting(PASSWORD_SETTING_KEY, password);
}
