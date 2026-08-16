import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import LogoutButton from '@/components/logout-button';

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  return (
    <div className="ops-shell">
      <aside className="ops-sidebar">
        <div className="ops-brand"><span className="brand-mark">IE</span><div><b>Centro de operaciones</b><small>{profile.organization || 'Innova Emergencias'}</small></div></div>
        <nav>
          <Link href="/operaciones">Emergencias activas</Link>
          <Link href="/operaciones/historial">Historial general</Link>
          {profile.role === 'admin' ? <Link href="/operaciones/accesos">Solicitudes de acceso</Link> : null}
          {profile.role === 'admin' ? <Link href="/operaciones/organizaciones">Organizaciones</Link> : null}
          <Link href="/mapa">Vista pública</Link>
        </nav>
        <div className="ops-user"><b>{profile.full_name || profile.email}</b><span>{profile.role}</span><LogoutButton /></div>
      </aside>
      <section className="ops-main">{children}</section>
    </div>
  );
}
