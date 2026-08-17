# Innova Emergency

Plataforma ciudadana de canalización de emergencias geolocalizadas. **No reemplaza a los canales oficiales de emergencia.**

## Estado actual
- Next.js 16 / React 19 listo para Vercel.
- Supabase conectado al proyecto `gwldnuekmwpwfnustqlu`.
- Postgres + PostGIS para incidentes geolocalizados.
- Edge Function `emergency-gateway` para ingreso anónimo y mapa público seguro.
- Edge Function `emergency-email-broadcast` para alertas automáticas a usuarios autorizados.
- Storage privado `emergency-evidence` para imágenes y videos.
- PWA offline-first: IndexedDB + Service Worker + reintentos al recuperar conexión.
- Leaflet + cartografía raster para máxima compatibilidad móvil/escritorio; MapLibre queda disponible para funciones avanzadas.
- Vista pública limitada a incidentes recientes y sin acceso a evidencia privada.
- Centro de operaciones para `admin`, `operator` y `authority`.
- Dashboard exclusivo de administrador, registro paginado de reportes ciudadanos, historial, directorio territorial y auditoría de correos.
- Agente Gemini para triage asistido, priorización, recomendación territorial y prealertas controladas; nunca certifica la veracidad ni reemplaza un despacho oficial.
- Correo transaccional mediante **Resend API HTTP**.

## Flujo ciudadano
1. El reporte se guarda primero en IndexedDB con UUID y secreto local.
2. Si hay Internet, se sincroniza; si se corta la señal, queda en cola.
3. El reporte JSON llega a la Edge Function de Supabase.
4. La evidencia recibe una URL firmada y se sube directamente a Storage.
5. El ciudadano recibe su código `EMG-...` sin esperar al análisis IA.
6. En segundo plano se ejecutan el agente IA y las alertas de correo internas.
7. Reportes cercanos de una misma categoría pueden consolidarse en un incidente.

## Privacidad
El mapa público expone únicamente campos sanitizados. `reports`, descripciones privadas, análisis IA, rutas de Storage, evidencia y directorio territorial son de acceso institucional.

## Administrador
No hay registro público. Crea usuarios desde **Supabase > Authentication > Users**.

El correo `contacto@innova-space-edu.cl` se registra automáticamente como `admin` activo. El administrador dispone de:
- Dashboard general con totales reales.
- Registro de todos los reportes ciudadanos, paginado.
- Emergencias activas e historial.
- Evidencia privada.
- Agente IA y acciones pendientes.
- Directorio territorial y organizaciones.
- Solicitudes de acceso.
- Alertas por correo y auditoría Resend.

## Resend
### Variables en Vercel
Configurar en Production, Preview y Development cuando corresponda:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
EMAIL_SEND_TO=contacto@innova-space-edu.cl
ADMIN_EMAIL=contacto@innova-space-edu.cl
```

`EMAIL_FROM` debe usar un dominio verificado en Resend. Los correos enviados por un operador usan el remitente institucional verificado; el correo de la cuenta que ejecuta la acción se usa como `Reply-To`, y el administrador recibe copia cuando corresponde.

### Secrets en Supabase Edge Functions
Para que las alertas automáticas de nuevas emergencias y cambios críticos funcionen aunque el usuario no esté mirando el panel, configurar también:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
ADMIN_EMAIL=contacto@innova-space-edu.cl
INNOVA_EMERGENCY_URL=https://emergencias-4yfs.vercel.app
```

La misma API key de Resend puede utilizarse en Vercel y en Supabase. No se guarda ninguna API key en GitHub.

## Vercel
- Framework Preset: Next.js
- Root Directory: `/`
- Build Command: `npm run build`
- Output Directory: vacío / automático
- Node.js: 22.x
- Branch de producción: `main`

Variables generales: ver `.env.example`. No se necesita `SUPABASE_SERVICE_ROLE_KEY` en Vercel.

## Backend reproducible
El repositorio incluye `supabase/migrations/` y `supabase/functions/` para que GitHub sea la fuente reproducible del esquema y de las Edge Functions.
