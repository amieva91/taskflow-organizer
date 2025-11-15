import { getDb } from "./db";
import { reminderSettings, sentReminders, tasks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Obtener configuración de recordatorios del usuario
 */
export async function getReminderSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const settings = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
    .limit(1);

  return settings[0] || null;
}

/**
 * Crear o actualizar configuración de recordatorios
 */
export async function upsertReminderSettings(userId: number, settings: {
  enabled?: boolean;
  defaultMinutesBefore?: number;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getReminderSettings(userId);

  if (existing) {
    await db
      .update(reminderSettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(reminderSettings.userId, userId));
  } else {
    await db.insert(reminderSettings).values({
      userId,
      enabled: settings.enabled ?? true,
      defaultMinutesBefore: settings.defaultMinutesBefore ?? 30,
      emailEnabled: settings.emailEnabled ?? true,
      pushEnabled: settings.pushEnabled ?? true,
    });
  }

  return getReminderSettings(userId);
}

/**
 * Verificar si ya se envió un recordatorio
 */
async function wasReminderSent(userId: number, taskId: number, type: "push" | "email") {
  const db = await getDb();
  if (!db) return false;

  const existing = await db
    .select()
    .from(sentReminders)
    .where(
      and(
        eq(sentReminders.userId, userId),
        eq(sentReminders.taskId, taskId),
        eq(sentReminders.type, type)
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Marcar recordatorio como enviado
 */
async function markReminderSent(userId: number, taskId: number, type: "push" | "email") {
  const db = await getDb();
  if (!db) return;

  await db.insert(sentReminders).values({
    userId,
    taskId,
    type,
    sentAt: new Date(),
  });
}

/**
 * Obtener tareas que necesitan recordatorio
 */
export async function getTasksNeedingReminder(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const settings = await getReminderSettings(userId);
  if (!settings || !settings.enabled) return [];

  const now = new Date();
  const reminderWindow = new Date(now.getTime() + settings.defaultMinutesBefore * 60 * 1000);

  // Buscar tareas con fecha de inicio o vencimiento próxima
  const upcomingTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.status, "todo") // Solo tareas pendientes
      )
    );

  // Filtrar tareas que están dentro de la ventana de recordatorio
  const tasksToRemind = upcomingTasks.filter(task => {
    const targetDate = task.startDate || task.dueDate;
    if (!targetDate) return false;

    const taskTime = new Date(targetDate).getTime();
    const nowTime = now.getTime();
    const windowTime = reminderWindow.getTime();

    // La tarea debe estar entre ahora y la ventana de recordatorio
    return taskTime > nowTime && taskTime <= windowTime;
  });

  return tasksToRemind;
}

/**
 * Enviar recordatorios pendientes
 */
export async function sendPendingReminders(userId: number) {
  const settings = await getReminderSettings(userId);
  if (!settings || !settings.enabled) return { sent: 0, errors: 0 };

  const tasksToRemind = await getTasksNeedingReminder(userId);
  let sent = 0;
  let errors = 0;

  for (const task of tasksToRemind) {
    try {
      // Enviar email si está habilitado
      if (settings.emailEnabled) {
        const alreadySent = await wasReminderSent(userId, task.id, "email");
        if (!alreadySent) {
          // Aquí se enviaría el email de recordatorio
          // Por ahora solo marcamos como enviado
          await markReminderSent(userId, task.id, "email");
          sent++;
        }
      }

      // Enviar push si está habilitado
      if (settings.pushEnabled) {
        const alreadySent = await wasReminderSent(userId, task.id, "push");
        if (!alreadySent) {
          // Aquí se enviaría la notificación push
          // Por ahora solo marcamos como enviado
          await markReminderSent(userId, task.id, "push");
          sent++;
        }
      }
    } catch (error) {
      console.error(`Error sending reminder for task ${task.id}:`, error);
      errors++;
    }
  }

  return { sent, errors };
}
