import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, getAppPassword, hashPassword } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const expectedPassword = await getAppPassword();
  // No password configured — leave the app open rather than lock everyone out.
  if (!expectedPassword) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const expectedHash = await hashPassword(expectedPassword);
  if (cookie === expectedHash) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!login|api/login|_next/static|_next/image|favicon.ico|icon-192x192.png|icon-512x512.png|manifest.webmanifest|sw.js).*)',
  ],
};
