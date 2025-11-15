/**
 * Módulo para generar archivos iCalendar (.ics)
 * Compatible con RFC 5545 (iCalendar)
 */

interface ICalEvent {
  id: number;
  title: string;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  allDay: boolean;
  location?: string | null;
  type?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: Date | string | null;
}

/**
 * Formatea una fecha para iCalendar (formato: YYYYMMDDTHHmmssZ)
 */
function formatICalDate(date: Date | string, allDay: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (allDay) {
    // Formato de fecha completa (sin hora): YYYYMMDD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  } else {
    // Formato de fecha y hora UTC: YYYYMMDDTHHmmssZ
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }
}

/**
 * Escapa caracteres especiales en texto iCalendar
 */
function escapeICalText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Convierte patrón de recurrencia a formato RRULE
 */
function generateRRule(
  pattern: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
  endDate?: Date | string | null
): string | null {
  if (pattern === 'none') return null;

  const freqMap = {
    daily: 'DAILY',
    weekly: 'WEEKLY',
    monthly: 'MONTHLY',
    yearly: 'YEARLY',
  };

  let rrule = `FREQ=${freqMap[pattern]}`;

  if (endDate) {
    const until = formatICalDate(endDate, false);
    rrule += `;UNTIL=${until}`;
  }

  return rrule;
}

/**
 * Genera un archivo iCalendar (.ics) a partir de una lista de eventos
 */
export function generateICalendar(events: ICalEvent[]): string {
  const now = new Date();
  const timestamp = formatICalDate(now);

  // Encabezado del archivo iCalendar
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskFlow Organizer//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:TaskFlow Eventos',
    'X-WR-TIMEZONE:UTC',
  ].join('\r\n');

  // Añadir cada evento
  events.forEach((event) => {
    const uid = `${event.id}@taskflow-organizer`;
    const dtstart = formatICalDate(event.startDate, event.allDay);
    const dtend = formatICalDate(event.endDate, event.allDay);
    const summary = escapeICalText(event.title);
    const description = escapeICalText(event.description);
    const location = escapeICalText(event.location);

    ical += '\r\n';
    ical += 'BEGIN:VEVENT\r\n';
    ical += `UID:${uid}\r\n`;
    ical += `DTSTAMP:${timestamp}\r\n`;
    
    if (event.allDay) {
      ical += `DTSTART;VALUE=DATE:${dtstart}\r\n`;
      ical += `DTEND;VALUE=DATE:${dtend}\r\n`;
    } else {
      ical += `DTSTART:${dtstart}\r\n`;
      ical += `DTEND:${dtend}\r\n`;
    }
    
    ical += `SUMMARY:${summary}\r\n`;
    
    if (description) {
      ical += `DESCRIPTION:${description}\r\n`;
    }
    
    if (location) {
      ical += `LOCATION:${location}\r\n`;
    }

    // Añadir categoría basada en tipo
    if (event.type) {
      const categoryMap: Record<string, string> = {
        personal: 'Personal',
        professional: 'Profesional',
        meeting: 'Reunión',
        reminder: 'Recordatorio',
      };
      const category = categoryMap[event.type] || event.type;
      ical += `CATEGORIES:${category}\r\n`;
    }

    // Añadir regla de recurrencia si aplica
    if (event.isRecurring && event.recurrencePattern && event.recurrencePattern !== 'none') {
      const rrule = generateRRule(event.recurrencePattern, event.recurrenceEndDate);
      if (rrule) {
        ical += `RRULE:${rrule}\r\n`;
      }
    }

    ical += 'END:VEVENT\r\n';
  });

  // Pie del archivo
  ical += 'END:VCALENDAR\r\n';

  return ical;
}

/**
 * Descarga un archivo iCalendar (.ics)
 */
export function downloadICalendar(events: ICalEvent[], filename: string = 'eventos.ics') {
  const icalContent = generateICalendar(events);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Liberar el objeto URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
