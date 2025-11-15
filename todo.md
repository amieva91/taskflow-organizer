# TaskFlow Organizer - TODO

## Configuración Inicial
- [x] Configurar OAuth de Google para Gmail y Google Calendar
- [x] Crear esquema de base de datos completo
- [x] Configurar variables de entorno para Google APIs

## Integración con Google Services
- [x] Implementar autenticación OAuth con Google
- [x] Integrar API de Google Calendar (lectura y escritura)
- [x] Integrar API de Gmail (lectura y envío de correos)
- [ ] Implementar importación de eventos existentes del calendario
- [x] Sincronización bidireccional con Google Calendar

## Gestión de Calendario
- [ ] Vista de calendario semanal
- [ ] Vista de calendario mensual
- [ ] Vista de calendario anual
- [ ] Vista de lista de eventos
- [ ] Crear eventos en el calendario
- [ ] Editar eventos existentes
- [ ] Eliminar eventos
- [ ] Asignar colores personalizados a eventos
- [ ] Sistema de etiquetas para eventos
- [ ] Añadir participantes a eventos (reales con email o ficticios)

## Gestión de Tareas
- [ ] Crear tareas individuales
- [ ] Editar tareas
- [ ] Eliminar tareas
- [ ] Asignar tareas a personas (reales o ficticias)
- [ ] Vista tipo Microsoft Planner para tareas
- [ ] Filtros avanzados para tareas
- [ ] Estados de tareas (pendiente, en progreso, completada)
- [ ] Prioridades de tareas
- [ ] Fechas de vencimiento
- [ ] Vista de agenda del día
- [ ] Planificador semanal

## Gestión de Proyectos (Estilo MS Project)
- [ ] Crear proyectos
- [ ] Definir fases de proyectos
- [ ] Crear tareas dentro de proyectos
- [ ] Asignar recursos a tareas de proyecto
- [ ] Definir horas de dedicación por recurso
- [ ] Abrir y cerrar tareas
- [ ] Diagrama de Gantt
- [ ] Visualización de carga de trabajo por recurso
- [ ] Vista de calendario con disponibilidad de recursos
- [ ] Drag and drop para ajustar tareas en el tiempo
- [ ] Definir dependencias entre tareas
- [ ] Hitos del proyecto
- [ ] Sprints
- [ ] Estadísticas del proyecto
- [ ] Visualización del estado del proyecto

## Gestión de Recursos y Contactos
- [ ] Crear departamentos
- [ ] Asignar integrantes a departamentos
- [ ] Lista de contactos reales (con email)
- [ ] Lista de contactos ficticios
- [ ] Gestión de disponibilidad de recursos
- [ ] Visualización de carga de trabajo

## Notificaciones y Comunicación
- [ ] Sistema de notificaciones en la aplicación
- [ ] Notificaciones push para móvil
- [ ] Envío de correos desde Gmail del usuario
- [ ] Notificaciones de recordatorio de eventos
- [ ] Notificaciones de asignación de tareas

## Funcionalidades Avanzadas
- [ ] Sugerencias inteligentes de slots de tiempo usando IA
- [ ] Optimización automática de calendario
- [ ] Detección de huecos disponibles
- [ ] Carga de imágenes en eventos y tareas
- [ ] Añadir recortes de pantalla
- [ ] Vista combinada (personal + profesional)
- [ ] Vista separada por tipo (personal/profesional)
- [ ] Actualización en tiempo real

## PWA y Móvil
- [ ] Configurar manifest.json para PWA
- [ ] Implementar service worker
- [ ] Soporte offline básico
- [ ] Widget de tareas para móvil
- [ ] Widget de eventos para móvil
- [ ] Widget de agenda del día
- [ ] Widget de próximo evento
- [ ] Atajos rápidos para crear tareas desde móvil
- [ ] Optimización responsive para móvil
- [ ] Instalación como app nativa

## UI/UX
- [ ] Diseño de interfaz principal con navegación
- [ ] Tema visual profesional y moderno
- [ ] Animaciones y transiciones suaves
- [ ] Estados de carga
- [ ] Manejo de errores
- [ ] Onboarding para nuevos usuarios
- [ ] Tutorial interactivo

## Testing y Optimización
- [ ] Pruebas de integración con Google APIs
- [ ] Pruebas de rendimiento
- [ ] Optimización de carga
- [ ] Pruebas en dispositivos móviles
- [ ] Pruebas de funcionalidad PWA

## Dashboard Principal
- [x] Implementar layout del dashboard con navegación lateral
- [x] Widget de resumen de estadísticas diarias
- [x] Widget de calendario compacto con eventos del día
- [x] Widget de tareas pendientes con prioridades
- [x] Widget de próximos eventos
- [x] Integración con Google Calendar en dashboard
- [ ] Gráficos de productividad
- [ ] Acceso rápido a crear tarea/evento

## Vista de Calendario Completa
- [x] Implementar FullCalendar con vistas mensual, semanal y diaria
- [x] Integración con eventos de Google Calendar
- [x] Crear eventos mediante drag-and-drop
- [x] Editar eventos existentes con modal
- [x] Sincronización bidireccional con Google Calendar
- [ ] Filtros por tipo de evento y colores
- [x] Vista de agenda/lista de eventos

## Bugs a Corregir
- [x] Solucionar problema de carga infinita en el calendario

## Página de Tareas con Vista Kanban
- [x] Implementar vista Kanban con columnas por estado
- [x] Drag-and-drop para mover tareas entre columnas
- [x] Modal para crear nuevas tareas
- [x] Modal para editar tareas existentes
- [x] Filtros por prioridad, proyecto y tipo
- [x] Búsqueda de tareas
- [ ] Asignación de tareas a contactos

## Página de Proyectos con Gantt
- [x] Implementar lista de proyectos con estadísticas
- [x] Modal para crear y editar proyectos
- [x] Vista de diagrama de Gantt con tareas del proyecto
- [x] Visualización de fases del proyecto
- [ ] Asignación de recursos a tareas
- [x] Seguimiento de progreso y porcentaje completado
- [ ] Gestión de dependencias entre tareas

- [x] Corregir error en Dashboard cuando no hay tokens de Google configurados

## Página de Contactos
- [x] Implementar lista de contactos con búsqueda y filtros
- [x] Modal para crear y editar contactos (reales y ficticios)
- [x] Gestión de departamentos
- [x] Asignación de contactos a departamentos
- [x] Vista de recursos por departamento
- [x] Integración con asignación de tareas

## Integración de Asignación de Contactos a Tareas
- [x] Añadir tabla de relación task_assignments en el esquema
- [x] Actualizar routers para incluir asignación de contactos
- [x] Modificar modal de tareas para permitir selección múltiple de contactos
- [x] Mostrar contactos asignados en las tarjetas de tareas
- [x] Actualizar vista Kanban con avatares de contactos asignados

## Sistema de Notificaciones por Email
- [x] Crear función para enviar notificaciones de asignación de tarea
- [x] Implementar plantilla HTML para emails de notificación
- [x] Añadir opción en modal de tareas para enviar notificaciones
- [x] Enviar notificaciones automáticas al asignar contactos
- [x] Filtrar contactos ficticios (no enviar emails a ficticios)
- [x] Manejar errores de envío de email gracefully

## Sugerencias Inteligentes de Slots de Tiempo con IA
- [x] Crear módulo de análisis de disponibilidad con Gemini AI
- [x] Implementar función para obtener eventos del calendario y tareas existentes
- [x] Analizar carga de trabajo de contactos asignados
- [x] Generar sugerencias de horarios óptimos basados en disponibilidad
- [x] Añadir botón de sugerencias en modal de crear tarea
- [x] Mostrar slots sugeridos con justificación de IA
- [x] Permitir seleccionar un slot sugerido para autocompletar fechas

## Filtro de Huecos Disponibles en Calendario
- [x] Añadir toggle para activar/desactivar vista de huecos disponibles
- [x] Crear función para calcular huecos entre eventos
- [x] Mostrar huecos disponibles como eventos especiales en el calendario
- [x] Añadir duración mínima configurable para filtrar huecos
- [x] Colorear huecos disponibles con color distintivo

## Drag and Drop de Tareas al Calendario
- [x] Añadir lista lateral de tareas sin fecha en el calendario
- [x] Implementar drag and drop de tareas al calendario
- [x] Detectar cuando se suelta sobre un hueco disponible
- [x] Actualizar tarea con fechas del hueco seleccionado
- [x] Feedback visual durante el arrastre
- [x] Mostrar confirmación al agendar tarea

## Edición de Duración de Tareas en Calendario
- [x] Permitir redimensionar eventos de tareas en el calendario
- [x] Actualizar startDate y dueDate al redimensionar
- [x] Mostrar feedback visual durante el resize
- [x] Confirmar cambios con toast

## Página de Estadísticas y Reportes
- [x] Crear página de Estadísticas con layout de gráficos
- [x] Gráfico de tareas completadas por día/semana/mes
- [x] Gráfico de distribución de tareas por prioridad
- [x] Gráfico de distribución de tareas por estado
- [x] Gráfico de tiempo dedicado por proyecto
- [x] Tabla resumen con métricas clave
- [x] Funcionalidad de exportar reporte a PDF
- [x] Filtros por rango de fechas

## Configuración PWA Completa
- [x] Crear manifest.json con metadatos de la app
- [x] Generar iconos en múltiples resoluciones (192x192, 512x512)
- [x] Implementar service worker para caché offline
- [x] Configurar estrategias de caché (network-first, cache-first)
- [x] Añadir soporte para instalación en dispositivos
- [x] Configurar notificaciones push
- [x] Añadir splash screens para iOS
- [x] Registrar service worker en el cliente

## Sistema de Recordatorios Automáticos
- [x] Crear tabla de configuración de recordatorios en el esquema
- [x] Implementar backend para gestionar recordatorios
- [x] Crear job scheduler para verificar tareas/eventos próximos
- [x] Implementar envío de notificaciones push
- [x] Crear página de configuración de recordatorios
- [x] Permitir configurar tiempo de anticipación (15min, 30min, 1h, 1día)
- [x] Añadir opción de activar/desactivar recordatorios por tarea
- [x] Solicitar permisos de notificaciones al usuario

## Vista de Carga de Trabajo por Recurso
- [x] Crear página de Workload/Carga de Trabajo
- [x] Implementar backend para calcular horas asignadas por contacto
- [x] Calcular disponibilidad semanal de cada contacto
- [x] Mostrar lista de contactos con métricas de carga
- [x] Visualizar calendario de disponibilidad por contacto
- [x] Añadir gráfico de barras con horas asignadas vs disponibles
- [x] Implementar alertas de sobrecarga (>40h semanales)
- [x] Permitir filtrar por departamento
- [x] Mostrar tareas asignadas a cada contacto
- [x] Añadir vista de timeline con asignaciones

## Lista Rápida del Día (Quick Capture)
- [x] Crear tabla quickNotes en el esquema de base de datos
- [x] Implementar backend para gestionar notas rápidas (CRUD)
- [x] Crear componente QuickCapture accesible desde el Dashboard
- [x] Añadir widget flotante/sidebar para captura rápida sin salir de la página actual
- [x] Permitir añadir notas rápidas con un solo campo de texto
- [x] Implementar checkbox para marcar notas como completadas
- [x] Añadir botón para convertir nota rápida en tarea programada
- [x] Permitir programar nota para otro día (mover a lista del día siguiente)
- [ ] Implementar opción de archivar notas completadas
- [ ] Añadir filtro para ver notas de días anteriores
- [x] Persistir notas del día automáticamente al día siguiente si no se completan
- [x] Añadir atajo de teclado (Ctrl+K o Cmd+K) para abrir captura rápida
- [x] Implementar drag and drop para reordenar prioridades en la lista
  - [x] Añadir campo sortOrder a tabla quickNotes
  - [x] Actualizar backend para gestionar orden de notas
  - [x] Instalar librería @dnd-kit/core para drag-and-drop
  - [x] Implementar drag-and-drop en componente QuickCapture
  - [x] Actualizar orden al soltar nota en nueva posición
- [ ] Añadir timestamps automáticos de creación
- [ ] Notificación al final del día para revisar notas pendientes

## Calendario Independiente y Sincronización Opcional con Google
- [x] Corregir error OAuth de Google Calendar (redirect_uri faltante)
- [x] Crear tabla de eventos locales en la base de datos
- [x] Implementar CRUD de eventos locales sin dependencia de Google
- [x] Modificar página de Calendario para usar eventos locales por defecto
- [x] Añadir botón de "Sincronizar con Google Calendar" opcional
- [x] Implementar sincronización bidireccional manual (importar eventos de Google)
- [ ] Permitir exportar eventos locales a Google Calendar
- [ ] Añadir indicador visual de eventos sincronizados vs locales
- [ ] Mantener compatibilidad con flujo actual para usuarios que ya usan Google

## Selector de Tipo de Evento
- [x] Añadir campo de tipo de evento en formulario de creación
- [x] Definir colores predefinidos para cada tipo (Personal, Profesional, Reunión, Recordatorio)
- [x] Mostrar tipo de evento visualmente en el calendario
- [x] Añadir campo de ubicación en formulario de eventos
- [x] Permitir filtrar eventos por tipo
  - [x] Añadir estado de filtros activos
  - [x] Crear UI con checkboxes en barra superior
  - [x] Aplicar filtros a eventos mostrados en calendario

## Vista de Lista de Eventos
- [x] Añadir toggle entre vista calendario y vista lista
- [x] Crear tabla compacta con columnas: fecha, título, tipo, ubicación, acciones
- [x] Aplicar filtros de tipo a vista de lista
- [x] Añadir acciones rápidas (editar/eliminar) en cada fila
- [x] Ordenar eventos por fecha (próximos primero)

## Búsqueda de Eventos
- [x] Añadir campo de búsqueda en barra de filtros
- [x] Implementar filtrado por título en tiempo real
- [x] Implementar filtrado por descripción en tiempo real
- [x] Aplicar búsqueda tanto en vista calendario como en vista lista

## Notificaciones Push de Recordatorios
- [x] Solicitar permisos de notificaciones al usuario
- [x] Crear hook useEventNotifications para gestionar notificaciones
- [x] Implementar verificación periódica de eventos próximos (cada minuto)
- [x] Enviar notificación 15 minutos antes de eventos tipo Reunión o Recordatorio
- [x] Mostrar título, hora y ubicación del evento en la notificación
- [x] Evitar notificaciones duplicadas para el mismo evento
- [x] Añadir banner informativo para activar notificaciones

## Configuración Personalizable de Notificaciones
- [x] Crear tabla notificationSettings en base de datos
- [x] Crear endpoints para guardar/obtener preferencias de notificaciones
- [x] Crear página de Configuración de Notificaciones en UI
- [x] Añadir selector de tiempo de antelación (5/10/15/30/60/120 minutos)
- [x] Añadir checkboxes para tipos de eventos a notificar (Personal/Profesional/Reunión/Recordatorio)
- [x] Añadir toggle para activar/desactivar notificaciones globalmente
- [x] Actualizar useEventNotifications para leer preferencias del usuario
- [x] Añadir enlace a configuración de notificaciones en página Settings
- [x] Integrar configuración con Calendar.tsx

## Eventos Recurrentes
- [x] Añadir campos de recurrencia a tabla calendarEvents (isRecurring, recurrencePattern, recurrenceEndDate, recurrenceParentId)
- [x] Crear lógica backend para generar instancias de eventos recurrentes (módulo recurrence.ts)
- [x] Añadir opciones de recurrencia en formulario de eventos (diaria/semanal/mensual/anual)
- [x] Añadir selector de fecha de finalización de recurrencia (opcional)
- [x] Implementar visualización de eventos recurrentes en calendario (expandRecurringEvent)
- [x] Añadir indicador visual para eventos recurrentes (emoji 🔁)
- [x] Actualizar getCalendarEvents para expandir eventos recurrentes automáticamente

## Exportación a iCalendar (.ics)
- [x] Crear función para generar formato iCalendar (.ics) (módulo client/src/lib/icalendar.ts)
- [x] Añadir botón "Exportar a .ics" en vista de lista del calendario
- [x] Implementar descarga de archivo .ics con eventos filtrados
- [x] Incluir eventos recurrentes en exportación (con RRULE)
- [x] Añadir metadatos del evento (título, descripción, ubicación, tipo)
- [x] Respetar filtros activos (tipo y búsqueda) al exportar
- [x] Generar nombre de archivo con fecha actual

## Vista de Agenda Semanal
- [x] Añadir opción de vista "Agenda Semanal" junto a Calendario y Lista
- [x] Crear componente WeeklyAgenda con timeline horizontal
- [x] Mostrar días de lunes a domingo con fechas
- [x] Renderizar eventos en cada día ordenados por hora
- [x] Implementar navegación anterior/siguiente semana
- [x] Añadir botón "Hoy" para volver a semana actual
- [x] Aplicar filtros de tipo y búsqueda a vista semanal
- [x] Mostrar indicador visual de día actual (fondo azul)
- [x] Hacer eventos clickeables para editar desde vista semanal
- [x] Mostrar hora, ubicación e indicador de recurrencia en cada evento

## Drag-and-Drop en Vista Semanal
- [x] Hacer eventos arrastrables con atributo draggable
- [x] Implementar handlers onDragStart, onDragOver, onDrop
- [x] Calcular nueva fecha al soltar evento en otro día
- [x] Actualizar evento en base de datos con nueva fecha
- [x] Añadir indicadores visuales durante el arrastre (cursor move, highlight verde)
- [x] Mantener hora original del evento al cambiar de día
- [x] Calcular duración del evento y aplicarla a nueva fecha
- [x] Limpiar estado de drag al finalizar (onDragEnd)

## Confirmación de Modificación de Eventos Recurrentes
- [x] Detectar cuando se arrastra un evento recurrente (verificar isRecurring y recurrencePattern)
- [x] Mostrar diálogo de confirmación antes de aplicar cambios
- [x] Añadir opción "Solo esta instancia" en el diálogo
- [x] Añadir opción "Toda la serie" en el diálogo
- [x] Implementar lógica para modificar solo instancia individual
- [x] Añadir botón Cancelar para cerrar diálogo sin cambios
- [x] Limpiar estados al confirmar o cancelar (pendingRecurrenceUpdate, draggedEvent)
