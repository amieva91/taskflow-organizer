import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { notificationSettings, InsertNotificationSettings } from "../drizzle/schema";

export async function getNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get notification settings: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertNotificationSettings(settings: InsertNotificationSettings) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert notification settings: database not available");
    return null;
  }

  if (!settings.userId) {
    throw new Error("userId is required");
  }

  // Verificar si ya existe configuración para este usuario
  const existing = await getNotificationSettings(settings.userId);

  if (existing) {
    // Actualizar existente
    await db
      .update(notificationSettings)
      .set({
        enabled: settings.enabled ?? existing.enabled,
        notificationMinutes: settings.notificationMinutes ?? existing.notificationMinutes,
        notifyPersonal: settings.notifyPersonal ?? existing.notifyPersonal,
        notifyProfessional: settings.notifyProfessional ?? existing.notifyProfessional,
        notifyMeeting: settings.notifyMeeting ?? existing.notifyMeeting,
        notifyReminder: settings.notifyReminder ?? existing.notifyReminder,
        updatedAt: new Date(),
      })
      .where(eq(notificationSettings.userId, settings.userId));

    return await getNotificationSettings(settings.userId);
  } else {
    // Crear nuevo
    await db.insert(notificationSettings).values({
      userId: settings.userId,
      enabled: settings.enabled ?? true,
      notificationMinutes: settings.notificationMinutes ?? 15,
      notifyPersonal: settings.notifyPersonal ?? false,
      notifyProfessional: settings.notifyProfessional ?? false,
      notifyMeeting: settings.notifyMeeting ?? true,
      notifyReminder: settings.notifyReminder ?? true,
    });

    return await getNotificationSettings(settings.userId);
  }
}
