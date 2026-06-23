'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',         label: 'Schedule', icon: '📅' },
  { href: '/clients',  label: 'Clients',  icon: '👥' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: '#0f172a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🩺</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              DoctorCRM
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>
              Patient Management
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? 'white' : '#94a3b8',
                background: active ? '#0ea5e9' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ fontSize: '0.7rem', color: '#475569' }}>
          © {new Date().getFullYear()} DoctorCRM
        </div>
      </div>
    </aside>
  );
}
