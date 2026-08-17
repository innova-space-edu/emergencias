# Innova Emergency

**Innova Emergency** es una plataforma ciudadana de canalización, clasificación, seguimiento y gestión de emergencias geolocalizadas desarrollada por **Innova Space Education SpA**.

> **Aviso operacional:** esta plataforma complementa la comunicación ciudadana. **No reemplaza 131 SAMU, 132 Bomberos, 133 Carabineros ni SAE/SENAPRED**, y no constituye por sí sola una orden oficial de despacho.

---

## Objetivo

Permitir que cualquier persona pueda reportar una emergencia de forma rápida y anónima, incluso con conectividad deficiente, y entregar a usuarios autorizados herramientas para:

- organizar reportes;
- consolidar posibles duplicados;
- priorizar casos;
- visualizar incidentes geolocalizados;
- analizar con IA;
- derivar por localidad;
- notificar organismos y radios;
- registrar evidencia privada;
- seguir el estado operativo;
- cerrar casos;
- conservar un historial completo y auditable.

La arquitectura parte en la **Región de Antofagasta** y está preparada para escalar territorialmente al resto de Chile.

---

## Stack principal

<table>
<tr>
<td align="center" width="33%">
<img src="https://img.shields.io/badge/Next.js-16.2.12-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/><br/>
<b>Aplicación y API</b><br/>
<sub>App Router, React 19, TypeScript y Node.js 22.</sub>
</td>
<td align="center" width="33%">
<img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20PostGIS-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/><br/>
<b>Backend operacional</b><br/>
<sub>Auth, RLS, Storage privado, SQL y Edge Functions.</sub>
</td>
<td align="center" width="33%">
<img src="https://img.shields.io/badge/AI-Gemini%20%E2%86%92%20Groq%20%E2%86%92%20OpenRouter-7C3AED?style=for-the-badge" alt="AI"/><br/>
<b>Agente IA resiliente</b><br/>
<sub>Triage, prioridad, clasificación y respaldo multi-proveedor.</sub>
</td>
</tr>
<tr>
<td align="center">
<img src="https://img.shields.io/badge/Resend-Email-111827?style=for-the-badge&logo=resend&logoColor=white" alt="Resend"/><br/>
<b>Correo transaccional</b><br/>
<sub>Alertas, canalización y auditoría de entregas.</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Leaflet-Mapas-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet"/><br/>
<b>Cartografía</b><br/>
<sub>Mapa público y operativo responsive.</sub>
</td>
<td align="center">
<img src="https://img.shields.io/badge/Vercel%20%2B%20GitHub-Deploy%20%2B%20CI-2563EB?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy"/><br/>
<b>Entrega continua</b><br/>
<sub>Vercel para producción y GitHub Actions para validación.</sub>
</td>
</tr>
</table>

Tecnologías complementarias: PWA, Service Worker, IndexedDB, MapLibre GL, Supabase SSR y almacenamiento privado de evidencia.

---

## Arquitectura general

```text
CIUDADANO
   │
   ├─ categoría
   ├─ descripción
   ├─ GPS / punto manual
   ├─ riesgos observados
   └─ fotos / videos
        │
        ▼
PWA OFFLINE-FIRST
IndexedDB + Service Worker
        │
        ▼
Supabase Edge Function
emergency-gateway
        │
        ├─ validación
        ├─ rate limiting
        ├─ idempotencia
        ├─ deduplicación geográfica/temporal
        ├─ incidente
        ├─ reporte ciudadano
        └─ URLs firmadas de evidencia
        │
        ├──────────────────────────────┐
        │                              │
        ▼                              ▼
AGENTE IA                        ALERTAS INTERNAS
agent-worker                     emergency-email-broadcast
        │                              │
Gemini                           Resend
  ↓                                   │
Groq                                  │
  ↓                                   │
OpenRouter                            │
        │                              │
        └──────────────┬───────────────┘
                       ▼
               CENTRO DE OPERACIONES
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
 emergencias        directorio       historial
 activas            territorial      y auditoría
```

---

## Flujo ciudadano

1. El navegador genera un identificador local/idempotente.
2. El reporte se guarda en IndexedDB antes de depender de la red.
3. Si existe conexión, se sincroniza inmediatamente.
4. Si falla la conexión, queda en cola para reintento.
5. `emergency-gateway` valida el reporte.
6. Se crea o reutiliza un incidente consolidado.
7. Las evidencias se cargan con URLs firmadas al Storage privado.
8. El ciudadano recibe un código `EMG-...` sin esperar a la IA.
9. Después de responder al ciudadano se ejecutan tareas posteriores como IA y alertas internas.
10. La evidencia local se elimina después de la confirmación del servidor.

Cerrar la pestaña no elimina intencionalmente un reporte pendiente de IndexedDB. El navegador o sistema operativo puede, en circunstancias extremas, limpiar almacenamiento local.

---

## Reporte de emergencia

El formulario ciudadano puede registrar:

- categoría;
- descripción;
- Región;
- comuna/ciudad;
- sector/localidad;
- dirección aproximada;
- coordenadas GPS;
- selección manual sobre mapa;
- fuego/humo;
- personas heridas;
- personas atrapadas;
- peligro eléctrico;
- vía bloqueada;
- fotografías;
- videos breves.

La evidencia multimedia es **privada**.

---

## Mapa público

El mapa ciudadano no funciona como historial infinito.

### Ventana pública

Se muestran principalmente incidentes con actividad dentro de las **últimas 24 horas**. El historial completo queda reservado a cuentas autorizadas.

### Colores por estado

| Estado | Color |
|---|---|
| Recibida / en revisión | Amarillo |
| Verificada | Naranjo |
| Crítica | Rojo |
| Organismos notificados | Azul |
| En atención | Morado |
| Resuelta | Verde |
| Cerrada / descartada | Negro |

La prioridad 1–5 se mantiene como dato separado del estado.

### Alta carga

Las listas pueden organizarse así:

```text
HORA
└── CATEGORÍA
    └── PRIORIDAD
        └── MÁS RECIENTE
```

Los bloques son plegables para evitar listas interminables.

---

## Centro de operaciones

Ruta principal:

```text
/operaciones
```

El acceso requiere un perfil activo.

Roles:

```text
admin
operator
authority
```

**Emergencias activas es la primera vista operativa y la primera opción del menú para todos los roles, incluido el administrador.**

No existe registro público de cuentas. Las identidades se administran con Supabase Auth y los permisos con la tabla `profiles` + RLS.

---

## Administrador

El administrador dispone de acceso ampliado a:

- emergencias activas;
- Dashboard general;
- todos los reportes ciudadanos;
- evidencia privada;
- Agente IA;
- historial completo;
- directorio territorial;
- organizaciones;
- canales de contacto;
- solicitudes de acceso;
- alertas por correo;
- auditoría Resend;
- actividad operativa y auditoría.

El correo institucional principal utilizado en la administración es:

```text
contacto@innova-space-edu.cl
```

---

## Dashboard administrador

Ruta:

```text
/operaciones/admin
```

Incluye una vista ejecutiva con KPI y gráficos dinámicos.

Indicadores principales:

- emergencias registradas;
- activas;
- finalizadas;
- prioridad alta/crítica;
- cantidad de reportes;
- evidencia;
- estado del Agente IA;
- canalizaciones;
- correos enviados/fallidos;
- usuarios activos;
- solicitudes pendientes.

### Visualización

El Dashboard incorpora gráficos **donut** y distribución por:

- estado;
- categoría;
- correo Resend;
- actividad por hora durante las últimas 24 horas.

Está preparado para refresco periódico y actualización manual.

---

## Registro de reportes ciudadanos

Ruta:

```text
/operaciones/admin/reportes
```

Conserva los reportes individuales aunque varios terminen asociados al mismo incidente.

Puede mostrar:

- tipo original reportado;
- descripción;
- fechas de captura/recepción;
- localidad;
- riesgos;
- modo offline/online;
- incidente consolidado;
- evidencia relacionada;
- estado y prioridad del incidente.

La vista es paginada y organizada por hora/categoría.

---

## Emergencias activas

Los incidentes no finalizados se trabajan desde `/operaciones`.

Filtros operativos incluyen o pueden combinar:

- categoría;
- prioridad;
- estado;
- localidad;
- última hora;
- últimas 3/6/12/24 horas;
- todas las activas.

Dentro del caso se puede:

- revisar el detalle privado;
- cambiar categoría;
- subir/bajar prioridad;
- cambiar estado;
- revisar reportes asociados;
- abrir evidencia privada;
- ejecutar/reintentar IA;
- canalizar;
- enviar correo;
- finalizar.

---

## Finalización e historial

Al finalizar una emergencia:

1. pasa a `resolved`;
2. se guarda `resolved_at`;
3. sale del listado de activas;
4. queda auditada;
5. permanece en el historial.

Ruta:

```text
/operaciones/historial
```

El historial permite filtrar por código, comuna, localidad, categoría, estado y fechas.

---

# Agente IA

Ruta:

```text
/operaciones/agente
```

La IA funciona como **asistente operativo**, no como autoridad de despacho.

## Funciones

- clasificación de categoría;
- estimación de prioridad;
- resumen estructurado;
- detección de inconsistencias;
- recomendación de organismos;
- apoyo al triage;
- clasificación de casos para revisión humana;
- análisis de imágenes cuando el proveedor disponible lo permite;
- registro de ejecuciones y fallos;
- creación de acciones sugeridas.

## Arquitectura multi-proveedor

El worker principal se ejecuta en Supabase:

```text
supabase/functions/agent-worker
```

Orden de proveedores:

```text
1. Gemini
      ↓ si falla / cuota / timeout / error
2. Groq
      ↓ si falla
3. OpenRouter
      ↓
Revisión humana + error registrado
```

### Gemini

Proveedor principal para análisis multimodal. Puede recibir las imágenes privadas seleccionadas por el backend.

Modelo por defecto:

```text
gemini-3.6-flash
```

### Groq

Primer respaldo para triage rápido basado en texto y metadatos.

Modelo configurable; valor inicial:

```text
openai/gpt-oss-20b
```

### OpenRouter

Segundo respaldo. Permite enrutar solicitudes a modelos compatibles mediante una API única.

Modelo configurable; valor inicial:

```text
openai/gpt-oss-20b
```

### Evidencia y fallback

Cuando Gemini no está disponible y el worker cae a un proveedor de respaldo de texto, el prompt indica explícitamente que **no puede afirmar nada sobre el contenido visual de las imágenes que no recibió**. Puede seguir clasificando usando descripción, categoría y riesgos marcados.

### Registro del proveedor

Cada ejecución completada guarda el proveedor/modelo utilizado, por ejemplo:

```text
gemini:gemini-3.6-flash
groq:openai/gpt-oss-20b
openrouter:openai/gpt-oss-20b
```

Si todos fallan, se registra una ejecución `failed` con el motivo para que la bandeja no quede silenciosamente en cero.

## Bandeja del Agente

Separa:

```text
Fallos del agente
Revisión humana urgente
Revisión humana
Triage automático
Acciones pendientes
```

Incluye botón para procesar emergencias pendientes y estado de proveedores.

## Límites de la IA

La IA no debe:

- certificar que un reporte sea verdadero;
- identificar personas a partir de evidencia;
- inventar datos;
- despachar oficialmente recursos;
- llamar automáticamente al 131/132/133;
- sustituir la revisión humana en casos críticos, ambiguos o de baja confianza.

La aplicación aplica reglas duras fuera del modelo.

---

## Secrets del Agente IA

Configurar en:

```text
Supabase > Edge Functions > Secrets
```

Se necesita **al menos un proveedor**:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash

GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b

OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-oss-20b
```

Si se configuran los tres, el agente usa el orden Gemini → Groq → OpenRouter.

Nunca usar `NEXT_PUBLIC_` para estas claves.

---

## Directorio territorial

Ruta:

```text
/operaciones/directorio
```

Solo visible a usuarios autorizados.

Estructura:

```text
Región
└── Comuna
    └── Localidad
        └── Organización
            └── Canal
```

Canales soportados:

- email;
- teléfono;
- WhatsApp;
- Facebook;
- Instagram;
- X;
- web;
- radio;
- Zello;
- SMS;
- manual.

Cada contacto puede conservar fuente, fecha de verificación, estado activo y autorización de automatización.

La base territorial incluye localidades de la Región de Antofagasta y soporte para sincronización desde fuentes oficiales.

---

## Canalización territorial

Al abrir una emergencia se priorizan contactos de:

```text
localidad exacta
      ↓
comuna como respaldo
```

No se debe mostrar indiscriminadamente el directorio completo de toda la región.

Para cada organización se ofrecen únicamente sus canales disponibles.

---

## Correo a autoridades y radios

El envío real por correo usa **Resend API HTTP**.

Antes de enviar, el operador puede revisar/editar:

- destinatario;
- copia al administrador;
- Reply-To;
- asunto;
- cuerpo completo.

Después queda archivado:

- organización;
- destinatario;
- copia;
- asunto;
- cuerpo enviado;
- estado;
- fecha;
- error;
- ID de Resend.

Los canales manuales no se marcan falsamente como enviados.

---

## Resend en Vercel

Variables para envíos iniciados desde Next.js:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
EMAIL_SEND_TO=contacto@innova-space-edu.cl
ADMIN_EMAIL=contacto@innova-space-edu.cl
```

El dominio/remitente de `EMAIL_FROM` debe estar autorizado en Resend.

---

## Alertas automáticas de correo

Edge Function:

```text
emergency-email-broadcast
```

Eventos internos relevantes:

```text
staff_new_incident
staff_critical
staff_responding
staff_resolved
```

Las alertas automáticas usan los correos de perfiles activos con notificaciones habilitadas y pueden usar BCC para no exponer direcciones entre usuarios.

Secrets en Supabase:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
ADMIN_EMAIL=contacto@innova-space-edu.cl
INNOVA_EMERGENCY_URL=https://emergencias-4yfs.vercel.app
```

Los resultados se almacenan en `email_delivery_log`.

---

## Edge Functions

Versionadas en el repositorio:

```text
supabase/functions/emergency-gateway
supabase/functions/agent-gateway
supabase/functions/agent-worker
supabase/functions/emergency-email-broadcast
```

### `emergency-gateway`

Recepción anónima, idempotencia, rate limiting, deduplicación, incidentes, reportes, mapa público sanitizado y evidencia.

### `agent-worker`

Motor actual del agente IA, procesamiento de pendientes y fallback multi-proveedor.

### `agent-gateway`

Infraestructura previa/auxiliar para reglas de agente, routing y acciones controladas.

### `emergency-email-broadcast`

Alertas automáticas internas y registro Resend.

---

## Evidencia privada

Bucket:

```text
emergency-evidence
```

Características:

- privado;
- carga mediante URLs firmadas;
- acceso solo institucional;
- URLs firmadas de corta duración;
- fotos/videos fuera del mapa público;
- imágenes limitadas para análisis IA;
- videos no enviados automáticamente a proveedores externos.

---

## Base de datos

PostgreSQL + PostGIS.

Principales dominios:

- `profiles`;
- `incidents`;
- `reports`;
- `evidence`;
- `organizations`;
- `organization_channels`;
- `organization_coverage`;
- `territorial_localities`;
- `incident_notifications`;
- `access_requests`;
- `audit_log`;
- `rate_limit_events`;
- `ai_agent_runs`;
- `ai_agent_actions`;
- `ai_agent_policies`;
- `email_delivery_log`.

---

## Seguridad

- RLS en tablas de aplicación expuestas.
- Auth de Supabase para cuentas institucionales.
- No existe signup público.
- Storage privado.
- secretos fuera del repositorio;
- service role nunca en el navegador;
- correo y acciones críticas auditadas;
- evidencia separada del mapa público;
- agente IA con revisión humana para casos de riesgo.

Nunca exponer:

```text
SUPABASE_SERVICE_ROLE_KEY
sb_secret_...
RESEND_API_KEY
GEMINI_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY
```

---

## Privacidad

Principios:

- privacy by design;
- minimización de datos;
- separación público/privado;
- evidencia no pública;
- trazabilidad administrativa;
- URLs firmadas para evidencia;
- evaluación previa antes de enviar datos sensibles a servicios externos;
- adaptación progresiva a la normativa chilena de protección de datos.

---

## PWA y offline

Incluye:

- manifest;
- Service Worker;
- IndexedDB;
- cola de sincronización;
- indicador de conexión;
- reintentos;
- conservación de evidencia hasta confirmación.

---

## Responsive

Diseñado para:

- PC;
- notebook;
- tablet;
- Android;
- iOS;
- navegadores modernos.

Incluye menú móvil, drawers contraíbles, mapas adaptativos, formularios fluidos y controles táctiles.

---

## Variables base de Next.js / Vercel

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://gwldnuekmwpwfnustqlu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty

RESEND_API_KEY=re_xxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
EMAIL_SEND_TO=contacto@innova-space-edu.cl
ADMIN_EMAIL=contacto@innova-space-edu.cl
```

Los secrets IA del worker se configuran principalmente en Supabase Edge Function Secrets.

Ver `.env.example`.

---

## Desarrollo local

```bash
npm install
npm run dev
```

Producción local:

```bash
npm run build
npm run start
```

Node requerido:

```text
22.x
```

---

## Vercel

Configuración:

```text
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build / automático
Output Directory: sin override
Install Command: automático
Node.js: 22.x
Production Branch: main
```

Health check:

```text
/api/health
```

El health check puede informar, sin revelar claves, el estado del gateway, Resend y los proveedores IA disponibles en `agent-worker`.

---

## GitHub Actions

Workflow:

```text
.github/workflows/ci.yml
```

Valida instalación y build/TypeScript antes de considerar un cambio estable.

Un `build-rate-limit` de Vercel es una limitación de despliegue y no equivale necesariamente a un error del código.

---

## Supabase reproducible

El repositorio conserva:

```text
supabase/migrations/
supabase/functions/
```

Los secretos de producción no se versionan.

---

## Principio operacional

```text
IA = analiza, prioriza, clasifica y recomienda
Aplicación = aplica reglas, permisos y auditoría
Usuario autorizado = decide casos complejos
Autoridad oficial = confirma y atiende por sus mecanismos oficiales
```

La plataforma debe acelerar la canalización sin sustituir a las instituciones responsables.

---

## Empresa

**Innova Space Education SpA**  
https://innova-space-edu.cl

© 2026 Innova Space Education SpA
