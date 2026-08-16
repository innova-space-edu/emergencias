import ReportForm from '@/components/report-form';
export default function ReportPage() {
  return (
    <div className="content-shell narrow-shell">
      <div className="page-heading">
        <span className="eyebrow">REPORTE CIUDADANO</span>
        <h1>Reportar una emergencia</h1>
        <p>No necesitas crear una cuenta. Completa solo lo que puedas de forma segura.</p>
      </div>
      <ReportForm />
    </div>
  );
}
