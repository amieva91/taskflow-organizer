import { getDb } from "./db";
import { contacts, tasks, taskAssignments } from "../drizzle/schema";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

/**
 * Calcular horas asignadas a un contacto en un rango de fechas
 */
export async function getContactWorkload(userId: number, contactId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalHours: 0, tasks: [] };

  // Obtener todas las asignaciones del contacto
  const assignments = await db
    .select({
      taskId: taskAssignments.taskId,
      hoursAllocated: taskAssignments.hoursAllocated,
      task: tasks,
    })
    .from(taskAssignments)
    .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
    .where(
      and(
        eq(taskAssignments.contactId, contactId),
        eq(tasks.userId, userId),
        isNotNull(tasks.startDate),
        isNotNull(tasks.dueDate)
      )
    );

  // Filtrar tareas que están en el rango de fechas
  const tasksInRange = assignments.filter(assignment => {
    if (!assignment.task.startDate || !assignment.task.dueDate) return false;
    
    const taskStart = new Date(assignment.task.startDate);
    const taskEnd = new Date(assignment.task.dueDate);
    
    // La tarea se superpone con el rango si:
    // - empieza antes del fin del rango Y
    // - termina después del inicio del rango
    return taskStart <= endDate && taskEnd >= startDate;
  });

  // Calcular horas totales
  const totalHours = tasksInRange.reduce((sum, assignment) => {
    return sum + (assignment.hoursAllocated || 0);
  }, 0);

  return {
    totalHours,
    tasks: tasksInRange.map(a => ({
      id: a.task.id,
      title: a.task.title,
      startDate: a.task.startDate,
      dueDate: a.task.dueDate,
      hoursAllocated: a.hoursAllocated || 0,
      status: a.task.status,
      priority: a.task.priority,
    })),
  };
}

/**
 * Obtener carga de trabajo de todos los contactos
 */
export async function getAllContactsWorkload(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // Obtener todos los contactos del usuario
  const allContacts = await db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId));

  // Calcular carga de trabajo para cada contacto
  const workloads = await Promise.all(
    allContacts.map(async (contact) => {
      const workload = await getContactWorkload(userId, contact.id, startDate, endDate);
      
      // Calcular disponibilidad (asumimos 40h semanales por defecto)
      const weeksDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const availableHours = weeksDiff * 40;
      const utilizationRate = availableHours > 0 ? (workload.totalHours / availableHours) * 100 : 0;
      const isOverloaded = utilizationRate > 100;

      return {
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          isFictional: contact.isFictional,
          departmentId: contact.departmentId,
        },
        totalHours: workload.totalHours,
        availableHours,
        utilizationRate: Math.round(utilizationRate),
        isOverloaded,
        tasks: workload.tasks,
      };
    })
  );

  // Ordenar por tasa de utilización descendente
  return workloads.sort((a, b) => b.utilizationRate - a.utilizationRate);
}

/**
 * Obtener disponibilidad diaria de un contacto
 */
export async function getContactDailyAvailability(userId: number, contactId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const workload = await getContactWorkload(userId, contactId, startDate, endDate);
  
  // Crear mapa de días con horas asignadas
  const dailyHours: { [key: string]: number } = {};
  
  workload.tasks.forEach(task => {
    if (!task.startDate || !task.dueDate) return;
    
    const start = new Date(task.startDate);
    const end = new Date(task.dueDate);
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const hoursPerDay = task.hoursAllocated / durationDays;
    
    // Distribuir horas entre los días de la tarea
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyHours[dateKey] = (dailyHours[dateKey] || 0) + hoursPerDay;
    }
  });

  // Generar array de disponibilidad diaria
  const availability = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const hoursAssigned = dailyHours[dateKey] || 0;
    const hoursAvailable = 8; // 8 horas laborales por día
    
    availability.push({
      date: dateKey,
      hoursAssigned: Math.round(hoursAssigned * 10) / 10,
      hoursAvailable,
      utilizationRate: Math.round((hoursAssigned / hoursAvailable) * 100),
      isOverloaded: hoursAssigned > hoursAvailable,
    });
  }

  return availability;
}
