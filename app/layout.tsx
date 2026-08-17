import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import './compat.css';
import './operations-extra.css';
import './mobile-responsive.css';
import './operations-mobile.css';
import './directory.css';
import './agent.css';
import './agent-inbox.css';
import './interface-fixes.css';
import './modern-operations.css';
import './email-audit.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'leaflet/dist/leaflet.css';
import ServiceWorkerRegister from '@/components/service-worker-register';
import ConnectionBadge from '@/components/connection-badge';
import SiteNavigation from '@/components/site-navigation';

export const metadata: Metadata = {
  title: 'Innova Emergency',
  description: 'Plataforma ciudadana de canalización de emergencias geolocalizadas.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = { themeColor: '#07131f', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegister />
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Innova Emergency - Inicio">
            <span className="brand-mark">IE</span>
            <span><b>Innova Emergency</b><small>Canalización ciudadana</small></span>
          </Link>
          <SiteNavigation />
          <ConnectionBadge />
        </header>
        <main>{children}</main>
        <footer className="footer company-footer">
          <a className="company-footer-link" href="https://innova-space-edu.cl" target="_blank" rel="noreferrer" aria-label="Ir a Innova Space Education">© 2026 Innova Space Education SpA</a>
        </footer>
      </body>
    </html>
  );
}
