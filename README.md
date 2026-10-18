# EXECUTIVE DARK CRM 2.0 — SISTEMA COMERCIAL EMPRESARIAL

> Plataforma CRM comercial general de alto rendimiento, completamente operativa de extremo a extremo, responsiva y diseñada bajo la estética **Executive Dark** con tipografía moderna, seguridad estricta y costo operativo de **$0.00 USD** (100% herramientas gratuitas y de código abierto).

---

## 1. CARACTERÍSTICAS PRINCIPALES

- **Gestión Comercial Integral**:
  - **Prospectos (Leads)**: CRUD completo, importación masiva desde CSV con descarte de duplicados y conversión en 1-clic a Cliente, Contacto y Oportunidad.
  - **Clientes y Contactos**: Directorio empresarial, contactos múltiples y **Ficha 360° del Cliente** con historial de cotizaciones, actividades y notas en vivo.
  - **Embudo Comercial (Kanban)**: Tablero interactivo con 7 etapas, Drag & Drop reactivo (`@dnd-kit`) y selectores accesibles.
- **Productividad y Agenda**:
  - **Actividades y Tareas**: Programación de reuniones, llamadas y visitas con alertas de vencimiento y toggle de completado en 1-clic.
  - **Calendario Interactivo**: Visualización por Mes, Semana y Día, con exportación de citas en formato estándar `.ics` compatible con Google Calendar, Apple y Outlook.
  - **Alertas en Topbar**: Campana de notificaciones en tiempo real para actividades prioritarias y vencidas.
- **Operaciones Comerciales y Documentación**:
  - **Catálogo de Bienes y Servicios**: Códigos SKU únicos, precios en USD, unidad de medida y cálculo de IVA (15% estándar).
  - **Constructor Dinámico de Cotizaciones**: Consecutivo formal `COT-2026-XXXX`, cálculo en vivo de subtotales, descuentos e IVA.
  - **Motor de PDF Vectorial**: Generación y descarga directa de ofertas comerciales en PDF corporativo nativo mediante `jspdf` y `jspdf-autotable`.
  - **Vista Web Imprimible**: Formato A4 corporativo con soporte nativo `@media print` para impresión física y firmas de aceptación.
  - **Gestor de Documentos Adjuntos**: Repositorio privado con límite de 5 MB por archivo y validación estricta de tipos MIME.
- **Inteligencia Comercial y Analítica**:
  - **Dashboard Ejecutivo**: Indicadores clave (Pipeline Value, Ventas Ganadas, Win Rate, Ticket Promedio) y 4 gráficos interactivos con Recharts.
  - **Centro de Reportes**: Reportes de oportunidades, rendimiento por vendedor y ranking de clientes con **exportación universal a CSV con UTF-8 BOM**.
  - **Motor de Automatizaciones**: Detección preventiva de negociaciones estancadas y caducidad automática de cotizaciones vencidas.
- **Seguridad y Control de Acceso (RBAC)**:
  - 4 niveles de privilegios: **Administrador**, **Gerente Comercial**, **Vendedor** y **Consulta**.
  - Sesiones cifradas con JWT compacto (`jose`) almacenadas en cookies seguras HttpOnly con SameSite.
  - Headers HTTP de seguridad en producción (`X-Frame-Options`, `X-Content-Type-Options`, `CSP`).

---

## 2. CREDENCIALES DE ACCESO DEMOSTRATIVAS

Todas las cuentas vienen preconfiguradas con la contraseña `Password123!` para evaluación inmediata:

| Correo Electrónico | Contraseña | Rol Asignado | Alcance de Permisos |
| :--- | :--- | :--- | :--- |
| `admin@crmexecutive.com` | `Password123!` | **Administrador** | Control total, configuración, gestión de usuarios, reportes y respaldos |
| `gerente@crmexecutive.com` | `Password123!` | **Gerente Comercial** | Gestión comercial completa, asignaciones, reportes y cotizaciones |
| `vendedor@crmexecutive.com` | `Password123!` | **Vendedor Senior** | Gestión de prospectos, clientes, tratos, cotizaciones y agenda propia |
| `consulta@crmexecutive.com` | `Password123!` | **Consulta / Auditoría** | Acceso de solo lectura para auditoría y visualización sin edición |

---

## 3. INSTALACIÓN Y EJECUCIÓN LOCAL

### Requisitos Previos
- **Node.js**: Versión 18.18 o superior (Recomendado Node 20 LTS o 22).
- **Gestor de paquetes**: npm (incluido con Node.js).

### Pasos de Instalación
```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd crm-kike

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno locales
cp .env.example .env.local

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible inmediatamente en `http://localhost:3000`.

---

## 4. COMANDOS DISPONIBLES

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` con Turbopack |
| `npm run build` | Compila la aplicación para producción y valida tipado estricto con TypeScript |
| `npm run start` | Inicia el servidor de producción optimizado |
| `npm test` | Ejecuta la batería automatizada de 25 pruebas de integración y seguridad |
| `npm run backup` | Genera una copia de seguridad timestamped de la base de datos con SHA-256 |
| `npm run restore` | Restaura la base de datos a partir del respaldo más reciente o archivo indicado |

---

## 5. GUÍA DE DESPLIEGUE EN PRODUCCIÓN ($0.00 USD)

El CRM está preparado para desplegarse de forma 100% gratuita en **Vercel** conectado opcionalmente con **Supabase**:

### 5.1. Despliegue en Vercel (Hobby Tier — $0.00)
1. Suba el código a un repositorio privado o público en GitHub, GitLab o Bitbucket.
2. Inicie sesión en [vercel.com](https://vercel.com/) y seleccione **"Add New Project"**.
3. Importe el repositorio de GitHub.
4. En la sección **Environment Variables**, configure las siguientes variables:
   - `JWT_SECRET`: Una cadena segura de al menos 32 caracteres (ej: `clave-secreta-crm-executive-produccion-2026-segura!`).
   - `NODE_ENV`: `production`
5. Haga clic en **Deploy**. Vercel compilará la aplicación y le asignará un dominio seguro HTTPS (`*.vercel.app`).

### 5.2. Conexión con Supabase PostgreSQL (Opcional — $0.00)
Si desea utilizar la base de datos relacional PostgreSQL en la nube en lugar del motor de persistencia local:
1. Cree un proyecto gratuito en [supabase.com](https://supabase.com/).
2. Diríjase a **SQL Editor** en el panel de Supabase y ejecute el archivo de migración provisto en:
   [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. En las variables de entorno de Vercel, agregue:
   - `NEXT_PUBLIC_SUPABASE_URL`: Su URL de proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Su Anon Public Key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Su Service Role Key (privada).

---

## 6. POLÍTICA DE RESPALDOS Y RECUPERACIÓN

1. **Copia de Seguridad Automática**:
   - Ejecute `npm run backup` desde la terminal o haga clic en **"Descargar Respaldo JSON"** en `/configuracion` (requiere rol Admin o Gerente).
   - Los respaldos se archivan en `.data/backups/` con metadata y hash SHA-256.
2. **Restauración ante Contingencias**:
   - Ejecute `npm run restore` para volver al último punto seguro conocido. El script creará un snapshot de seguridad preventivo antes de aplicar los cambios.

---

## 7. ARQUITECTURA DE SEGURIDAD

- **Aislamiento Multi-Tenant**: Cada registro está vinculado estrictamente al `organization_id` de la empresa.
- **Sanitización y Validación**: Validación estricta con esquemas Zod en formularios y Server Actions.
- **Cero Dependencias Privadas**: Desarrollado 100% sobre tecnologías open-source y estándares web modernos.
