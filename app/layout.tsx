import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'leaflet/dist/leaflet.css';
import ServiceWorkerRegister from '@/components/service-worker-register';
import ConnectionBadge from '@/components/connection-badge';

export const metadata: Metadata = {
  title: 'Innova Emergencias',
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
          <Link className="brand" href="/" aria-label="Innova Emergencias - Inicio">
            <span className="brand-mark">IE</span>
            <span><b>Innova Emergencias</b><small>Canalización ciudadana</small></span>
          </Link>
          <nav className="topnav" aria-label="Navegación principal">
            <Link href="/mapa">Mapa</Link>
            <Link className="nav-emergency" href="/reportar">Reportar emergencia</Link>
            <Link href="/acceso">Acceso institucional</Link>
            <Link href="/login">Ingresar</Link>
          </nav>
          <ConnectionBadge />
        </header>
        <main>{children}</main>
        <footer className="footer">
          <span>Innova Emergencias · Innova Space Education</span>
          <span>Este sistema ayuda a canalizar información y no reemplaza los canales oficiales de emergencia.</span>
        </footer>
      </body>
    </html>
  );
}
