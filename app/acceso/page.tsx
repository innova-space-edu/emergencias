import Link from 'next/link';
import AccessRequestForm from '@/components/access-request-form';
export default function AccessPage() {
  return (
    <div className="content-shell narrow-shell">
      <div className="page-heading">
        <span className="eyebrow">AUTORIDADES Y OPERADORES</span>
        <h1>Solicitar acceso institucional</h1>
        <p>Las cuentas no se crean desde la plataforma. Tu solicitud será revisada por el administrador.</p>
      </div>
      <AccessRequestForm />
      <nav className="legal-links" aria-label="Información legal y de seguridad"><Link href="/privacidad">Privacidad</Link><Link href="/seguridad">Seguridad</Link><Link href="/gobernanza-ia">Gobernanza de IA</Link><Link href="/terminos">Términos</Link></nav>
    </div>
  );
}
