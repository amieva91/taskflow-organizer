import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as googleCalendar from "./googleCalendar";
import { addDays, addHours, format, startOfDay, endOfDay, isWeekend, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";

interface TimeSlot {
  start: Date;
  end: Date;
  score: number;
  reason: string;
}

interface TaskContext {
  title: string;
  description?: string;
  priority: string;
  estimatedHours?: number;
  assignedContactIds?: number[];
  type: string;
}

/**
 * Analiza el calendario y las tareas existentes para encontrar huecos disponibles
 */
async function findAvailableSlots(
  userId: number,
  startDate: Date,
  endDate: Date,
  durationHours: number
): Promise<TimeSlot[]> {
  const user = await db.getUserById(userId);
  const availableSlots: TimeSlot[] = [];

  // Obtener eventos del calendario de Google si está conectado
  let calendarEvents: any[] = [];
  if (user?.googleAccessToken && user?.googleRefreshToken) {
    try {
      calendarEvents = await googleCalendar.listCalendarEvents(
        user.googleAccessToken,
        user.googleRefreshToken,
        startDate,
        endDate
      );
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    }
  }

  // Obtener tareas existentes en el rango
  const tasks = await db.getTasksByDateRange(userId, startDate, endDate);

  // Generar slots candidatos (horario laboral: 9am - 6pm, lunes a viernes)
  let currentDate = startOfDay(startDate);
  const endDateTime = endOfDay(endDate);

  while (currentDate < endDateTime) {
    // Saltar fines de semana
    if (isWeekend(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Generar slots de 9am a 6pm
    for (let hour = 9; hour <= 18 - durationHours; hour++) {
      const slotStart = setMinutes(setHours(currentDate, hour), 0);
      const slotEnd = addHours(slotStart, durationHours);

      // Verificar si el slot está libre
      const isFree = !hasConflict(slotStart, slotEnd, calendarEvents, tasks);

      if (isFree) {
        availableSlots.push({
          start: slotStart,
          end: slotEnd,
          score: 0, // Se calculará después
          reason: "",
        });
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return availableSlots;
}

/**
 * Verifica si hay conflicto con eventos o tareas existentes
 */
function hasConflict(
  slotStart: Date,
  slotEnd: Date,
  calendarEvents: any[],
  tasks: any[]
): boolean {
  // Verificar conflictos con eventos del calendario
  for (const event of calendarEvents) {
    const eventStart = new Date(event.start.dateTime || event.start.date);
    const eventEnd = new Date(event.end.dateTime || event.end.date);

    if (
      (slotStart >= eventStart && slotStart < eventEnd) ||
      (slotEnd > eventStart && slotEnd <= eventEnd) ||
      (slotStart <= eventStart && slotEnd >= eventEnd)
    ) {
      return true;
    }
  }

  // Verificar conflictos con tareas
  for (const task of tasks) {
    if (!task.startDate || !task.dueDate) continue;

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);

    if (
      (slotStart >= taskStart && slotStart < taskEnd) ||
      (slotEnd > taskStart && slotEnd <= taskEnd) ||
      (slotStart <= taskStart && slotEnd >= taskEnd)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calcula la carga de trabajo de los contactos asignados
 */
async function calculateContactWorkload(
  contactIds: number[],
  startDate: Date,
  endDate: Date
): Promise<Map<number, number>> {
  const workloadMap = new Map<number, number>();

  for (const contactId of contactIds) {
    const assignments = await db.getAssignmentsByContactId(contactId);
    let totalHours = 0;

    for (const assignment of assignments) {
      const task = await db.getTaskById(assignment.taskId);
      if (!task || !task.startDate || !task.dueDate) continue;

      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate);

      // Si la tarea se solapa con el rango de fechas
      if (taskStart <= endDate && taskEnd >= startDate) {
        totalHours += task.estimatedHours || 2; // Default 2 horas si no está especificado
      }
    }

    workloadMap.set(contactId, totalHours);
  }

  return workloadMap;
}

/**
 * Genera sugerencias inteligentes usando Gemini AI
 */
export async function generateTimeSlotSuggestions(
  userId: number,
  taskContext: TaskContext
): Promise<Array<TimeSlot & { justification: string }>> {
  const durationHours = taskContext.estimatedHours || 2;
  const startDate = new Date();
  const endDate = addDays(startDate, 14); // Buscar en las próximas 2 semanas

  // Encontrar slots disponibles
  const availableSlots = await findAvailableSlots(
    userId,
    startDate,
    endDate,
    durationHours
  );

  if (availableSlots.length === 0) {
    return [];
  }

  // Calcular carga de trabajo de contactos si hay asignados
  let contactWorkload = new Map<number, number>();
  let contactNames: string[] = [];
  
  if (taskContext.assignedContactIds && taskContext.assignedContactIds.length > 0) {
    contactWorkload = await calculateContactWorkload(
      taskContext.assignedContactIds,
      startDate,
      endDate
    );

    // Obtener nombres de contactos
    for (const contactId of taskContext.assignedContactIds) {
      const contact = await db.getContactById(contactId);
      if (contact) {
        contactNames.push(contact.name);
      }
    }
  }

  // Obtener estadísticas del usuario
  const allTasks = await db.getTasksByUserId(userId);
  const completedTasks = allTasks.filter(t => t.status === "completed");
  const urgentTasks = allTasks.filter(t => t.priority === "urgent" && t.status !== "completed");

  // Preparar contexto para la IA
  const contextForAI = {
    taskTitle: taskContext.title,
    taskDescription: taskContext.description || "Sin descripción",
    taskPriority: taskContext.priority,
    taskType: taskContext.type,
    durationHours,
    assignedContacts: contactNames.length > 0 ? contactNames.join(", ") : "Ninguno",
    availableSlotsCount: availableSlots.length,
    userStats: {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      urgentPendingTasks: urgentTasks.length,
    },
    contactWorkload: Array.from(contactWorkload.entries()).map(([id, hours]) => ({
      contactId: id,
      hoursScheduled: hours,
    })),
  };

  // Seleccionar los mejores 10 slots para analizar
  const topSlots = availableSlots.slice(0, Math.min(10, availableSlots.length));

  const slotsFormatted = topSlots.map((slot, index) => ({
    id: index,
    start: format(slot.start, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es }),
    end: format(slot.end, "HH:mm", { locale: es }),
    dayOfWeek: format(slot.start, "EEEE", { locale: es }),
    timeOfDay: slot.start.getHours() < 12 ? "mañana" : slot.start.getHours() < 17 ? "tarde" : "noche",
  }));

  // Llamar a Gemini AI para analizar y rankear los slots
  const prompt = `Eres un asistente de productividad experto. Analiza los siguientes slots de tiempo disponibles y recomienda los 3 mejores para programar una tarea.

**Contexto de la tarea:**
- Título: ${contextForAI.taskTitle}
- Descripción: ${contextForAI.taskDescription}
- Prioridad: ${contextForAI.taskPriority}
- Tipo: ${contextForAI.taskType}
- Duración estimada: ${contextForAI.durationHours} hora(s)
- Contactos asignados: ${contextForAI.assignedContacts}

**Estadísticas del usuario:**
- Total de tareas: ${contextForAI.userStats.totalTasks}
- Tareas completadas: ${contextForAI.userStats.completedTasks}
- Tareas urgentes pendientes: ${contextForAI.userStats.urgentPendingTasks}

**Slots disponibles:**
${slotsFormatted.map(s => `${s.id}. ${s.start} - ${s.end} (${s.timeOfDay})`).join('\n')}

**Instrucciones:**
1. Considera la prioridad de la tarea (urgente debe programarse pronto)
2. Considera el tipo de tarea (reuniones mejor en horario laboral medio, trabajo profundo mejor en mañanas)
3. Considera la carga de trabajo actual del usuario
4. Prefiere horarios que maximicen la productividad según el tipo de tarea
5. Para tareas urgentes, prioriza los slots más cercanos en el tiempo

Responde SOLO con un JSON válido con este formato exacto:
{
  "recommendations": [
    {
      "slotId": 0,
      "score": 95,
      "justification": "Razón concisa en español (máximo 100 caracteres)"
    }
  ]
}

Devuelve exactamente 3 recomendaciones ordenadas por score (mayor a menor).`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un asistente de productividad experto que analiza calendarios y recomienda horarios óptimos. Siempre respondes en JSON válido.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "time_slot_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    slotId: { type: "integer" },
                    score: { type: "integer" },
                    justification: { type: "string" },
                  },
                  required: ["slotId", "score", "justification"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const aiResponse = JSON.parse(typeof content === 'string' ? content : '{}');
    const recommendations = aiResponse.recommendations || [];

    // Mapear las recomendaciones a los slots originales
    const suggestedSlots = recommendations
      .map((rec: any) => {
        const slot = topSlots[rec.slotId];
        if (!slot) return null;

        return {
          ...slot,
          score: rec.score,
          reason: rec.justification,
          justification: rec.justification,
        };
      })
      .filter((slot: any) => slot !== null);

    return suggestedSlots;
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    
    // Fallback: devolver los primeros 3 slots con razones genéricas
    return topSlots.slice(0, 3).map((slot, index) => ({
      ...slot,
      score: 80 - index * 10,
      reason: "Horario disponible en tu calendario",
      justification: "Horario disponible en tu calendario",
    }));
  }
}
