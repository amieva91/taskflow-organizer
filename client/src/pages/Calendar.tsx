import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { RefreshCw, Plus, Calendar as CalendarIcon } from "lucide-react";
import esLocale from "@fullcalendar/core/locales/es";

interface EventFormData {
  id?: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  colorId?: string;
}

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const utils = trpc.useUtils();
  
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventFormData | null>(null);
  const [showAvailableSlots, setShowAvailableSlots] = useState(false);
  const [minSlotDuration, setMinSlotDuration] = useState(1); // Duración mínima en horas
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    start: "",
    end: "",
    allDay: false,
  });

  const { data: user } = trpc.auth.me.useQuery();
  const isGoogleConnected = !!user?.googleAccessToken;

  const { data: calendarEvents, isLoading, error } = trpc.calendar.list.useQuery({
    timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: 500,
  }, {
    enabled: isGoogleConnected,
    retry: false,
  });

  const { data: tasks } = trpc.tasks.list.useQuery();

  const createEventMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      toast.success("Evento creado exitosamente");
      utils.calendar.list.invalidate();
      setIsEventDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al crear evento: " + error.message);
    },
  });

  const updateEventMutation = trpc.calendar.update.useMutation({
    onSuccess: () => {
      toast.success("Evento actualizado exitosamente");
      utils.calendar.list.invalidate();
      setIsEventDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al actualizar evento: " + error.message);
    },
  });

  const deleteEventMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento eliminado exitosamente");
      utils.calendar.list.invalidate();
      setIsEventDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al eliminar evento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start: "",
      end: "",
      allDay: false,
    });
    setSelectedEvent(null);
  };

  // Función para calcular huecos disponibles
  const calculateAvailableSlots = () => {
    if (!showAvailableSlots || !calendarEvents) return [];

    const now = new Date();
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // Próximos 14 días
    const slots: any[] = [];

    // Obtener todos los eventos ocupados
    const busyEvents = [
      ...(calendarEvents || []).map((e: any) => ({
        start: new Date(e.start?.dateTime || e.start?.date),
        end: new Date(e.end?.dateTime || e.end?.date),
      })),
      ...(tasks || [])
        .filter(t => t.dueDate)
        .map(t => ({
          start: new Date(t.startDate || t.dueDate!),
          end: new Date(t.dueDate!),
        })),
    ].sort((a, b) => a.start.getTime() - b.start.getTime());

    // Generar slots de trabajo (9am-6pm, lunes-viernes)
    let currentDate = new Date(now);
    currentDate.setHours(9, 0, 0, 0);

    while (currentDate < endDate) {
      // Solo días laborables
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(9, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(18, 0, 0, 0);

        let slotStart = new Date(dayStart);

        // Buscar huecos en este día
        for (const event of busyEvents) {
          if (event.start > dayEnd || event.end < dayStart) continue;

          const gapStart = slotStart;
          const gapEnd = event.start < dayStart ? dayStart : event.start;

          // Si hay un hueco suficientemente grande
          const gapHours = (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60);
          if (gapHours >= minSlotDuration && gapStart < dayEnd) {
            slots.push({
              id: `slot-${slots.length}`,
              title: `✅ Disponible (${gapHours.toFixed(1)}h)`,
              start: gapStart.toISOString(),
              end: gapEnd > dayEnd ? dayEnd.toISOString() : gapEnd.toISOString(),
              backgroundColor: "#10b981",
              borderColor: "#059669",
              display: "background",
              extendedProps: {
                source: "available-slot",
                duration: gapHours,
              },
            });
          }

          slotStart = new Date(Math.max(event.end.getTime(), slotStart.getTime()));
        }

        // Hueco final del día
        if (slotStart < dayEnd) {
          const gapHours = (dayEnd.getTime() - slotStart.getTime()) / (1000 * 60 * 60);
          if (gapHours >= minSlotDuration) {
            slots.push({
              id: `slot-${slots.length}`,
              title: `✅ Disponible (${gapHours.toFixed(1)}h)`,
              start: slotStart.toISOString(),
              end: dayEnd.toISOString(),
              backgroundColor: "#10b981",
              borderColor: "#059669",
              display: "background",
              extendedProps: {
                source: "available-slot",
                duration: gapHours,
              },
            });
          }
        }
      }

      // Siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(9, 0, 0, 0);
    }

    return slots;
  };

  const availableSlots = calculateAvailableSlots();

  const events = [
    ...(calendarEvents || []).map((event: any) => ({
      id: event.id,
      title: event.summary || "Sin título",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !event.start?.dateTime,
      backgroundColor: event.colorId ? `#${event.colorId}` : "#3b82f6",
      extendedProps: {
        description: event.description,
        source: "google",
      },
    })),
    ...(tasks || [])
      .filter(task => task.dueDate)
      .map(task => ({
        id: `task-${task.id}`,
        title: `📋 ${task.title}`,
        start: task.startDate || task.dueDate,
        end: task.dueDate,
        allDay: true,
        backgroundColor: task.priority === "urgent" ? "#ef4444" : 
                        task.priority === "high" ? "#f97316" : 
                        task.priority === "medium" ? "#eab308" : "#6b7280",
        extendedProps: {
          description: task.description,
          source: "task",
          taskId: task.id,
        },
      })),
    ...availableSlots,
  ];

  const handleDateSelect = (selectInfo: any) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    setFormData({
      title: "",
      description: "",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    
    if (event.extendedProps.source === "task") {
      toast.info("Este es un evento de tarea. Edítalo desde la página de Tareas.");
      return;
    }

    setFormData({
      id: event.id,
      title: event.title,
      description: event.extendedProps.description || "",
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
    });
    setSelectedEvent({
      id: event.id,
      title: event.title,
      description: event.extendedProps.description || "",
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
    });
    setIsEventDialogOpen(true);
  };

  const handleEventDrop = (dropInfo: any) => {
    const event = dropInfo.event;
    
    if (event.extendedProps.source === "task") {
      toast.error("No puedes mover eventos de tareas desde aquí");
      dropInfo.revert();
      return;
    }

    updateEventMutation.mutate({
      eventId: event.id,
      start: {
        dateTime: event.allDay ? undefined : event.startStr,
        date: event.allDay ? event.startStr.split("T")[0] : undefined,
      },
      end: {
        dateTime: event.allDay ? undefined : event.endStr,
        date: event.allDay ? event.endStr.split("T")[0] : undefined,
      },
    });
  };

  const handleEventResize = (resizeInfo: any) => {
    const event = resizeInfo.event;
    
    if (event.extendedProps.source === "task") {
      toast.error("No puedes redimensionar eventos de tareas desde aquí");
      resizeInfo.revert();
      return;
    }

    updateEventMutation.mutate({
      eventId: event.id,
      start: {
        dateTime: event.allDay ? undefined : event.startStr,
        date: event.allDay ? event.startStr.split("T")[0] : undefined,
      },
      end: {
        dateTime: event.allDay ? undefined : event.endStr,
        date: event.allDay ? event.endStr.split("T")[0] : undefined,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    const eventData = {
      summary: formData.title,
      description: formData.description,
      start: {
        dateTime: formData.allDay ? undefined : formData.start,
        date: formData.allDay ? formData.start.split("T")[0] : undefined,
      },
      end: {
        dateTime: formData.allDay ? undefined : formData.end,
        date: formData.allDay ? formData.end.split("T")[0] : undefined,
      },
      colorId: formData.colorId,
    };

    if (selectedEvent?.id) {
      updateEventMutation.mutate({
        eventId: selectedEvent.id,
        ...eventData,
      });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleDelete = () => {
    if (selectedEvent?.id) {
      if (confirm("¿Estás seguro de que quieres eliminar este evento?")) {
        deleteEventMutation.mutate({ eventId: selectedEvent.id });
      }
    }
  };

  const handleRefresh = () => {
    utils.calendar.list.invalidate();
    utils.tasks.list.invalidate();
    toast.success("Calendario actualizado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus eventos y tareas en un solo lugar
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => {
              resetForm();
              setFormData({
                ...formData,
                start: new Date().toISOString(),
                end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              });
              setIsEventDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </div>
        </div>

        {isGoogleConnected && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showSlots"
                    checked={showAvailableSlots}
                    onChange={(e) => setShowAvailableSlots(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="showSlots" className="cursor-pointer">
                    Mostrar huecos disponibles
                  </Label>
                </div>
                {showAvailableSlots && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="minDuration" className="text-sm text-gray-600">
                      Duración mínima:
                    </Label>
                    <Select
                      value={minSlotDuration.toString()}
                      onValueChange={(value) => setMinSlotDuration(Number(value))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">30 min</SelectItem>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="2">2 horas</SelectItem>
                        <SelectItem value="3">3 horas</SelectItem>
                        <SelectItem value="4">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {showAvailableSlots && availableSlots.length > 0 && (
                  <div className="ml-auto text-sm text-green-600 font-medium">
                    {availableSlots.length} huecos disponibles encontrados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            {!isGoogleConnected ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <CalendarIcon className="h-16 w-16 text-gray-300" />
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Conecta tu cuenta de Google
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Para sincronizar eventos de Google Calendar, conecta tu cuenta en Configuración
                  </p>
                  <Button onClick={() => window.location.href = "/settings"}>
                    Ir a Configuración
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={esLocale}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }}
                buttonText={{
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  list: "Lista",
                }}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                height="auto"
                slotMinTime="06:00:00"
                slotMaxTime="23:00:00"
                allDaySlot={true}
                nowIndicator={true}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {selectedEvent ? "Editar Evento" : "Nuevo Evento"}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent
                    ? "Modifica los detalles del evento"
                    : "Crea un nuevo evento en tu calendario"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Reunión, evento, etc."
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles del evento..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start">Fecha Inicio *</Label>
                    <Input
                      id="start"
                      type={formData.allDay ? "date" : "datetime-local"}
                      value={formData.allDay ? formData.start.split("T")[0] : formData.start.slice(0, 16)}
                      onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="end">Fecha Fin *</Label>
                    <Input
                      id="end"
                      type={formData.allDay ? "date" : "datetime-local"}
                      value={formData.allDay ? formData.end.split("T")[0] : formData.end.slice(0, 16)}
                      onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={formData.allDay}
                    onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="allDay" className="cursor-pointer">
                    Todo el día
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={formData.colorId}
                    onValueChange={(value) => setFormData({ ...formData, colorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lavanda</SelectItem>
                      <SelectItem value="2">Salvia</SelectItem>
                      <SelectItem value="3">Uva</SelectItem>
                      <SelectItem value="4">Flamingo</SelectItem>
                      <SelectItem value="5">Plátano</SelectItem>
                      <SelectItem value="6">Mandarina</SelectItem>
                      <SelectItem value="7">Pavo real</SelectItem>
                      <SelectItem value="8">Grafito</SelectItem>
                      <SelectItem value="9">Arándano</SelectItem>
                      <SelectItem value="10">Albahaca</SelectItem>
                      <SelectItem value="11">Tomate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedEvent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteEventMutation.isPending}
                  >
                    Eliminar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEventDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {createEventMutation.isPending || updateEventMutation.isPending
                    ? "Guardando..."
                    : selectedEvent
                    ? "Actualizar"
                    : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
