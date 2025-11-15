import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle2, Ban, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReactSelect from "react-select";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  startDate: Date | null;
  dueDate: Date | null;
  type: "personal" | "professional" | "meeting" | "event" | "class" | "training";
  projectId: number | null;
  assignedContacts?: Array<{
    id: number;
    name: string;
    email: string | null;
  }>;
}

function TaskCard({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const priorityLabels = {
    urgent: "Urgente",
    high: "Alta",
    medium: "Media",
    low: "Baja",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-move"
      onClick={() => onEdit(task)}
    >
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        {task.dueDate && (
          <span className="text-xs text-gray-500">
            {format(new Date(task.dueDate), "d MMM", { locale: es })}
          </span>
        )}
      </div>
      {task.assignedContacts && task.assignedContacts.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {task.assignedContacts.slice(0, 3).map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
              title={contact.name}
            >
              <User className="h-3 w-3" />
              <span className="max-w-[80px] truncate">{contact.name}</span>
            </div>
          ))}
          {task.assignedContacts.length > 3 && (
            <span className="text-xs text-gray-500">+{task.assignedContacts.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const utils = trpc.useUtils();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<any[]>([]);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: "todo" | "in_progress" | "completed" | "blocked";
    priority: "low" | "medium" | "high" | "urgent";
    startDate: string;
    dueDate: string;
    type: "personal" | "professional" | "meeting" | "event" | "class" | "training";
    projectId: number | undefined;
    assignedContactIds: number[];
    sendNotifications: boolean;
  }>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    startDate: "",
    dueDate: "",
    type: "personal",
    projectId: undefined,
    assignedContactIds: [],
    sendNotifications: true,
  });

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: contacts } = trpc.contacts.list.useQuery();

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarea creada exitosamente");
      utils.tasks.list.invalidate();
      setIsTaskDialogOpen(false);
      resetForm();
    },
  });

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tarea actualizada exitosamente");
      utils.tasks.list.invalidate();
      setIsTaskDialogOpen(false);
      resetForm();
    },
  });

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarea eliminada exitosamente");
      utils.tasks.list.invalidate();
      setIsTaskDialogOpen(false);
      resetForm();
    },
  });

  const getAISuggestionsMutation = trpc.ai.suggestTimeSlots.useMutation({
    onSuccess: (data) => {
      setAISuggestions(data);
      setShowAISuggestions(true);
      toast.success(`Se encontraron ${data.length} sugerencias de horarios`);
    },
    onError: (error) => {
      toast.error("Error al generar sugerencias: " + error.message);
    },
  });

  const handleGetAISuggestions = () => {
    if (!formData.title.trim()) {
      toast.error("Ingresa un título para la tarea primero");
      return;
    }

    getAISuggestionsMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      estimatedHours: 2,
      assignedContactIds: formData.assignedContactIds.length > 0 ? formData.assignedContactIds : undefined,
      type: formData.type,
    });
  };

  const handleSelectAISuggestion = (suggestion: any) => {
    const startDate = new Date(suggestion.start);
    const endDate = new Date(suggestion.end);
    
    setFormData({
      ...formData,
      startDate: format(startDate, "yyyy-MM-dd'T'HH:mm"),
      dueDate: format(endDate, "yyyy-MM-dd'T'HH:mm"),
    });
    
    setShowAISuggestions(false);
    toast.success("Horario aplicado a la tarea");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      startDate: "",
      dueDate: "",
      type: "personal",
      projectId: undefined,
      assignedContactIds: [],
      sendNotifications: true,
    });
    setSelectedTask(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      startDate: formData.startDate || undefined,
      dueDate: formData.dueDate || undefined,
      type: formData.type,
      projectId: formData.projectId,
      assignedContactIds: formData.assignedContactIds.length > 0 ? formData.assignedContactIds : undefined,
      sendNotifications: formData.sendNotifications && formData.assignedContactIds.length > 0,
    };

    if (selectedTask) {
      updateTaskMutation.mutate({
        id: selectedTask.id,
        ...data,
      });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      startDate: task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      type: task.type,
      projectId: task.projectId || undefined,
      assignedContactIds: task.assignedContacts?.map(c => c.id) || [],
      sendNotifications: false,
    });
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = () => {
    if (selectedTask) {
      if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
        deleteTaskMutation.mutate({ id: selectedTask.id });
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as "todo" | "in_progress" | "completed" | "blocked";

    const task = tasks?.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTaskMutation.mutate({
        id: taskId,
        status: newStatus,
      });
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks?.filter((t) => t.status === "todo") || [];
  const inProgressTasks = filteredTasks?.filter((t) => t.status === "in_progress") || [];
  const completedTasks = filteredTasks?.filter((t) => t.status === "completed") || [];
  const blockedTasks = filteredTasks?.filter((t) => t.status === "blocked") || [];

  const activeTask = tasks?.find((t) => t.id === activeId);

  // Opciones para react-select
  const contactOptions = contacts?.map(contact => ({
    value: contact.id,
    label: contact.name,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
            <p className="text-gray-600 mt-1">
              Organiza tus tareas con vista Kanban
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsTaskDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar tareas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Todo Column */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    Por Hacer
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {todoTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {todoTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                    ))}
                  </SortableContext>
                  {todoTasks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No hay tareas por hacer
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* In Progress Column */}
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-blue-600" />
                    En Progreso
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {inProgressTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SortableContext items={inProgressTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {inProgressTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                    ))}
                  </SortableContext>
                  {inProgressTasks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No hay tareas en progreso
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Completed Column */}
              <Card className="bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Completadas
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {completedTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SortableContext items={completedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {completedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                    ))}
                  </SortableContext>
                  {completedTasks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No hay tareas completadas
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Blocked Column */}
              <Card className="bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ban className="h-5 w-5 text-red-600" />
                    Bloqueadas
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {blockedTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SortableContext items={blockedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {blockedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                    ))}
                  </SortableContext>
                  {blockedTasks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No hay tareas bloqueadas
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="bg-white p-4 rounded-lg border shadow-lg">
                  <h4 className="font-medium text-gray-900">{activeTask.title}</h4>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {selectedTask ? "Editar Tarea" : "Nueva Tarea"}
                </DialogTitle>
                <DialogDescription>
                  {selectedTask
                    ? "Modifica los detalles de la tarea"
                    : "Crea una nueva tarea y asigna recursos"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Título de la tarea"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Detalles de la tarea..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Por Hacer</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="blocked">Bloqueada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                {!selectedTask && (
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetAISuggestions}
                      disabled={getAISuggestionsMutation.isPending || !formData.title.trim()}
                      className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                    >
                      {getAISuggestionsMutation.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analizando calendario...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Sugerir horarios con IA
                        </>
                      )}
                    </Button>
                    {showAISuggestions && aiSuggestions.length > 0 && (
                      <div className="mt-2 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-sm mb-3 text-purple-900">Horarios sugeridos por IA:</h4>
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSelectAISuggestion(suggestion)}
                              className="w-full text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">
                                    {format(new Date(suggestion.start), "EEEE d 'de' MMMM", { locale: es })}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {format(new Date(suggestion.start), "HH:mm", { locale: es })} - {format(new Date(suggestion.end), "HH:mm", { locale: es })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {suggestion.justification}
                                  </div>
                                </div>
                                <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                                  {suggestion.score}%
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAISuggestions(false)}
                          className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Cerrar sugerencias
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="professional">Profesional</SelectItem>
                        <SelectItem value="meeting">Reunión</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="class">Clase</SelectItem>
                        <SelectItem value="training">Formación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="project">Proyecto</Label>
                    <Select
                      value={formData.projectId?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          projectId: value ? parseInt(value) : undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin proyecto</SelectItem>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contacts">Asignar Contactos</Label>
                  <ReactSelect
                    isMulti
                    options={contactOptions}
                    value={contactOptions.filter(option => 
                      formData.assignedContactIds.includes(option.value)
                    )}
                    onChange={(selected) => {
                      setFormData({
                        ...formData,
                        assignedContactIds: selected.map(s => s.value),
                      });
                    }}
                    placeholder="Seleccionar contactos..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <p className="text-xs text-gray-500">
                    Selecciona uno o varios contactos para asignar a esta tarea
                  </p>
                </div>

                {!selectedTask && formData.assignedContactIds.length > 0 && (
                  <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="sendNotifications"
                      checked={formData.sendNotifications}
                      onChange={(e) =>
                        setFormData({ ...formData, sendNotifications: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="sendNotifications" className="text-sm font-normal cursor-pointer">
                      Enviar notificaciones por email a los contactos asignados
                    </Label>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {selectedTask && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteTask}
                    disabled={deleteTaskMutation.isPending}
                  >
                    Eliminar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsTaskDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createTaskMutation.isPending || updateTaskMutation.isPending
                  }
                >
                  {createTaskMutation.isPending || updateTaskMutation.isPending
                    ? "Guardando..."
                    : selectedTask
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
