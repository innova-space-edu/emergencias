# Innova Emergencias

Plataforma ciudadana de canalización de emergencias geolocalizadas. **No reemplaza a los canales oficiales de emergencia.**

## Estado de la primera versión
- Next.js 16 / React 19 listo para Vercel.
- Supabase Free conectado al proyecto `gwldnuekmwpwfnustqlu`.
- Postgres + PostGIS para incidentes geolocalizados.
- Edge Function `emergency-gateway` para ingreso anónimo y mapa público seguro.
- Storage privado `emergency-evidence` para imágenes y videos.
- PWA offline-first: IndexedDB + Service Worker + Background Sync/reintentos.
- MapLibre + OpenFreeMap con fallback OpenStreetMap, geolocalización, búsqueda, clusters, fullscreen y panel expandible.
- Vista pública sin acceso a evidencia.
- Centro de operaciones para `admin`, `operator` y `authority` con evidencia privada, reportes completos, estado, auditoría y notificaciones.
- IA Gemini 3.6 Flash opcional y solo como apoyo de clasificación, nunca como verificación o despacho autónomo.
- Correo institucional con Nodemailer/Gmail.
- Directorio ampliable para autoridades, empresas de servicios y radios locales.

## Flujo ciudadano
1. El reporte se guarda **primero** en IndexedDB con UUID y secreto local.
2. Si hay Internet, se sincroniza. Si se corta la señal, queda en cola.
3. El reporte JSON llega a la Edge Function de Supabase.
4. La evidencia recibe una URL firmada y se sube directamente a Storage, sin transportar el video por Vercel.
5. Solo después de confirmarse la subida se elimina la copia local pendiente.
6. Reportes de la misma categoría, cercanos en espacio/tiempo, pueden agruparse en un incidente.

## Privacidad
El endpoint del mapa público expone exclusivamente campos públicos del incidente y estados de canalización. `reports`, `description_private`, análisis IA, rutas de Storage y evidencias no se entregan al ciudadano.

## Administrador
No hay registro público. Crea el usuario manualmente en Supabase **Authentication > Users**.

Si el correo creado es `contacto@innova-space-edu.cl`, el trigger lo registra automáticamente en `public.profiles` como `admin` y `active=true`. Otros usuarios creados manualmente quedan como `operator` e `active=false` hasta que el administrador cambie su perfil.

## Vercel
Proyecto recomendado: `emergencias` dentro de `emorales-3065's projects`.

Configuración:
- Framework Preset: Next.js
- Root Directory: `/`
- Build Command: `npm run build`
- Output Directory: **vacío / automático**
- Node.js: 22.x
- Branch de producción: `main`

Variables: ver `.env.example`. No se necesita `service_role` en Vercel: la Edge Function usa las credenciales server-side que Supabase provee internamente.

## GitHub
Repositorio objetivo: `innova-space-edu/emergencias`.

El repositorio debe incluir `supabase/migrations/` y `supabase/functions/emergency-gateway/` para que GitHub sea la fuente reproducible del backend además del frontend.

## Nota cartográfica
OpenFreeMap/OSM son la opción gratuita inicial. La interfaz desacopla el estilo mediante `NEXT_PUBLIC_MAP_STYLE_URL`, permitiendo cambiar proveedor o añadir PMTiles/autohospedado más adelante sin reescribir el mapa.
