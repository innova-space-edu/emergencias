import Link from 'next/link';
import PublicMapPreview from '@/components/public-map-preview';

export default function HomePage() {
  return (
    <div className="home-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">RED CIUDADANA DE INFORMACIÓN DE EMERGENCIAS</span>
          <h1>Reporta lo que está ocurriendo y ayuda a canalizar información útil.</h1>
          <p>Envía ubicación GPS, descripción, fotografías o videos. Si pierdes señal, el reporte queda guardado en el dispositivo y se sincroniza al recuperar conexión.</p>
          <div className="hero-actions">
            <Link className="btn btn-danger btn-lg" href="/reportar">Reportar una emergencia</Link>
            <Link className="btn btn-secondary btn-lg" href="/mapa">Ver mapa en tiempo real</Link>
          </div>
          <div className="notice-card">
            <b>¿Existe peligro inmediato?</b>
            <span>Utiliza también los canales oficiales correspondientes. Esta plataforma complementa la canalización de información; no reemplaza el despacho oficial.</span>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px'}} aria-label="Números oficiales de emergencia en Chile">
              <a className="btn btn-danger btn-sm" href="tel:131" aria-label="Llamar al SAMU 131">131 · SAMU / Ambulancia</a>
              <a className="btn btn-danger btn-sm" href="tel:132" aria-label="Llamar a Bomberos 132">132 · Bomberos</a>
              <a className="btn btn-danger btn-sm" href="tel:133" aria-label="Llamar a Carabineros 133">133 · Carabineros</a>
            </div>
            <span style={{fontSize:'11px'}}>En una emergencia vital o con peligro inmediato, utiliza primero el número oficial que corresponda.</span>
          </div>
        </div>
        <div className="hero-map-card">
          <PublicMapPreview />
        </div>
      </section>

      <section className="feature-grid">
        <article><span className="feature-icon">⌖</span><h3>Ubicación precisa</h3><p>GPS y selección manual del punto para ubicar el incidente.</p></article>
        <article><span className="feature-icon">⇅</span><h3>Funciona con cortes de señal</h3><p>La cola offline conserva el reporte y reintenta la sincronización.</p></article>
        <article><span className="feature-icon">▣</span><h3>Evidencia protegida</h3><p>El público no puede acceder a fotografías ni videos; solo personal autorizado.</p></article>
        <article><span className="feature-icon">◎</span><h3>Mapa real</h3><p>Calles, direcciones, zoom, geolocalización, clusters y puntos interactivos.</p></article>
      </section>
    </div>
  );
}
