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
