/**
 * Parser de archivos iCalendar (.ics) para importar eventos
 * Soporta eventos simples y recurrentes con RRULE
 */

export interface ParsedEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay: boolean;
  isRecurring: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate?: Date;
  type?: "personal" | "professional" | "meeting" | "reminder";
}

/**
 * Parsea el contenido de un archivo .ics y extrae los eventos
 */
export function parseICS(icsContent: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  
  // Dividir por eventos (VEVENT)
  const eventBlocks = icsContent.split("BEGIN:VEVENT");
  
  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split("END:VEVENT")[0];
    
    try {
      const event = parseEvent(block);
      if (event) {
        events.push(event);
      }
    } catch (error) {
      console.warn("Error parsing event:", error);
      // Continuar con el siguiente evento
    }
  }
  
  return events;
}

/**
 * Parsea un bloque de evento individual
 */
function parseEvent(block: string): ParsedEvent | null {
  const lines = unfoldLines(block);
  
  let title = "";
  let description = "";
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let location = "";
  let allDay = false;
  let isRecurring = false;
  let recurrencePattern: "daily" | "weekly" | "monthly" | "yearly" | undefined;
  let recurrenceEndDate: Date | undefined;
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();
    
    // Extraer el nombre del campo sin parámetros
    const fieldName = key.split(";")[0];
    
    switch (fieldName) {
      case "SUMMARY":
        title = unescapeText(value);
        break;
        
      case "DESCRIPTION":
        description = unescapeText(value);
        break;
        
      case "DTSTART":
        const startResult = parseDateTime(key, value);
        startDate = startResult.date;
        allDay = startResult.allDay;
        break;
        
      case "DTEND":
        const endResult = parseDateTime(key, value);
        endDate = endResult.date;
        break;
        
      case "LOCATION":
        location = unescapeText(value);
        break;
        
      case "RRULE":
        const rruleResult = parseRRule(value);
        if (rruleResult) {
          isRecurring = true;
          recurrencePattern = rruleResult.pattern;
          recurrenceEndDate = rruleResult.until;
        }
        break;
    }
  }
  
  // Validar campos obligatorios
  if (!title || !startDate) {
    return null;
  }
  
  // Si no hay fecha de fin, usar la fecha de inicio
  if (!endDate) {
    endDate = new Date(startDate.getTime() + (allDay ? 86400000 : 3600000)); // +1 día o +1 hora
  }
  
  // Inferir tipo de evento basado en palabras clave
  const type = inferEventType(title, description, location);
  
  return {
    title,
    description,
    startDate,
    endDate,
    location,
    allDay,
    isRecurring,
    recurrencePattern,
    recurrenceEndDate,
    type,
  };
}

/**
 * Desdobla líneas que están divididas (RFC 5545)
 */
function unfoldLines(text: string): string[] {
  const lines: string[] = [];
  const rawLines = text.split(/\r?\n/);
  
  let currentLine = "";
  for (const line of rawLines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      // Línea continuación
      currentLine += line.substring(1);
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = line;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.filter(l => l.trim());
}

/**
 * Parsea fecha/hora de iCalendar
 */
function parseDateTime(key: string, value: string): { date: Date; allDay: boolean } {
  // Verificar si es VALUE=DATE (todo el día)
  const isDateOnly = key.includes("VALUE=DATE");
  
  // Formato: YYYYMMDD o YYYYMMDDTHHMMSS o YYYYMMDDTHHMMSSZ
  const dateStr = value.replace(/[^0-9]/g, "");
  
  if (dateStr.length >= 8) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    
    if (isDateOnly || dateStr.length === 8) {
      // Evento de todo el día
      return {
        date: new Date(year, month, day),
        allDay: true,
      };
    } else {
      // Evento con hora
      const hour = parseInt(dateStr.substring(8, 10) || "0");
      const minute = parseInt(dateStr.substring(10, 12) || "0");
      const second = parseInt(dateStr.substring(12, 14) || "0");
      
      // Si termina en Z, es UTC
      if (value.endsWith("Z")) {
        return {
          date: new Date(Date.UTC(year, month, day, hour, minute, second)),
          allDay: false,
        };
      } else {
        return {
          date: new Date(year, month, day, hour, minute, second),
          allDay: false,
        };
      }
    }
  }
  
  // Fallback: fecha actual
  return { date: new Date(), allDay: false };
}

/**
 * Parsea regla de recurrencia (RRULE)
 */
function parseRRule(rrule: string): { pattern: "daily" | "weekly" | "monthly" | "yearly"; until?: Date } | null {
  const parts = rrule.split(";");
  let freq: string | undefined;
  let until: Date | undefined;
  
  for (const part of parts) {
    const [key, value] = part.split("=");
    
    if (key === "FREQ") {
      freq = value;
    } else if (key === "UNTIL") {
      const untilResult = parseDateTime("", value);
      until = untilResult.date;
    }
  }
  
  if (!freq) return null;
  
  const patternMap: Record<string, "daily" | "weekly" | "monthly" | "yearly"> = {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
  };
  
  const pattern = patternMap[freq];
  if (!pattern) return null;
  
  return { pattern, until };
}

/**
 * Decodifica texto escapado de iCalendar
 */
function unescapeText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * Infiere el tipo de evento basado en palabras clave
 */
function inferEventType(
  title: string,
  description: string,
  location: string
): "personal" | "professional" | "meeting" | "reminder" {
  const text = `${title} ${description} ${location}`.toLowerCase();
  
  // Palabras clave para reuniones
  if (
    text.includes("reunión") ||
    text.includes("reunion") ||
    text.includes("meeting") ||
    text.includes("call") ||
    text.includes("llamada") ||
    text.includes("zoom") ||
    text.includes("teams")
  ) {
    return "meeting";
  }
  
  // Palabras clave para recordatorios
  if (
    text.includes("recordatorio") ||
    text.includes("reminder") ||
    text.includes("recordar") ||
    text.includes("no olvidar")
  ) {
    return "reminder";
  }
  
  // Palabras clave para trabajo/profesional
  if (
    text.includes("trabajo") ||
    text.includes("work") ||
    text.includes("proyecto") ||
    text.includes("project") ||
    text.includes("cliente") ||
    text.includes("client") ||
    text.includes("oficina") ||
    text.includes("office")
  ) {
    return "professional";
  }
  
  // Por defecto: personal
  return "personal";
}

/**
 * Lee un archivo .ics y retorna su contenido como texto
 */
export async function readICSFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };
    
    reader.readAsText(file);
  });
}
