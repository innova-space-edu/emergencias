import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import './compat.css';
import './operations-extra.css';
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
        <footer className="footer">
          <span>Innova Emergency · Innova Space Education</span>
          <span>Este sistema ayuda a canalizar información y no reemplaza los canales oficiales de emergencia.</span>
        </footer>
      </body>
    </html>
  );
}
