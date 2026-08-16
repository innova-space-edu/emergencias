import LoginForm from '@/components/login-form';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ inactive?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <span className="brand-mark large">IE</span>
        <h1>Centro de operaciones</h1>
        <p>Ingreso exclusivo para administrador, operadores y autoridades autorizadas.</p>
        {params.inactive ? <div className="alert warning">Tu usuario existe, pero todavía no está habilitado por el administrador.</div> : null}
        <LoginForm />
        <p className="muted tiny">No existe registro público. Si perteneces a una institución, solicita acceso desde el formulario institucional.</p>
      </div>
    </div>
  );
}
