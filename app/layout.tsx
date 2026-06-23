import type { Metadata, Viewport } from 'next';
import './globals.css';
import NavBar, { Header } from '@/components/NavBar';
import RegisterSW from '@/components/RegisterSW';

export const metadata: Metadata = {
  title: 'Doctor CRM',
  description: 'Patient management for doctors',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DoctorCRM',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <RegisterSW />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1, minWidth: 0, background: 'var(--background)', paddingBottom: '5.5rem' }}>
            {children}
          </main>
          <NavBar />
        </div>
      </body>
    </html>
  );
}
