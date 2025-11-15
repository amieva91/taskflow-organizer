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
import { RefreshCw, Plus } from "lucide-react";
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
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    start: "",
    end: "",
    allDay: false,
  });

  const { data: calendarEvents, isLoading } = trpc.calendar.list.useQuery({
    timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: 500,
  }, {
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
          <div className="flex gap-2">
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

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
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
