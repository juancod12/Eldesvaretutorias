# EL DESVARE — Plataforma de Cotizaciones

**Asesorías y Trabajos** — Plataforma web para solicitud de cotizaciones con envío automático por correo y WhatsApp Cloud API.

---

## Lo que incluye esta versión

- Página de inicio completa (hero, ¿cómo funciona?, servicios)
- Formulario multipaso en 5 pasos con barra de progreso animada
- Selección de servicio con tarjetas interactivas
- Campos dinámicos según el tipo de servicio
- Carga de archivos con drag & drop (hasta 5 archivos, 10MB c/u)
- Validación en frontend **y** backend
- Generación de ID único (formato `ED-2026-000001`)
- Envío automático de correo con todos los detalles y archivos adjuntos
- Envío automático a WhatsApp Cloud API (plantilla o texto)
- Modo mock para desarrollo sin credenciales de Meta
- Honeypot anti-spam + rate limiting
- Seguridad con Helmet
- Diseño responsive mobile-first
- Backend Node.js + Express listo para producción

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Backend | Node.js 18+, Express |
| Correo | Nodemailer (SMTP) |
| WhatsApp | Meta WhatsApp Cloud API (oficial) |
| Archivos | Multer |
| Seguridad | Helmet, express-rate-limit |
| IDs | Contador persistente en JSON |

---

## Estructura del proyecto

```
el-desvare/
├── public/
│   ├── index.html          ← Página principal
│   ├── css/styles.css      ← Todos los estilos
│   ├── js/app.js           ← Lógica del formulario
│   └── images/logo.png     ← Logo del negocio
│
├── server/
│   ├── server.js           ← Servidor Express
│   ├── routes/
│   │   └── requestRoutes.js
│   ├── controllers/
│   │   └── requestController.js
│   ├── services/
│   │   ├── requestService.js
│   │   ├── emailService.js
│   │   └── whatsappService.js
│   ├── templates/
│   │   ├── emailTemplate.js
│   │   └── whatsappTemplate.js
│   └── utils/
│       ├── idGenerator.js
│       └── validators.js
│
├── data/counter.json       ← Contador de IDs (auto-creado)
├── .env                    ← Variables reales (NO subir a Git)
├── .env.example            ← Plantilla de variables
├── .gitignore
└── package.json
```

---

## Instalación

### Prerrequisitos

- Node.js 18 o superior: https://nodejs.org
- npm (viene con Node.js)

### Pasos

```bash
# 1. Entra al directorio del proyecto
cd el-desvare

# 2. Instala las dependencias
npm install

# 3. Copia el archivo de variables de entorno
copy .env.example .env

# 4. Edita .env con tus credenciales reales
# (ver secciones abajo)

# 5. Ejecuta en modo desarrollo
npm run dev

# 6. Abre en el navegador
http://localhost:3000
```

---

## Configurar el correo (Gmail)

### Opción 1: Gmail con contraseña de aplicación (recomendada)

1. Activa la verificación en dos pasos en tu cuenta de Google
2. Ve a: https://myaccount.google.com/apppasswords
3. Crea una contraseña de aplicación para "Correo" / "Windows"
4. Copia la contraseña generada (16 caracteres)
5. Configura `.env`:

```env
BUSINESS_EMAIL=correo_del_negocio@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME=El Desvare
```

> El correo **`BUSINESS_EMAIL`** es donde llegarán las solicitudes.
> El correo **`SMTP_USER`** es el que envía (pueden ser el mismo).

### Opción 2: Otro proveedor SMTP

```env
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587
SMTP_USER=info@tudominio.com
SMTP_PASSWORD=tu_contraseña
```

---

## Configurar WhatsApp Cloud API (Meta)

### Paso 1: Crear cuenta en Meta for Developers

1. Ve a: https://developers.facebook.com
2. Inicia sesión con tu cuenta de Facebook
3. Haz clic en **"Mis apps"** → **"Crear app"**
4. Selecciona el tipo: **"Empresa"** o **"Negocios"**
5. Dale un nombre (ej. "El Desvare Bot")

### Paso 2: Agregar WhatsApp Business Platform

1. En el panel de tu app, busca y agrega el producto: **"WhatsApp"**
2. Selecciona o crea un **Meta Business Account**
3. En el menú lateral, ve a **WhatsApp → Primeros pasos**

### Paso 3: Obtener credenciales

En la sección **"Primeros pasos"** encontrarás:

- **Token de acceso temporal**: válido 24 horas (para pruebas)
  - Para producción necesitas un token permanente (ver abajo)
- **Phone Number ID**: el ID del número de WhatsApp configurado
- **Número de prueba**: un número de Meta para enviar mensajes de prueba

Copia estos valores en tu `.env`:

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_NUMBER=57XXXXXXXXXX
WHATSAPP_API_VERSION=v21.0
```

> **`WHATSAPP_BUSINESS_NUMBER`**: número donde el negocio recibirá las notificaciones.
> Debe incluir el código de país sin el "+". Ejemplo Colombia: `573001234567`

### Paso 4: Agregar número de prueba (desarrollo)

En **WhatsApp → Primeros pasos → "A"** (sección "Send and receive messages"):

1. Haz clic en **"Manage phone number list"**
2. Agrega el número del negocio como número de prueba verificado
3. Ingresa el código de verificación que llega por WhatsApp

### Paso 5: Token permanente para producción

1. Ve a tu **Meta Business Account** → **Configuración del sistema**
2. Crea un **usuario del sistema** con rol de administrador
3. Asigna el activo (tu app de WhatsApp) al usuario del sistema
4. Genera un token permanente para ese usuario del sistema
5. Asegúrate de que el token tenga los permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

---

## Plantillas de WhatsApp (para producción)

Para mensajes iniciados por el negocio (fuera de la ventana de 24h), Meta exige una **plantilla aprobada**.

### Crear la plantilla

1. En Meta Business Suite → **WhatsApp Manager** → **Plantillas de mensajes**
2. Haz clic en **"Crear plantilla"**
3. Configura:

| Campo | Valor |
|-------|-------|
| Nombre | `nueva_solicitud_cotizacion` |
| Categoría | **Utilidad** (Utility) |
| Idioma | Español (es) |

**Cuerpo del mensaje:**

```
Nueva solicitud de cotización en El Desvare.

ID: {{1}}
Cliente: {{2}}
Servicio: {{3}}
Presupuesto: {{4}}

Revisa tu correo para ver todos los detalles y archivos adjuntos.
```

> Las variables `{{1}}`, `{{2}}`, etc. son reemplazadas automáticamente por el sistema.

4. Envía la plantilla a revisión
5. Meta la aprueba en 24-48 horas (normalmente más rápido)
6. Una vez aprobada, configura en `.env`:

```env
WHATSAPP_TEMPLATE_NAME=nueva_solicitud_cotizacion
WHATSAPP_MOCK_MODE=false
```

### Si no tienes plantilla aprobada todavía

Durante el desarrollo, activa el modo mock:

```env
WHATSAPP_MOCK_MODE=true
```

El sistema construirá y mostrará el mensaje en la consola del servidor sin hacer llamadas reales a Meta.

---

## Variables de entorno completas

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `PORT` | Puerto del servidor (default: 3000) | No |
| `BUSINESS_EMAIL` | Correo donde llegan las solicitudes | Sí |
| `SMTP_HOST` | Servidor SMTP (ej. smtp.gmail.com) | Sí |
| `SMTP_PORT` | Puerto SMTP (587 o 465) | Sí |
| `SMTP_USER` | Usuario SMTP (tu correo) | Sí |
| `SMTP_PASSWORD` | Contraseña de aplicación | Sí |
| `EMAIL_FROM_NAME` | Nombre del remitente | No |
| `WHATSAPP_ACCESS_TOKEN` | Token de Meta | Para WA real |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp | Para WA real |
| `WHATSAPP_BUSINESS_NUMBER` | Número de destino (con código país) | Para WA real |
| `WHATSAPP_API_VERSION` | Versión de la API (ej. v21.0) | Para WA real |
| `WHATSAPP_TEMPLATE_NAME` | Nombre de la plantilla aprobada | Opcional |
| `WHATSAPP_MOCK_MODE` | `true` = modo prueba, `false` = real | No (default: true) |
| `UPLOAD_MAX_SIZE` | Tamaño máximo por archivo en bytes | No |
| `BUSINESS_WHATSAPP` | Número WA del negocio para botón de contacto | No |
| `SITE_URL` | URL del sitio en producción | No |

---

## Cambiar el logo

Reemplaza el archivo:

```
public/images/logo.png
```

Por tu logo (PNG con fondo transparente o claro, mínimo 200x200px).

---

## Cambiar colores

Edita las variables CSS en `public/css/styles.css`:

```css
:root {
  --primary: #0B1F33;    /* Azul oscuro principal */
  --accent: #F7B719;     /* Amarillo/dorado de acento */
}
```

---

## Cambiar número de WhatsApp

1. En `.env`: actualiza `BUSINESS_WHATSAPP` y `WHATSAPP_BUSINESS_NUMBER`
2. En `public/js/app.js`: actualiza `CONFIG.businessWhatsapp`

---

## Límites de archivos

Para cambiar el tamaño máximo por archivo:

```env
UPLOAD_MAX_SIZE=10485760   # 10MB (en bytes)
```

Para cambiar el máximo de archivos:
- En `server/routes/requestRoutes.js`: constante `MAX_FILES`
- En `public/js/app.js`: `CONFIG.maxFiles`

---

## Modo de ejecución

```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

---

## Deployment

### Render (recomendado — plan gratuito disponible)

1. Crea cuenta en https://render.com
2. Conecta tu repositorio de GitHub
3. Crea un **Web Service** con:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Agrega todas las variables de `.env` en la sección "Environment Variables"
5. ⚠️ **Importante**: En Render el sistema de archivos es efímero. Los uploads se perderán en cada deploy. Configura un almacenamiento externo para producción.

### Railway

1. Crea cuenta en https://railway.app
2. Nuevo proyecto → Deploy desde GitHub
3. Agrega las variables de entorno
4. Mismo problema con archivos locales

### VPS (Digital Ocean, Hetzner, Contabo)

- Instala Node.js 18+
- Usa PM2 para mantener el proceso activo: `pm2 start npm -- start`
- Configura Nginx como reverse proxy para HTTPS
- Los archivos son persistentes en VPS

### Almacenamiento de archivos para producción

Para producción real, considera migrar el almacenamiento de `server/uploads/` a:

| Servicio | Ventajas |
|----------|----------|
| **Cloudinary** | Fácil integración, plan gratuito generoso |
| **Supabase Storage** | Open source, plan gratuito, fácil |
| **Amazon S3** | Más robusto, costo por uso |
| **Backblaze B2** | Muy económico, compatible con S3 |

---

## Seguridad

- Archivos subidos guardados fuera de `public/` (no accesibles directamente)
- Validación de MIME type y extensión en backend
- Nombres de archivos renombrados con UUID (sin path traversal)
- Rate limiting: 100 req/15min general, 5 solicitudes/hora por IP
- Helmet con Content Security Policy
- Variables sensibles solo en `.env` (nunca en frontend)
- Honeypot anti-bots en el formulario
- No se muestran errores internos al usuario

---

## Problemas comunes

### El correo no llega

- Verifica que `SMTP_PASSWORD` sea una "contraseña de aplicación" de Google (no tu contraseña normal)
- Asegúrate de que la verificación en dos pasos esté activada en Gmail
- Revisa la carpeta de spam
- Verifica los logs del servidor

### WhatsApp: error 131030 (Template not found)

- La plantilla no existe o no está aprobada
- Verifica que `WHATSAPP_TEMPLATE_NAME` coincida exactamente con el nombre en Meta
- Activa `WHATSAPP_MOCK_MODE=true` mientras se aprueba la plantilla

### WhatsApp: error 190 (Access token expired)

- El token temporal de prueba tiene 24 horas de vigencia
- Genera un nuevo token o crea un token permanente con un usuario del sistema

### WhatsApp: error 131047 (Not in test recipient list)

- Durante el desarrollo, solo puedes enviar a números registrados como prueba en Meta
- Agrega el número destino a la lista de destinatarios de prueba

### Los archivos desaparecen en Render/Railway

- Es comportamiento esperado: el filesystem es efímero
- Solución: migrar a almacenamiento externo (Cloudinary, Supabase, S3)

---

## Próximas mejoras

- Panel administrativo en `/admin`
- Base de datos (PostgreSQL/Supabase) para historial de solicitudes
- Estados de solicitud (Nueva → En proceso → Terminada)
- Notificación al cliente por correo cuando se le responda
- Almacenamiento de archivos en Cloudinary/S3
- CAPTCHA opcional
- Estadísticas de solicitudes
- Autenticación para el panel admin
