import { and, eq, gte, lte, sql } from "drizzle-orm";
import { calendarEvents } from "../drizzle/schema";
import { getDb } from "./db";

export async function getCalendarStats(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Obtener todos los eventos del usuario
  const events = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, userId));

  // Calcular distribución por tipo
  const typeDistribution = events.reduce((acc: Record<string, number>, event) => {
    const type = event.type || "personal";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Calcular eventos por mes (últimos 12 meses)
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  
  const eventsByMonth = events
    .filter((event) => new Date(event.startDate) >= twelveMonthsAgo)
    .reduce((acc: Record<string, number>, event) => {
      const date = new Date(event.startDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

  // Calcular horas por semana (últimas 8 semanas)
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  
  const hoursByWeek = events
    .filter((event) => new Date(event.startDate) >= eightWeeksAgo)
    .reduce((acc: Record<string, number>, event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // horas
      
      // Calcular número de semana
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - start.getDay() + 1); // Lunes
      const weekKey = weekStart.toISOString().split("T")[0];
      
      acc[weekKey] = (acc[weekKey] || 0) + duration;
      return acc;
    }, {});

  // Calcular métricas clave
  const totalEvents = events.length;
  const avgEventsPerDay = events.length > 0
    ? (events.length / Math.max(1, Math.ceil((now.getTime() - new Date(events[0].startDate).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(1)
    : "0";

  // Día más ocupado
  const eventsByDay = events.reduce((acc: Record<string, number>, event) => {
    const dayKey = new Date(event.startDate).toISOString().split("T")[0];
    acc[dayKey] = (acc[dayKey] || 0) + 1;
    return acc;
  }, {});

  const busiestDay = Object.entries(eventsByDay).reduce(
    (max, [day, count]) => (count > max.count ? { day, count } : max),
    { day: "", count: 0 }
  );

  return {
    typeDistribution,
    eventsByMonth,
    hoursByWeek,
    metrics: {
      totalEvents,
      avgEventsPerDay,
      busiestDay: busiestDay.day ? {
        date: busiestDay.day,
        count: busiestDay.count,
      } : null,
    },
  };
}
