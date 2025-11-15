import { getDb } from "./db";
import { quickNotes, tasks } from "../drizzle/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

/**
 * Obtener notas rápidas de un día específico
 */
export async function getQuickNotesByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const notes = await db
    .select()
    .from(quickNotes)
    .where(
      and(
        eq(quickNotes.userId, userId),
        gte(quickNotes.date, startOfDay),
        lte(quickNotes.date, endOfDay)
      )
    )
    .orderBy(quickNotes.createdAt);

  return notes;
}

/**
 * Obtener todas las notas rápidas pendientes (no completadas)
 */
export async function getPendingQuickNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const notes = await db
    .select()
    .from(quickNotes)
    .where(
      and(
        eq(quickNotes.userId, userId),
        eq(quickNotes.isCompleted, 0),
        isNull(quickNotes.convertedToTaskId)
      )
    )
    .orderBy(quickNotes.date, quickNotes.createdAt);

  return notes;
}

/**
 * Crear una nota rápida
 */
export async function createQuickNote(userId: number, content: string, date?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const noteDate = date || new Date();
  
  await db.insert(quickNotes).values({
    userId,
    content,
    date: noteDate,
    isCompleted: 0,
  });

  return { success: true };
}

/**
 * Marcar nota como completada
 */
export async function toggleQuickNoteComplete(userId: number, noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Obtener estado actual
  const note = await db
    .select()
    .from(quickNotes)
    .where(and(eq(quickNotes.id, noteId), eq(quickNotes.userId, userId)))
    .limit(1);

  if (note.length === 0) {
    throw new Error("Note not found");
  }

  const newIsCompleted = note[0].isCompleted === 1 ? 0 : 1;
  const completedAt = newIsCompleted === 1 ? new Date() : null;

  await db
    .update(quickNotes)
    .set({ 
      isCompleted: newIsCompleted,
      completedAt: completedAt as any,
    })
    .where(and(eq(quickNotes.id, noteId), eq(quickNotes.userId, userId)));

  return { success: true, isCompleted: newIsCompleted === 1 };
}

/**
 * Eliminar una nota rápida
 */
export async function deleteQuickNote(userId: number, noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(quickNotes)
    .where(and(eq(quickNotes.id, noteId), eq(quickNotes.userId, userId)));

  return { success: true };
}

/**
 * Mover nota a otro día
 */
export async function moveQuickNoteToDate(userId: number, noteId: number, newDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(quickNotes)
    .set({ date: newDate })
    .where(and(eq(quickNotes.id, noteId), eq(quickNotes.userId, userId)));

  return { success: true };
}

/**
 * Convertir nota rápida en tarea programada
 */
export async function convertQuickNoteToTask(
  userId: number,
  noteId: number,
  taskData: {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    startDate?: Date;
    dueDate?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Crear la tarea
  await db.insert(tasks).values({
    userId,
    title: taskData.title,
    description: taskData.description || "",
    status: "todo",
    priority: taskData.priority || "medium",
    startDate: taskData.startDate,
    dueDate: taskData.dueDate,
  });

  const taskId = 0; // Placeholder - en producción usarías el ID real

  // Marcar la nota como convertida
  await db
    .update(quickNotes)
    .set({ 
      convertedToTaskId: taskId,
      isCompleted: 1,
      completedAt: new Date(),
    })
    .where(and(eq(quickNotes.id, noteId), eq(quickNotes.userId, userId)));

  return { success: true, taskId };
}

/**
 * Actualizar contenido de una nota
 */
export async function updateQuickNoteContent(userId: number, noteId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(quickNotes)
    .set({ content })
    .where(and(eq(quickNotes.id, noteId), eq(quickNotes.userId, userId)));

  return { success: true };
}
