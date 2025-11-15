/**
 * Módulo para gestionar la lógica de eventos recurrentes
 * Genera instancias de eventos basadas en patrones de recurrencia
 */

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringEventConfig {
  startDate: Date;
  endDate: Date;
  recurrencePattern: RecurrencePattern;
  recurrenceEndDate?: Date | null;
}

/**
 * Genera las fechas de las instancias de un evento recurrente dentro de un rango
 * @param config Configuración del evento recurrente
 * @param rangeStart Inicio del rango de fechas a generar
 * @param rangeEnd Fin del rango de fechas a generar
 * @returns Array de fechas de inicio para cada instancia
 */
export function generateRecurringInstances(
  config: RecurringEventConfig,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const instances: Date[] = [];
  
  if (config.recurrencePattern === 'none') {
    // Si no es recurrente, solo devolver la fecha original si está en el rango
    if (config.startDate >= rangeStart && config.startDate <= rangeEnd) {
      instances.push(config.startDate);
    }
    return instances;
  }

  // Determinar la fecha de fin de la recurrencia
  const recurrenceEnd = config.recurrenceEndDate 
    ? new Date(Math.min(config.recurrenceEndDate.getTime(), rangeEnd.getTime()))
    : rangeEnd;

  let currentDate = new Date(config.startDate);
  const eventDuration = config.endDate.getTime() - config.startDate.getTime();

  // Generar instancias según el patrón
  while (currentDate <= recurrenceEnd) {
    // Solo añadir si está dentro del rango solicitado
    if (currentDate >= rangeStart && currentDate <= rangeEnd) {
      instances.push(new Date(currentDate));
    }

    // Avanzar a la siguiente instancia según el patrón
    currentDate = getNextOccurrence(currentDate, config.recurrencePattern);

    // Protección contra bucles infinitos
    if (instances.length > 1000) {
      console.warn('[Recurrence] Generated more than 1000 instances, stopping');
      break;
    }
  }

  return instances;
}

/**
 * Calcula la siguiente ocurrencia de un evento recurrente
 */
function getNextOccurrence(currentDate: Date, pattern: RecurrencePattern): Date {
  const next = new Date(currentDate);

  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;

    case 'monthly':
      // Avanzar un mes manteniendo el día del mes
      const originalDay = next.getDate();
      next.setMonth(next.getMonth() + 1);
      
      // Si el día no existe en el nuevo mes (ej: 31 de febrero), usar el último día del mes
      if (next.getDate() !== originalDay) {
        next.setDate(0); // Último día del mes anterior
      }
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;

    default:
      // No debería llegar aquí, pero por seguridad avanzar un día
      next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Expande un evento recurrente en múltiples instancias para el calendario
 */
export function expandRecurringEvent(
  event: {
    id: number;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    location: string | null;
    color: string | null;
    type: 'personal' | 'professional' | 'meeting' | 'reminder';
    isRecurring: boolean;
    recurrencePattern: RecurrencePattern;
    recurrenceEndDate: Date | null;
  },
  rangeStart: Date,
  rangeEnd: Date
) {
  if (!event.isRecurring || event.recurrencePattern === 'none') {
    return [event];
  }

  const instances = generateRecurringInstances(
    {
      startDate: event.startDate,
      endDate: event.endDate,
      recurrencePattern: event.recurrencePattern,
      recurrenceEndDate: event.recurrenceEndDate,
    },
    rangeStart,
    rangeEnd
  );

  const eventDuration = event.endDate.getTime() - event.startDate.getTime();

  return instances.map((instanceStart) => ({
    ...event,
    startDate: instanceStart,
    endDate: new Date(instanceStart.getTime() + eventDuration),
    // Marcar como instancia de evento recurrente
    recurrenceParentId: event.id,
  }));
}
