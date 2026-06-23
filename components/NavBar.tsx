'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',        label: 'Schedule', icon: '📅' },
  { href: '/clients', label: 'Clients',  icon: '👥' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/login', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  if (pathname === '/login') return null;

  return (
    <header style={{
      background: '#0f172a',
      color: 'white',
      padding: '0.875rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.375rem' }}>🩺</span>
        <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
          DoctorCRM
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          By Ustym Karashchenko
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav style={{
      position: 'fixed',
      bottom: '1.25rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 40,
      display: 'flex',
      gap: '0.75rem',
      background: 'white',
      padding: '0.5rem',
      borderRadius: 999,
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      border: '1px solid var(--border)',
    }}>
      {NAV_ITEMS.map(item => {
        const active = item.href === '/'
          ? pathname === '/'
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              textDecoration: 'none',
              background: active ? 'var(--accent)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {item.icon}
          </Link>
        );
      })}
    </nav>
  );
}
