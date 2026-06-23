import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, getAppPassword, hashPassword, setAppPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
    return NextResponse.json({ error: 'New password must be at least 4 characters' }, { status: 400 });
  }

  const expected = await getAppPassword();
  if (expected && currentPassword !== expected) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  await setAppPassword(newPassword);

  // Re-issue the auth cookie for the new password so the current session stays logged in.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await hashPassword(newPassword), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
