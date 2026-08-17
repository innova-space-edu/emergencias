import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import LogoutButton from '@/components/logout-button';
import ContactAdminButton from '@/components/contact-admin-button';

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  const links = <>
    <Link href="/operaciones">Emergencias activas</Link>
    <Link href="/operaciones/agente">Agente IA</Link>
    <Link href="/operaciones/historial">Historial general</Link>
    <Link href="/operaciones/directorio">Directorio territorial</Link>
    {profile.role === 'admin' ? <Link href="/operaciones/correos">Alertas por correo</Link> : null}
    {profile.role === 'admin' ? <Link href="/operaciones/accesos">Solicitudes de acceso</Link> : null}
    {profile.role === 'admin' ? <Link href="/operaciones/organizaciones">Organizaciones</Link> : null}
    <Link href="/mapa">Vista pública</Link>
  </>;
  return (
    <div className="ops-shell">
      <details className="ops-mobile-menu">
        <summary><span><b>Centro de operaciones</b><small>{profile.organization || 'Innova Emergency'} · {profile.role}</small></span><strong>Menú</strong></summary>
        <nav>{links}</nav>
        <div className="ops-mobile-user"><span>{profile.full_name || profile.email}</span><div className="ops-mobile-contact"><ContactAdminButton /></div><LogoutButton /></div>
      </details>
      <aside className="ops-sidebar">
        <div className="ops-brand"><span className="brand-mark">IE</span><div><b>Centro de operaciones</b><small>{profile.organization || 'Innova Emergency'}</small></div></div>
        <nav>{links}</nav>
        <div className="ops-user"><b>{profile.full_name || profile.email}</b><span>{profile.role}</span><ContactAdminButton /><LogoutButton /></div>
      </aside>
      <section className="ops-main">{children}</section>
    </div>
  );
}
