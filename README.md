# Innova Emergency

**Innova Emergency** es una plataforma ciudadana de canalización, clasificación, seguimiento y gestión de emergencias geolocalizadas, desarrollada por **Innova Space Education SpA**.

> **Aviso importante:** esta plataforma complementa la comunicación ciudadana. **No reemplaza 131 SAMU, 132 Bomberos, 133 Carabineros ni SAE/SENAPRED**, ni constituye por sí sola un despacho oficial de recursos de emergencia.

---

## 1. Objetivo del proyecto

La plataforma permite que cualquier persona pueda reportar de forma anónima una situación de emergencia usando ubicación GPS, descripción y evidencia multimedia. El sistema organiza los reportes, evita duplicados cuando corresponde, los muestra de forma sanitizada al público y entrega un **Centro de operaciones** privado para administrador, operadores y autoridades autorizadas.

El proyecto está diseñado para crecer desde la Región de Antofagasta hacia otras regiones de Chile sin cambiar la arquitectura principal.

---

## 2. Stack actual

- **Next.js 16.2.12** con App Router.
- **React 19.2.8**.
- **TypeScript 6.0.3**.
- **Node.js 22.x**.
- **Supabase** para PostgreSQL, PostGIS, Auth, Storage y Edge Functions.
- **Leaflet 1.9.4** como motor cartográfico principal compatible con escritorio y móvil.
- **MapLibre GL 5.12.0** disponible para funciones cartográficas avanzadas.
- **IndexedDB (`idb`)** para cola offline del ciudadano.
- **Service Worker / PWA** para funcionamiento offline-first.
- **Gemini** para triage y análisis asistido.
- **Resend API HTTP** para correo transaccional y alertas automáticas.
- **GitHub Actions** para validar instalación, TypeScript y build de Next.js.
- **Vercel** como hosting del frontend/backend Next.js.

Proyecto Supabase actual:

```text
gwldnuekmwpwfnustqlu
```

URL pública utilizada durante desarrollo:

```text
https://emergencias-4yfs.vercel.app
```

---

## 3. Arquitectura general

```text
CIUDADANO
   │
   ├─ GPS / ubicación manual
   ├─ descripción
   ├─ categoría
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
        ├───────────────────────────────┐
        ▼                               ▼
AGENTE IA                         ALERTAS INTERNAS
agent-gateway                     emergency-email-broadcast
Gemini                            Resend
        │                               │
        ▼                               ▼
CENTRO DE OPERACIONES ←──── usuarios autorizados
        │
        ├─ dashboard administrador
        ├─ emergencias activas
        ├─ agente IA
        ├─ historial
        ├─ reportes ciudadanos
        ├─ evidencia privada
        ├─ directorio territorial
        ├─ canalización / correo
        ├─ alertas de correo
        ├─ solicitudes de acceso
        └─ organizaciones
```

---

## 4. Flujo ciudadano

1. El navegador genera un identificador local e idempotente antes del envío.
2. El reporte se guarda primero en **IndexedDB**.
3. Si hay conexión, se intenta sincronizar inmediatamente.
4. Si la conexión falla, el reporte permanece en cola y se reintenta al volver Internet o al reabrir la aplicación.
5. El JSON del reporte llega a `emergency-gateway`.
6. El gateway valida, aplica límites de frecuencia y comprueba posibles duplicados.
7. Se crea o reutiliza un incidente consolidado.
8. Las fotografías y videos se cargan directamente al bucket privado mediante URLs firmadas.
9. El ciudadano recibe un código tipo:

```text
EMG-XXXXXXXXXX
```

10. La respuesta al ciudadano **no espera a Gemini ni al correo**.
11. En segundo plano se pueden ejecutar el agente IA y las alertas internas.
12. La evidencia local se elimina cuando el servidor confirma la recepción correctamente.

Cerrar la pestaña no elimina intencionalmente un reporte pendiente de IndexedDB. Como en cualquier PWA, el sistema operativo/navegador puede eliminar almacenamiento local bajo determinadas condiciones extremas.

---

## 5. Reporte de emergencia

El formulario ciudadano permite registrar, entre otros datos:

- categoría o tipo de emergencia;
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

La evidencia multimedia es **privada** y no se publica en el mapa ciudadano.

---

## 6. Mapa público

El mapa público está diseñado para informar sin transformarse en una base histórica infinita.

### Ventana pública

Solo se muestran incidentes recientes de aproximadamente **24 horas de actividad**. El historial completo queda reservado para usuarios autenticados.

### Estados y colores

| Estado operativo | Color |
|---|---|
| Recibida / en revisión | Amarillo |
| Verificada | Naranjo |
| Crítica | Rojo |
| Organismos notificados | Azul |
| En atención | Morado |
| Resuelta | Verde |
| Cerrada / descartada | Negro |

La **prioridad 1–5** se conserva independientemente del color del estado.

### Escalabilidad visual

Cuando existen muchos incidentes, las listas se organizan con la lógica:

```text
HORA
└── CATEGORÍA
    └── PRIORIDAD
        └── MÁS RECIENTE
```

Los bloques son plegables para evitar listas extensas y difíciles de operar.

### Compatibilidad

El mapa principal usa Leaflet y dispone de diseño responsive para PC, notebook, tablet y móvil. El panel de emergencias se transforma en drawer inferior en teléfonos y puede contraerse para dejar visible la cartografía.

---

## 7. Centro de operaciones

Ruta principal:

```text
/operaciones
```

Solo está disponible para usuarios autenticados con perfil activo.

Roles soportados:

```text
admin
operator
authority
```

No existe creación pública de cuentas desde la aplicación. Las identidades se administran mediante Supabase Auth y las solicitudes institucionales se revisan antes de habilitar acceso.

---

## 8. Administrador

El administrador posee acceso completo al entorno privado conforme a RLS y a las rutas administrativas.

El correo institucional principal configurado para administración es:

```text
contacto@innova-space-edu.cl
```

El proyecto incluye lógica para reconocer este correo como administrador activo cuando su identidad existe correctamente en Supabase Auth.

### Módulos exclusivos o ampliados del administrador

- Dashboard general.
- Registro completo de reportes ciudadanos.
- Historial completo.
- Emergencias activas.
- Evidencia privada.
- Agente IA.
- Directorio territorial.
- Organizaciones.
- Solicitudes de acceso.
- Alertas por correo.
- Auditoría de entregas Resend.
- Gestión/consulta de perfiles autorizados.

---

## 9. Dashboard administrador

Ruta:

```text
/operaciones/admin
```

El Dashboard está pensado como vista ejecutiva y operativa.

Incluye KPI independientes para:

- emergencias registradas;
- emergencias activas;
- finalizadas;
- prioridad alta/crítica;
- evidencia;
- casos IA sin decisión;
- canalizaciones;
- correos Resend;
- usuarios activos;
- solicitudes pendientes.

### Gráficos

Incluye gráficos tipo **donut** generados con datos reales para resumir:

- distribución por estado;
- distribución por categoría;
- estado de correos Resend.

También incorpora distribución de actividad de las últimas 24 horas por **hora + categoría**.

La vista puede actualizarse manualmente y está preparada para refresco periódico del Dashboard.

---

## 10. Registro de reportes ciudadanos

Ruta administrativa:

```text
/operaciones/admin/reportes
```

Permite revisar reportes individuales aunque varios hayan terminado consolidados en un mismo incidente.

El registro incluye, según disponibilidad:

- fecha de captura;
- fecha de recepción;
- incidente `EMG` asociado;
- tipo original informado por el ciudadano;
- descripción;
- Región/comuna/localidad;
- ubicación;
- riesgos observados;
- funcionamiento online/offline;
- evidencia asociada;
- prioridad/estado derivados del incidente.

La vista es paginada y utiliza agrupación por hora y categoría para evitar interfaces inmanejables cuando crece el volumen.

---

## 11. Emergencias activas e historial

### Emergencias activas

El Centro de operaciones permite trabajar sobre los incidentes que aún requieren seguimiento.

Filtros disponibles o previstos en la interfaz operativa incluyen:

- categoría;
- prioridad;
- estado;
- localidad;
- última hora;
- últimas 3 horas;
- últimas 6 horas;
- últimas 12 horas;
- últimas 24 horas;
- todas las activas.

### Finalizar emergencia

Un usuario autorizado puede marcar una emergencia como finalizada/resuelta.

Al finalizar:

1. cambia a `resolved`;
2. se guarda `resolved_at`;
3. el cambio queda auditado;
4. sale del listado operativo activo;
5. permanece en el historial general.

### Historial

Ruta:

```text
/operaciones/historial
```

Permite buscar por código, comuna, localidad, categoría, estado y rango de fechas. Está paginado y ordenado desde lo más reciente hacia lo más antiguo.

---

## 12. Agente IA

Ruta:

```text
/operaciones/agente
```

La IA funciona como **agente operativo asistido**, no como autoridad de despacho.

### Funciones

- clasificación de categoría;
- estimación de prioridad;
- resumen estructurado;
- detección de inconsistencias;
- recomendación de organismos;
- apoyo a deduplicación;
- análisis de evidencia privada cuando un usuario autorizado lo solicita;
- triage de casos simples;
- clasificación de casos que requieren revisión humana;
- creación de acciones propuestas;
- seguimiento de acciones fallidas o pendientes.

### Bandeja del agente

Separa casos como:

```text
Revisión humana urgente
Revisión humana
Triage automático
Acciones fallidas / pendientes
```

Los casos prioritarios aparecen antes que los automáticos.

### Reglas de seguridad

La IA **no**:

- certifica que un reporte sea verdadero;
- sustituye la verificación humana;
- genera una orden oficial de despacho;
- llama automáticamente al 131/132/133;
- debe enviar evidencia sensible a terceros sin una decisión explícita de privacidad y minimización de datos.

El modelo puede recomendar acciones; la aplicación decide qué acciones son legal y técnicamente ejecutables.

### Configuración

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

---

## 13. Directorio territorial

Ruta:

```text
/operaciones/directorio
```

Disponible únicamente para usuarios con cuenta autorizada.

La estructura territorial es:

```text
Región
└── Comuna
    └── Localidad
        └── Organización
            └── Canales
```

Tipos de organizaciones soportados incluyen:

- gestión de emergencias;
- municipio;
- Bomberos;
- salud;
- policías;
- electricidad;
- radios;
- otros organismos pertinentes.

Canales posibles:

- correo;
- teléfono;
- WhatsApp;
- Facebook;
- Instagram;
- X;
- web;
- frecuencia radial;
- Zello;
- SMS;
- canal manual.

Cada canal puede registrar fuente, verificación, estado activo y autorización de automatización.

### Localidades INE

El módulo dispone de infraestructura para sincronizar localidades oficiales de la **Región de Antofagasta** desde fuentes territoriales oficiales, evitando mantener manualmente un catálogo propenso a errores.

La arquitectura permite escalar posteriormente al resto de Chile.

---

## 14. Canalización a autoridades, municipios y radios

Al seleccionar una emergencia, el Centro de operaciones consulta la cobertura territorial correspondiente.

Prioridad de búsqueda:

```text
Localidad exacta
      ↓
si no hay coincidencia
      ↓
Comuna como respaldo
```

Por lo tanto, una emergencia en Antofagasta no debería mostrar indiscriminadamente organismos de Calama, Taltal o Tocopilla.

Para cada organismo se muestran únicamente los canales registrados disponibles.

### Acciones

- **Correo:** envío real mediante Resend.
- **Teléfono:** abre el marcador telefónico.
- **WhatsApp:** abre el canal correspondiente.
- **Facebook/Instagram/X/web/Zello:** abre el enlace registrado.
- **Radio/SMS/manual:** registra el intento o la acción manual, sin simular entrega automática.

Un contacto manual no convierte por sí mismo la emergencia en “notificada”.

---

## 15. Compositor y auditoría de correo

Antes de enviar un correo a una autoridad u organización, el operador puede revisar y editar:

- destinatario;
- copia al administrador;
- `Reply-To` del usuario que ejecuta la acción;
- asunto;
- cuerpo completo del mensaje.

El texto automático incluye datos relevantes del incidente y una advertencia de que Innova Emergency no constituye confirmación del hecho ni reemplaza canales oficiales.

Después del envío se conserva:

- organización;
- destinatario;
- copia;
- asunto;
- cuerpo exacto;
- fecha/hora;
- estado;
- error, si existe;
- ID devuelto por Resend.

Esto permite revisar exactamente qué fue enviado y no depender solo de una etiqueta “sent”.

---

## 16. Resend

El correo institucional se implementa mediante **Resend API HTTP**. No depende de `mailto:` ni de SMTP del navegador.

### Variables en Vercel

Configurar como secretos/variables del proyecto, nunca como `NEXT_PUBLIC_*`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
EMAIL_SEND_TO=contacto@innova-space-edu.cl
ADMIN_EMAIL=contacto@innova-space-edu.cl
```

`EMAIL_FROM` debe utilizar un dominio/remitente autorizado por Resend.

El usuario autenticado que ejecuta un envío puede quedar como `Reply-To`; el administrador recibe copia cuando corresponde.

### Secrets de Supabase Edge Functions

Las alertas automáticas se ejecutan en Supabase, por lo que la API key configurada en Vercel **no se comparte automáticamente** con las Edge Functions.

Configurar también en:

```text
Supabase > Edge Functions > Secrets
```

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
ADMIN_EMAIL=contacto@innova-space-edu.cl
INNOVA_EMERGENCY_URL=https://emergencias-4yfs.vercel.app
```

Supabase expone los secrets a las Edge Functions mediante variables de entorno. No se guardan las claves privadas en GitHub.

---

## 17. Alertas automáticas de correo

Edge Function:

```text
emergency-email-broadcast
```

Las cuentas activas pueden recibir alertas internas por eventos relevantes.

Eventos implementados:

```text
staff_new_incident
staff_critical
staff_responding
staff_resolved
```

Es decir:

- nueva emergencia;
- escalamiento a crítica;
- inicio de atención;
- finalización.

No se envían correos masivos por cada modificación menor para evitar fatiga de alertas.

Los destinatarios internos se pueden enviar usando BCC para evitar exponer correos entre usuarios.

Los resultados se almacenan en un log de entregas con:

- destinatario;
- evento;
- proveedor;
- estado;
- ID del proveedor;
- error;
- fecha.

Un fallo queda registrado como histórico y no se transforma retroactivamente en éxito.

---

## 18. Edge Functions Supabase

El repositorio versiona actualmente:

```text
supabase/functions/emergency-gateway
supabase/functions/agent-gateway
supabase/functions/emergency-email-broadcast
```

### `emergency-gateway`

Responsable principalmente de:

- recepción anónima;
- idempotencia;
- rate limiting;
- creación/consolidación de incidentes;
- acceso público sanitizado;
- generación/confirmación de URLs de evidencia;
- solicitudes de acceso.

### `agent-gateway`

Responsable del procesamiento asistido del agente IA y reglas de triage/automatización controlada.

### `emergency-email-broadcast`

Responsable de alertas automáticas internas mediante Resend y registro de entregas.

---

## 19. Evidencia privada

Bucket:

```text
emergency-evidence
```

Características:

- bucket privado;
- imágenes y videos no visibles en el mapa público;
- subida directa mediante URLs firmadas;
- acceso institucional autenticado;
- URLs firmadas de corta duración para visualización;
- auditoría de accesos/acciones donde corresponda;
- videos excluidos del análisis IA automático pesado cuando no son necesarios.

---

## 20. Base de datos y seguridad

La base utiliza PostgreSQL + PostGIS.

Áreas principales del esquema incluyen:

- perfiles/roles;
- incidentes;
- reportes ciudadanos;
- evidencia;
- organizaciones;
- cobertura territorial;
- canales de organizaciones;
- notificaciones de incidentes;
- solicitudes de acceso;
- auditoría;
- rate limiting;
- ejecuciones del agente IA;
- acciones propuestas/ejecutadas por IA;
- políticas de automatización;
- logs de correo y entregas automáticas.

### RLS

Las tablas expuestas utilizan políticas de seguridad por fila. El público solo recibe datos sanitizados definidos por el gateway/vistas permitidas.

Nunca debe colocarse una `service_role` o `sb_secret_*` en variables públicas del frontend.

### Datos públicos vs. privados

**Público:**

- código sanitizado;
- categoría/título público;
- estado;
- prioridad visual cuando corresponda;
- ubicación pública controlada;
- información resumida;
- situación de notificación sanitizada.

**Privado/institucional:**

- descripción completa;
- reportes originales;
- evidencia;
- análisis IA;
- auditoría;
- directorio territorial;
- información de contacto;
- contenido de correos;
- historial operativo completo.

---

## 21. Privacidad y cumplimiento

El diseño aplica principios de **privacy by design** y minimización de datos.

La plataforma está pensada para seguir endureciendo sus controles de acuerdo con la normativa chilena de protección de datos, incluyendo la entrada en vigor de la Ley 21.719.

Principios operativos:

- no publicar evidencia privada;
- limitar datos personales al mínimo necesario;
- no enviar evidencia sensible a IA externa sin justificación;
- mantener trazabilidad de acciones administrativas;
- separar información pública e institucional;
- utilizar conexiones seguras y secretos fuera del código fuente;
- permitir políticas diferenciadas de acceso y automatización.

---

## 22. Acceso institucional

Rutas públicas relacionadas:

```text
/login
/acceso
```

El login es una puerta única para:

- administrador;
- operador;
- autoridad.

Después de autenticar, el backend consulta el perfil activo y aplica el rol correspondiente.

El formulario institucional incorpora enlaces a:

- Privacidad;
- Seguridad;
- Gobernanza de IA;
- Términos y condiciones.

No se debe asumir que un usuario posee permisos solo por estar autenticado; el perfil debe estar activo y tener un rol permitido.

---

## 23. Diseño responsive

La interfaz está preparada para:

- PC;
- notebook;
- tablet;
- Android;
- iOS;
- navegadores modernos de escritorio y móvil.

Características responsive:

- menú móvil `☰`;
- acceso visible al Centro de operaciones;
- botón Reportar siempre accesible;
- drawers inferiores en mapas móviles;
- panel administrativo contraíble;
- formularios de dos columnas que pasan a una columna;
- controles táctiles ampliados;
- mapas calculados con `100dvh` para reducir problemas con barras móviles;
- Dashboard responsive;
- compositor de correo responsive.

---

## 24. PWA y funcionamiento offline

El proyecto incorpora:

- manifest;
- Service Worker;
- IndexedDB;
- indicador de conexión;
- cola de sincronización;
- reintentos;
- conservación de blobs de evidencia hasta confirmación.

El objetivo es que el reporte pueda capturarse incluso con conectividad débil y enviarse cuando vuelva la señal.

---

## 25. Deduplicación

El sistema puede consolidar reportes cuando existen coincidencias suficientes de:

- categoría;
- distancia geográfica;
- intervalo temporal;
- estado compatible.

La deduplicación no debe aplicarse ciegamente a situaciones móviles o eventos que puedan desplazarse.

---

## 26. Estados operativos de notificación

El modelo de seguimiento contempla una progresión como:

```text
NO ENVIADA
EN COLA
ENVIADA
ENTREGADA
RECEPCIÓN CONFIRMADA
ATENDIENDO
FINALIZADA
```

La plataforma distingue entre “abrir un canal/manual” y una entrega técnica confirmada. No se debe marcar falsamente una notificación como enviada si no existe confirmación del proveedor o del usuario responsable.

---

## 27. Variables de entorno de Next.js / Vercel

Ver `.env.example` para la referencia mantenida junto al código.

Configuración base:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://gwldnuekmwpwfnustqlu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash

RESEND_API_KEY=re_xxx
EMAIL_FROM=Innova Emergency <contacto@innova-space-edu.cl>
EMAIL_SEND_TO=contacto@innova-space-edu.cl
ADMIN_EMAIL=contacto@innova-space-edu.cl
```

`NEXT_PUBLIC_MAP_STYLE_URL` es opcional; existe una estrategia de fallback cartográfico.

### Nunca colocar en el navegador

```text
SUPABASE_SERVICE_ROLE_KEY
sb_secret_...
RESEND_API_KEY
GEMINI_API_KEY
```

No usar el prefijo `NEXT_PUBLIC_` para secretos.

---

## 28. Desarrollo local

Requisitos:

```text
Node.js 22.x
npm
```

Instalación:

```bash
npm install
```

Crear variables locales a partir de:

```text
.env.example
```

Ejecutar:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

Build de producción:

```bash
npm run build
npm run start
```

---

## 29. Vercel

Configuración recomendada:

```text
Framework Preset: Next.js
Root Directory: ./
Build Command: automático / npm run build
Output Directory: sin override
Install Command: automático
Node.js: 22.x
Production Branch: main
```

No configurar `app/` como Root Directory: `package.json` se encuentra en la raíz del repositorio.

### Health check

Existe una ruta de salud para comprobar servicios fundamentales:

```text
/api/health
```

Puede indicar, sin revelar secretos, si la aplicación, gateway, IA y correo están configurados.

### Rate limit de builds

Un rechazo de Vercel por `build-rate-limit` es una limitación del plan/cuenta y no implica necesariamente un fallo de Next.js. GitHub Actions se utiliza como validación independiente del código.

---

## 30. GitHub Actions

Workflow:

```text
.github/workflows/ci.yml
```

Valida al menos:

1. checkout;
2. Node.js 22;
3. instalación de dependencias;
4. build de Next.js / TypeScript;
5. generación/archivo del lockfile cuando corresponda.

El objetivo es no depender exclusivamente del resultado del deployment de Vercel para detectar errores de código.

---

## 31. Supabase reproducible

El repositorio mantiene:

```text
supabase/migrations/
supabase/functions/
```

Esto permite que GitHub sea la fuente reproducible de:

- estructura de base de datos;
- RLS;
- funciones SQL;
- índices;
- tablas territoriales;
- módulos IA;
- correo;
- Edge Functions.

Los secretos de producción **no** se versionan.

---

## 32. Recomendaciones operativas antes de producción masiva

Antes de habilitar derivaciones automáticas a gran escala:

1. verificar todos los dominios/remitentes de Resend;
2. probar correo con una cuenta/control interno;
3. verificar contactos de organismos y radios;
4. habilitar automatización canal por canal;
5. revisar privacidad de evidencia y GPS exacto;
6. probar escenarios offline y reintentos;
7. probar carga con muchos reportes concurrentes;
8. validar recuperación ante fallos de proveedor;
9. revisar periódicamente Supabase Security/Performance Advisors;
10. mantener revisión humana obligatoria para casos ambiguos, críticos o de baja confianza IA.

---

## 33. Principio de seguridad operacional

La plataforma está construida para **acelerar la canalización**, no para sustituir a las instituciones responsables.

```text
IA = analiza, prioriza, organiza y recomienda
Aplicación = aplica reglas y registra acciones
Usuario autorizado = decide cuando el caso requiere juicio humano
Autoridad oficial = confirma/atiende/despacha por sus mecanismos oficiales
```

Esta separación debe conservarse en futuras versiones.

---

## 34. Empresa

**Innova Space Education SpA**  
Sitio institucional: https://innova-space-edu.cl

© 2026 Innova Space Education SpA
