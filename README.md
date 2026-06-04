# Nova Marketing CRM

CRM para **Nova Marketing**: una agencia que genera leads con **Meta Ads** para sus
clientes (inmobiliarias, barberías, clínicas…) y les entrega esos leads en un panel
sencillo, con el **coste por lead** y el **coste por cliente cerrado** siempre a la vista,
además de **automatizaciones de WhatsApp** para responder a cada lead al instante.

---

## ✨ Funcionalidades

- **Panel** con KPIs: inversión en Meta, leads, **coste por lead (CPL)**, **coste por
  cliente cerrado (CPA)**, conversión, ingresos y ROAS — con comparativa vs. periodo anterior.
- **Leads**: bandeja con filtros por estado, cliente y origen, búsqueda, ficha de lead con
  línea de tiempo, notas, cambio de estado y registro de mensajes.
- **Pipeline** tipo kanban por estado (Nuevo → Contactado → Cualificado → Cerrado / Perdido).
- **Clientes** (multi-cliente): cada cliente con sus campañas, leads, CPL y CPA. Portal para
  que cada cliente entre y vea **solo** sus propios datos.
- **Campañas** de Meta con inversión, leads y CPL; sincronización opcional desde la
  Marketing API de Meta.
- **Automatizaciones**: mensaje automático de bienvenida por WhatsApp a cada lead nuevo
  pidiéndole que explique mejor qué necesita, y seguimientos si no responde.
- **Mensajes**: historial de todos los WhatsApp enviados (modo simulación o en vivo).
- **Ajustes**: WhatsApp, integraciones, endpoints de entrada de leads y gestión de equipo.

## 🧱 Stack

- **Next.js 15** (App Router, React 19) + **TypeScript** + **Tailwind CSS v4**
- **Supabase** — Auth + Postgres
- Acceso a datos vía **Postgres directo** (`postgres`) sobre un esquema dedicado `nova`
- Gráficas en SVG propio (sin dependencias pesadas)

## 🗄️ Arquitectura de datos

Todo el CRM vive en un **esquema `nova`** aislado dentro del proyecto Supabase
*Barber Booster*, de modo que **no toca** las tablas `public` de las otras apps que
comparten ese proyecto. El esquema es **privado**: no está expuesto a la API pública de
Supabase y los roles `anon`/`authenticated` no tienen ningún acceso. La app accede a los
datos **solo desde el servidor** con `DATABASE_URL`, y el aislamiento por cliente
(multi-tenant) se aplica en la capa de datos (`src/lib/data`).

> El esquema (`supabase/migrations/0001_init_nova.sql`) y los datos de demo
> (`supabase/seed.sql`) **ya están aplicados** en tu proyecto. Para usar otro proyecto,
> ejecuta esos dos `.sql`.

## 🚀 Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena los valores (ver abajo)
npm run dev                  # http://localhost:3000
```

### Variables de entorno

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Auth (Supabase → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Auth (clave pública) |
| `DATABASE_URL` | ✅ | Datos del CRM (Supabase → Settings → Database) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Invitar equipo/clientes por email |
| `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | — | Enviar WhatsApp **de verdad** |
| `META_ACCESS_TOKEN` | — | Sincronizar campañas y gasto desde Meta |
| `META_VERIFY_TOKEN` | — | Verificar el webhook de Meta Lead Ads |
| `LEAD_INTAKE_SECRET` | — | Proteger la entrada genérica de leads |
| `CRON_SECRET` | — | Proteger los endpoints de cron |

### Primer acceso

Entra en `/login` y **crea una cuenta** (o usa el enlace mágico). **El primer usuario que
entra se convierte automáticamente en `owner`** (propietario de la agencia) y ve todos los
datos. Desde *Ajustes → Equipo* puedes invitar a más miembros o dar acceso a clientes
(cada cliente solo verá sus propios leads).

## 🔌 Integraciones

### Entrada de leads

- **`POST /api/leads/intake`** — para formularios web, landing pages o Zapier.
  ```bash
  curl -X POST https://TU-APP/api/leads/intake \
    -H "Content-Type: application/json" -H "x-nova-secret: $LEAD_INTAKE_SECRET" \
    -d '{"client_slug":"dialez","full_name":"Ana López","phone":"+34600000000","email":"ana@mail.com","source":"website"}'
  ```
- **`GET/POST /api/webhooks/meta`** — webhook de **Meta Lead Ads**. Configura la URL como
  `https://TU-APP/api/webhooks/meta?client=<ID_DEL_CLIENTE>` y `META_VERIFY_TOKEN` como
  token de verificación. Cada lead entra y dispara la automatización de bienvenida.

### WhatsApp

Sin `WHATSAPP_ACCESS_TOKEN` el CRM funciona en **modo simulación**: los mensajes se
registran (los ves en *Mensajes* y en la ficha del lead) pero no se envían. Pon el token +
*Phone Number ID* y cambia a **“En vivo”** en *Ajustes* para enviarlos por la WhatsApp
Cloud API.

### Meta Marketing API

Con `META_ACCESS_TOKEN`, el botón **“Sincronizar Meta”** (en Campañas y en cada cliente)
importa campañas y el gasto/leads diarios reales. `GET /api/meta/sync` hace lo mismo para
cron.

## 🤖 Automatizaciones

- **Bienvenida (lead nuevo)**: al entrar un lead, se le envía un WhatsApp pidiéndole que
  cuente mejor qué necesita. Se ejecuta al instante.
- **Seguimiento sin respuesta**: si un lead sigue en *Nuevo*/*Contactado* tras N horas,
  recibe un recordatorio. Se procesa con el cron `/api/automations/run` (o con el botón
  *“Procesar seguimientos”*).

Variables disponibles en los mensajes: `{{nombre}}`, `{{cliente}}`, `{{telefono}}`.

## ☁️ Despliegue en Vercel

1. Importa el repo en Vercel.
2. Añade las variables de entorno.
3. Deploy. El `vercel.json` incluye un cron diario para los seguimientos (auméntalo a cada
   15 min en el plan Pro si quieres respuestas más rápidas).

---

Hecho para Nova Marketing 💜
