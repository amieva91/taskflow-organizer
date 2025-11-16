# TaskFlow Organizer

**Sistema completo de gestión de tareas, proyectos, calendario y contactos** con sincronización de Google Calendar, importación/exportación de archivos .ics, y notificaciones inteligentes.

TaskFlow Organizer es una aplicación web moderna construida con React 19, TypeScript, tRPC 11 y Tailwind CSS 4 que centraliza la gestión de tu trabajo y vida personal en una interfaz intuitiva y eficiente.

---

## 🚀 Características Principales

### 📅 Calendario Avanzado

TaskFlow Organizer ofrece un sistema de calendario completo con capacidades profesionales que incluyen gestión de eventos recurrentes con soporte para patrones diarios, semanales, mensuales y anuales mediante reglas RRULE estándar. La plataforma permite importar y exportar eventos en formato iCalendar (.ics) con detección automática de duplicados y resolución de conflictos, además de sincronización bidireccional con Google Calendar para mantener todos tus eventos actualizados. El sistema incluye notificaciones push del navegador configurables por tipo de evento, visualización en múltiples vistas (mes, semana, día, lista), y búsqueda avanzada por título, descripción o ubicación.

### ✅ Gestión de Tareas

El módulo de tareas proporciona organización jerárquica con proyectos y subtareas, permitiendo estructurar el trabajo de manera lógica. Cada tarea puede configurarse con prioridades (urgente, alta, media, baja), estados personalizables (por hacer, en progreso, completada), fechas de vencimiento con recordatorios automáticos, y asignación a proyectos o contactos específicos. La vista de carga de trabajo muestra gráficamente la distribución temporal de tareas, facilitando la planificación y evitando sobrecargas.

### 📊 Proyectos

La gestión de proyectos incluye seguimiento de progreso con métricas automáticas, asignación de múltiples tareas por proyecto, fechas de inicio y fin con alertas de vencimiento, y estados personalizables. El dashboard de proyectos proporciona una vista consolidada del estado de todos los proyectos activos, permitiendo identificar rápidamente cuellos de botella o proyectos en riesgo.

### 👥 Contactos

El sistema de contactos centraliza la información de personas y organizaciones con campos completos (nombre, email, teléfono, empresa, cargo, notas), vinculación directa con tareas y eventos para trazabilidad completa, y búsqueda rápida por cualquier campo. Los contactos pueden asociarse automáticamente a eventos de calendario y tareas, creando un ecosistema integrado de información.

### 📈 Estadísticas y Análisis

TaskFlow Organizer genera automáticamente métricas de productividad incluyendo tasa de completado de tareas, distribución de tareas por estado y prioridad, eventos próximos y carga de trabajo semanal. El dashboard principal consolida todas estas métricas en una vista unificada que permite tomar decisiones informadas sobre la gestión del tiempo y recursos.

### 🔔 Notificaciones Inteligentes

El sistema de notificaciones incluye alertas push del navegador para eventos próximos (configurable de 5 a 60 minutos antes), recordatorios de tareas con fecha de vencimiento, y configuración granular por tipo de evento (personal, profesional, reunión, recordatorio). Las notificaciones respetan las preferencias del usuario y pueden activarse o desactivarse globalmente.

---

## 🛠️ Tecnologías Utilizadas

TaskFlow Organizer está construido sobre un stack tecnológico moderno y robusto que garantiza rendimiento, escalabilidad y mantenibilidad.

### Frontend

El frontend utiliza **React 19** con TypeScript para type safety completo, **Tailwind CSS 4** para estilos utilitarios y diseño responsive, **shadcn/ui** como biblioteca de componentes accesibles y personalizables, **FullCalendar** para la visualización avanzada de calendario, **tRPC React Query** para comunicación type-safe con el backend, y **Wouter** como router ligero. La gestión de estado se realiza mediante React Query con optimistic updates para una experiencia de usuario fluida.

### Backend

El servidor está construido con **Express 4** y **tRPC 11** para endpoints type-safe, **Drizzle ORM** para acceso a base de datos con migraciones automáticas, **MySQL/TiDB** como base de datos relacional, y **Manus OAuth** para autenticación segura. El backend implementa procedimientos protegidos que validan la identidad del usuario en cada request, garantizando la seguridad de los datos.

### Integraciones

TaskFlow Organizer se integra con **Google Calendar API** para sincronización bidireccional de eventos, **Google OAuth 2.0** para autenticación opcional, y soporta el estándar **iCalendar (RFC 5545)** para importación/exportación universal de eventos. El parser de archivos .ics implementa soporte completo para eventos recurrentes con RRULE, zonas horarias, y eventos de día completo.

---

## 📦 Instalación

### Requisitos Previos

Para ejecutar TaskFlow Organizer localmente, necesitas tener instalado **Node.js 18+** y **pnpm 8+** (o npm/yarn como alternativa), una base de datos **MySQL 8+** o **TiDB** accesible, y opcionalmente credenciales de **Google Cloud Console** si deseas habilitar la sincronización con Google Calendar.

### Configuración Paso a Paso

**Clonar el repositorio** desde GitHub ejecutando el siguiente comando en tu terminal:

```bash
git clone https://github.com/amieva91/taskflow-organizer.git
cd taskflow-organizer
```

**Instalar dependencias** del proyecto utilizando pnpm para garantizar versiones consistentes:

```bash
pnpm install
```

**Configurar variables de entorno** creando un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
# Base de datos
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/taskflow

# Autenticación
JWT_SECRET=tu_secreto_jwt_seguro_aqui
OWNER_OPEN_ID=tu_open_id
OWNER_NAME=Tu Nombre

# Google Calendar (opcional)
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/callback

# OAuth Server
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Aplicación
VITE_APP_ID=taskflow-organizer
VITE_APP_TITLE=TaskFlow Organizer
VITE_APP_LOGO=/logo.svg
```

**Ejecutar migraciones de base de datos** para crear las tablas necesarias:

```bash
pnpm db:push
```

Este comando utiliza Drizzle Kit para sincronizar el esquema definido en `drizzle/schema.ts` con tu base de datos MySQL.

**Iniciar el servidor de desarrollo** que ejecuta tanto el frontend como el backend:

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000` con hot-reload habilitado para desarrollo ágil.

### Configuración de Google Calendar (Opcional)

Para habilitar la sincronización con Google Calendar, debes crear un proyecto en Google Cloud Console, habilitar la Google Calendar API en la sección de APIs y Servicios, crear credenciales OAuth 2.0 configurando el origen autorizado como `http://localhost:3000` y el URI de redirección como `http://localhost:3000/api/oauth/callback`, y finalmente copiar el Client ID y Client Secret a tu archivo `.env`.

---

## 💻 Uso

### Primeros Pasos

Al acceder a TaskFlow Organizer por primera vez, el sistema te solicitará autenticación mediante Manus OAuth o Google OAuth. Una vez autenticado, serás redirigido al **Dashboard** principal que muestra un resumen consolidado de tareas totales y completadas, tasa de completado general, tareas programadas para hoy, proyectos activos en progreso, y próximos eventos de calendario.

### Gestión de Calendario

Para crear un nuevo evento, navega a la sección **Calendario** y haz clic en cualquier fecha o usa el botón **Nuevo Evento**. El formulario de creación permite configurar título y descripción del evento, fechas y horas de inicio y fin, tipo de evento (personal, profesional, reunión, recordatorio), ubicación opcional, y recurrencia si el evento se repite periódicamente.

La **importación de eventos** desde archivos .ics se realiza haciendo clic en el botón **Importar .ics** en la barra superior del calendario. El sistema mostrará un preview de todos los eventos detectados en el archivo, identificará duplicados comparando título, fecha y hora, y permitirá seleccionar qué eventos importar y cómo resolver conflictos (saltar, sobrescribir o crear nuevo).

Para **exportar eventos** a formato .ics compatible con cualquier aplicación de calendario, selecciona el rango de fechas deseado y haz clic en **Exportar .ics**. El archivo generado incluirá todos los eventos con sus propiedades completas (recurrencia, ubicación, descripción, zona horaria).

La **sincronización con Google Calendar** se activa desde la página de Configuración haciendo clic en **Conectar Google Calendar**. Una vez conectado, los eventos de Google aparecerán automáticamente en el calendario con un indicador visual distintivo, y cualquier cambio en TaskFlow se reflejará en Google Calendar.

### Gestión de Tareas

Para crear una tarea, navega a la sección **Tareas** y haz clic en **Nueva Tarea**. Configura el título y descripción detallada, prioridad (urgente, alta, media, baja) que afecta el orden de visualización, estado inicial (por hacer, en progreso, completada), fecha de vencimiento opcional con recordatorio automático, y asignación a proyecto o contacto para organización contextual.

La **vista de carga de trabajo** accesible desde el menú lateral muestra un gráfico temporal de la distribución de tareas por semana, permitiendo identificar períodos de alta carga y redistribuir tareas proactivamente. Las tareas pueden filtrarse por estado, prioridad, proyecto o contacto asignado.

### Gestión de Proyectos

Los proyectos se crean desde la sección **Proyectos** especificando nombre, descripción, fechas de inicio y fin, y estado inicial. Una vez creado el proyecto, puedes asignarle tareas existentes o crear nuevas tareas directamente vinculadas. El dashboard de proyectos muestra el progreso automático calculado como porcentaje de tareas completadas sobre tareas totales.

### Gestión de Contactos

La sección **Contactos** permite crear fichas completas de personas u organizaciones con nombre, email, teléfono, empresa, cargo y notas adicionales. Los contactos pueden vincularse a tareas y eventos, facilitando la búsqueda de toda la información relacionada con una persona específica. La búsqueda de contactos admite coincidencias parciales en cualquier campo.

### Configuración de Notificaciones

Desde **Configuración** puedes personalizar las notificaciones del navegador activando o desactivando notificaciones globalmente, configurando el tiempo de anticipación (5, 10, 15, 30, 60 minutos antes del evento), y seleccionando qué tipos de eventos generan notificaciones (personal, profesional, reunión, recordatorio). Las notificaciones requieren permiso del navegador que se solicita automáticamente al activar la función.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

El proyecto sigue una arquitectura modular que separa claramente las responsabilidades entre frontend, backend y configuración.

```
taskflow-organizer/
├── client/                 # Aplicación frontend React
│   ├── public/            # Archivos estáticos (favicon, imágenes)
│   └── src/
│       ├── components/    # Componentes reutilizables
│       │   ├── ui/       # Componentes shadcn/ui
│       │   ├── DashboardLayout.tsx
│       │   ├── ImportCalendarDialog.tsx
│       │   └── Map.tsx
│       ├── pages/        # Páginas principales de la app
│       │   ├── Home.tsx
│       │   ├── Calendar.tsx
│       │   ├── Tasks.tsx
│       │   ├── Projects.tsx
│       │   ├── Contacts.tsx
│       │   └── Settings.tsx
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utilidades y configuración tRPC
│       ├── contexts/     # React contexts (Theme, Auth)
│       └── App.tsx       # Configuración de rutas
├── server/               # Backend Express + tRPC
│   ├── _core/           # Infraestructura (OAuth, context, env)
│   ├── routers.ts       # Definición de endpoints tRPC
│   ├── db.ts            # Helpers de base de datos
│   ├── calendarEvents.ts # Lógica de calendario
│   ├── calendarImport.ts # Importación .ics
│   ├── recurrence.ts    # Expansión de eventos recurrentes
│   └── storage.ts       # Integración con S3
├── drizzle/             # Esquema y migraciones de BD
│   └── schema.ts        # Definición de tablas
├── shared/              # Tipos y constantes compartidas
└── package.json         # Dependencias y scripts
```

### Flujo de Datos

TaskFlow Organizer implementa un flujo de datos unidireccional basado en tRPC que garantiza type safety end-to-end. El frontend realiza llamadas a procedimientos tRPC mediante hooks de React Query (`useQuery`, `useMutation`), el servidor valida la autenticación del usuario mediante middleware de contexto, ejecuta la lógica de negocio consultando o modificando la base de datos a través de Drizzle ORM, y devuelve respuestas tipadas que React Query cachea automáticamente. Las mutaciones invalidan las queries relacionadas para mantener la UI sincronizada con el estado del servidor.

### Autenticación y Seguridad

El sistema de autenticación utiliza Manus OAuth como proveedor principal, generando tokens JWT firmados que se almacenan en cookies HTTP-only. Cada request a endpoints protegidos pasa por un middleware de contexto que valida el token, extrae el usuario autenticado, y lo inyecta en el contexto del procedimiento. Los procedimientos se definen como `publicProcedure` (acceso sin autenticación) o `protectedProcedure` (requiere usuario autenticado), garantizando que solo usuarios válidos accedan a datos sensibles.

---

## 🤝 Contribución

TaskFlow Organizer es un proyecto de código abierto que acepta contribuciones de la comunidad. Si deseas colaborar, sigue estos pasos para mantener la calidad y consistencia del código.

### Proceso de Contribución

**Fork del repositorio** creando una copia en tu cuenta de GitHub desde la página principal del proyecto. **Crea una rama** para tu feature o bugfix siguiendo la convención de nombres:

```bash
git checkout -b feature/nombre-descriptivo
# o
git checkout -b fix/descripcion-del-bug
```

**Realiza tus cambios** siguiendo las convenciones de código del proyecto (ESLint + Prettier configurados), escribiendo tests para nuevas funcionalidades cuando sea aplicable, y actualizando la documentación si introduces cambios en la API o comportamiento. **Commit de cambios** con mensajes descriptivos siguiendo Conventional Commits:

```bash
git commit -m "feat: añadir exportación de tareas a CSV"
git commit -m "fix: corregir cálculo de eventos recurrentes mensuales"
```

**Push a tu fork** y abre un Pull Request desde GitHub describiendo claramente los cambios realizados, el problema que resuelven, y cualquier consideración especial para los revisores.

### Guías de Estilo

El código TypeScript debe seguir las reglas de ESLint configuradas en el proyecto, utilizar tipos explícitos evitando `any` siempre que sea posible, y nombrar variables y funciones de forma descriptiva usando camelCase. Los componentes React deben ser funcionales con hooks, extraer lógica compleja a custom hooks, y manejar estados de loading, error y empty state. Las queries y mutaciones tRPC deben definirse en `server/routers.ts` con validación de input usando Zod, implementar manejo de errores con `TRPCError`, y documentar parámetros y valores de retorno.

### Áreas de Mejora Sugeridas

Algunas áreas donde las contribuciones son especialmente bienvenidas incluyen **mejoras de UX/UI** como animaciones y transiciones suaves, modo oscuro completo, y accesibilidad (ARIA labels, navegación por teclado), **nuevas integraciones** con Outlook Calendar, Apple Calendar, o Todoist, **optimizaciones de rendimiento** mediante lazy loading de componentes, paginación de listas largas, y caching más agresivo, y **testing** con tests unitarios para lógica de negocio, tests de integración para endpoints tRPC, y tests E2E con Playwright.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License**, lo que significa que puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del software libremente, siempre que incluyas el aviso de copyright y la licencia en todas las copias o porciones sustanciales del software.

---

## 🙏 Agradecimientos

TaskFlow Organizer fue desarrollado utilizando tecnologías de código abierto mantenidas por comunidades increíbles. Agradecimientos especiales a **Vercel** por React y Next.js, **Tailwind Labs** por Tailwind CSS, **tRPC** por la biblioteca de comunicación type-safe, **Drizzle Team** por el ORM moderno y eficiente, **shadcn** por la colección de componentes accesibles, y **FullCalendar** por la biblioteca de calendario profesional.

---

## 📞 Soporte

Si encuentras bugs, tienes preguntas o sugerencias de mejora, puedes abrir un **Issue** en GitHub describiendo el problema o sugerencia con el máximo detalle posible, o contactar al mantenedor principal en **amieva91@gmail.com**.

---

## 🗺️ Roadmap

Las siguientes características están planificadas para futuras versiones de TaskFlow Organizer:

**Versión 2.0** introducirá colaboración en tiempo real permitiendo compartir proyectos y tareas con otros usuarios, comentarios y menciones en tareas, y notificaciones en tiempo real mediante WebSockets. **Versión 2.1** añadirá aplicaciones móviles nativas para iOS y Android con sincronización offline, notificaciones push nativas, y widgets de home screen. **Versión 2.2** implementará inteligencia artificial con sugerencias automáticas de priorización de tareas, detección de conflictos de calendario, y resúmenes automáticos de productividad semanal.

---

**Desarrollado con ❤️ por Carlos Amieva**
