import Link from 'next/link';
import LoginForm from '@/components/login-form';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ inactive?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-shell">
      <div className="auth-card no-extra-logo">
        <h1>Centro de operaciones</h1>
        <p>Ingreso exclusivo para administrador, operadores y autoridades autorizadas.</p>
        {params.inactive ? <div className="alert warning">Tu usuario existe, pero todavía no está habilitado por el administrador.</div> : null}
        <LoginForm />
        <p className="muted tiny">No existe registro público. Si perteneces a una institución, solicita acceso desde el formulario institucional.</p>
        <nav className="legal-links" aria-label="Información legal y de seguridad"><Link href="/privacidad">Privacidad</Link><Link href="/seguridad">Seguridad</Link><Link href="/gobernanza-ia">Gobernanza de IA</Link><Link href="/terminos">Términos</Link></nav>
      </div>
    </div>
  );
}
