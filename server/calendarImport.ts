import { getDb } from "./db";
import { calendarEvents } from "../drizzle/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export interface ImportEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay: boolean;
  type?: "personal" | "professional" | "meeting" | "reminder";
  isRecurring?: boolean;
  recurrencePattern?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  recurrenceEndDate?: Date;
}

export interface DuplicateCheck {
  isDuplicate: boolean;
  existingEventId?: number;
  conflictReason?: string;
}

export interface ImportResult {
  success: boolean;
  eventId?: number;
  error?: string;
  skipped?: boolean;
}

/**
 * Detecta si un evento es duplicado comparando título, fecha y hora
 */
export async function checkDuplicate(
  userId: number,
  event: ImportEvent
): Promise<DuplicateCheck> {
  const db = await getDb();
  if (!db) {
    return { isDuplicate: false };
  }

  try {
    // Buscar eventos con el mismo título en un rango de ±1 hora
    const startWindow = new Date(event.startDate.getTime() - 3600000); // -1 hora
    const endWindow = new Date(event.startDate.getTime() + 3600000); // +1 hora

    const existing = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.title, event.title),
          gte(calendarEvents.startDate, startWindow),
          lte(calendarEvents.startDate, endWindow)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        isDuplicate: true,
        existingEventId: existing[0].id,
        conflictReason: `Evento similar encontrado: "${existing[0].title}" el ${existing[0].startDate.toLocaleString("es-ES")}`,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("[checkDuplicate] Error:", error);
    return { isDuplicate: false };
  }
}

/**
 * Importa un evento con estrategia de conflicto
 */
export async function importEvent(
  userId: number,
  event: ImportEvent,
  conflictStrategy: "skip" | "overwrite" | "create_new" = "skip"
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Base de datos no disponible" };
  }

  try {
    // Verificar duplicados
    const duplicateCheck = await checkDuplicate(userId, event);

    if (duplicateCheck.isDuplicate) {
      if (conflictStrategy === "skip") {
        return {
          success: true,
          skipped: true,
        };
      } else if (conflictStrategy === "overwrite" && duplicateCheck.existingEventId) {
        // Actualizar evento existente
        await db
          .update(calendarEvents)
          .set({
            description: event.description || null,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location || null,
            allDay: event.allDay,
            type: event.type || "personal",
            isRecurring: event.isRecurring || false,
            recurrencePattern: event.recurrencePattern || "none",
            recurrenceEndDate: event.recurrenceEndDate || null,
          })
          .where(eq(calendarEvents.id, duplicateCheck.existingEventId));

        return {
          success: true,
          eventId: duplicateCheck.existingEventId,
        };
      }
      // Si es "create_new", continuar con la creación
    }

    // Crear nuevo evento
    await db.insert(calendarEvents).values({
      userId,
      title: event.title,
      description: event.description || null,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || null,
      allDay: event.allDay,
      type: event.type || "personal",
      isRecurring: event.isRecurring || false,
      recurrencePattern: event.recurrencePattern || "none",
      recurrenceEndDate: event.recurrenceEndDate || null,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("[importEvent] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Importa múltiples eventos en lote
 */
export async function importEventsBatch(
  userId: number,
  events: Array<ImportEvent & { conflictStrategy?: "skip" | "overwrite" | "create_new" }>
): Promise<{
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  results: ImportResult[];
}> {
  const results: ImportResult[] = [];
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    const result = await importEvent(userId, event, event.conflictStrategy || "skip");
    results.push(result);

    if (result.success) {
      if (result.skipped) {
        skipped++;
      } else {
        imported++;
      }
    } else {
      errors++;
    }
  }

  return {
    total: events.length,
    imported,
    skipped,
    errors,
    results,
  };
}
