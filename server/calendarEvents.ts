import { getDb } from "./db";
import { calendarEvents } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Obtener eventos del calendario local de un usuario en un rango de fechas
 */
export async function getCalendarEvents(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const events = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.startDate, startDate),
        lte(calendarEvents.endDate, endDate)
      )
    )
    .orderBy(calendarEvents.startDate);

  return events;
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
