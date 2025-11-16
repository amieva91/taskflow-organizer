import { getDb } from "./db";
import { calendarEvents } from "../drizzle/schema";
import { eq, and, gte, lte, isNull, or } from "drizzle-orm";
import { expandRecurringEvent } from "./recurrence";

/**
 * Obtener eventos del calendario local de un usuario en un rango de fechas
 * Expande eventos recurrentes en múltiples instancias
 */
export async function getCalendarEvents(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Obtener eventos que:
    // 1. Estén en el rango de fechas (eventos normales)
    // 2. Sean recurrentes y su fecha de inicio sea antes del fin del rango
    const events = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          // Solo eventos padre (no instancias generadas)
          isNull(calendarEvents.recurrenceParentId),
          or(
            // Eventos normales en el rango
            and(
              gte(calendarEvents.startDate, startDate),
              lte(calendarEvents.endDate, endDate)
            ),
            // Eventos recurrentes que podrían tener instancias en el rango
            and(
              eq(calendarEvents.isRecurring, true),
              lte(calendarEvents.startDate, endDate),
              or(
                isNull(calendarEvents.recurrenceEndDate),
                gte(calendarEvents.recurrenceEndDate, startDate)
              )
            )
          )
        )
      )
      .orderBy(calendarEvents.startDate);

    // Expandir eventos recurrentes
    const expandedEvents = events.flatMap(event => 
      expandRecurringEvent(event, startDate, endDate)
    );

    return expandedEvents;
  } catch (error) {
    console.error('[getCalendarEvents] Error:', error);
    return [];
  }
}

/**
 * Obtener todos los eventos de un usuario (sin filtro de fecha)
 */
export async function getAllCalendarEvents(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const events = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId))
    .orderBy(calendarEvents.startDate);

  return events;
}

/**
 * Obtener un evento por ID
 */
export async function getCalendarEventById(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return null;

  const events = await db
    .select()
    .from(calendarEvents)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)))
    .limit(1);

  return events.length > 0 ? events[0] : null;
}

/**
 * Crear un nuevo evento en el calendario local
 */
export async function createCalendarEvent(
  userId: number,
  eventData: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    location?: string;
    color?: string;
    type?: "personal" | "professional" | "meeting" | "reminder";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(calendarEvents).values({
    userId,
    title: eventData.title,
    description: eventData.description || "",
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    allDay: eventData.allDay || false,
    location: eventData.location,
    color: eventData.color,
    type: eventData.type || "personal",
    isSynced: false,
  });

  return { success: true };
}

/**
 * Actualizar un evento del calendario local
 */
export async function updateCalendarEvent(
  userId: number,
  eventId: number,
  eventData: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    allDay?: boolean;
    location?: string;
    color?: string;
    type?: "personal" | "professional" | "meeting" | "reminder";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(calendarEvents)
    .set(eventData)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)));

  return { success: true };
}

/**
 * Eliminar un evento del calendario local
 */
export async function deleteCalendarEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)));

  return { success: true };
}

/**
 * Marcar un evento como sincronizado con Google Calendar
 */
export async function markEventAsSynced(
  userId: number,
  eventId: number,
  googleEventId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(calendarEvents)
    .set({
      googleEventId,
      isSynced: true,
      lastSyncedAt: new Date(),
    })
    .where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, userId)));

  return { success: true };
}

/**
 * Obtener eventos no sincronizados con Google Calendar
 */
export async function getUnsyncedEvents(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const events = await db
    .select()
    .from(calendarEvents)
    .where(and(eq(calendarEvents.userId, userId), eq(calendarEvents.isSynced, false)))
    .orderBy(calendarEvents.startDate);

  return events;
}

/**
 * Sincronizar eventos de Google Calendar a la base de datos local
 * Importa eventos de Google y los guarda como eventos locales marcados como sincronizados
 */
export async function syncFromGoogleCalendar(
  userId: number,
  googleEvents: Array<any> // Schema$Event from Google Calendar API
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let syncedCount = 0;
  let skippedCount = 0;

  for (const gEvent of googleEvents) {
    try {
      // Validar que el evento tenga ID
      if (!gEvent.id) {
        skippedCount++;
        continue;
      }

      // Verificar si ya existe un evento con este googleEventId
      const existing = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            eq(calendarEvents.googleEventId, gEvent.id)
          )
        )
        .limit(1);

      const startDate = gEvent.start?.dateTime || gEvent.start?.date;
      const endDate = gEvent.end?.dateTime || gEvent.end?.date;

      if (!startDate || !endDate) {
        skippedCount++;
        continue;
      }

      const eventData = {
        userId,
        title: gEvent.summary || "Sin título",
        description: gEvent.description || "",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: !gEvent.start?.dateTime,
        location: gEvent.location,
        color: "#8b5cf6", // Color morado para eventos de Google
        type: "professional" as const,
        googleEventId: gEvent.id,
        isSynced: true,
        lastSyncedAt: new Date(),
      };

      if (existing.length > 0) {
        // Actualizar evento existente
        await db
          .update(calendarEvents)
          .set({
            ...eventData,
            updatedAt: new Date(),
          })
          .where(eq(calendarEvents.id, existing[0].id));
      } else {
        // Crear nuevo evento
        await db.insert(calendarEvents).values(eventData);
      }

      syncedCount++;
    } catch (error) {
      console.error(`Error syncing event ${gEvent.id}:`, error);
      skippedCount++;
    }
  }

  return {
    success: true,
    syncedCount,
    skippedCount,
    totalProcessed: googleEvents.length,
  };
}
