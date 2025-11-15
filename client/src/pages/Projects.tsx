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
import { Plus, FolderKanban, Calendar, Users, TrendingUp } from "lucide-react";
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  startDate: Date | null;
  endDate: Date | null;
}

export default function Projects() {
  const utils = trpc.useUtils();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
    startDate: string;
    endDate: string;
  }>({
    name: "",
    description: "",
    status: "planning",
    startDate: "",
    endDate: "",
  });

  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Proyecto creado exitosamente");
      utils.projects.list.invalidate();
      setIsProjectDialogOpen(false);
      resetForm();
    },
  });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Proyecto actualizado exitosamente");
      utils.projects.list.invalidate();
      setIsProjectDialogOpen(false);
      resetForm();
    },
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Proyecto eliminado exitosamente");
      utils.projects.list.invalidate();
      setIsProjectDialogOpen(false);
      resetForm();
      setSelectedProject(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      startDate: "",
      endDate: "",
    });
    setSelectedProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const projectData = {
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    if (selectedProject) {
      updateProjectMutation.mutate({
        id: selectedProject.id,
        ...projectData,
      });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const handleDelete = () => {
    if (selectedProject) {
      if (confirm("¿Estás seguro de que quieres eliminar este proyecto?")) {
        deleteProjectMutation.mutate({ id: selectedProject.id });
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      startDate: project.startDate ? format(new Date(project.startDate), "yyyy-MM-dd") : "",
      endDate: project.endDate ? format(new Date(project.endDate), "yyyy-MM-dd") : "",
    });
    setIsProjectDialogOpen(true);
  };

  // Transform projects and tasks to Gantt format
  const ganttTasks: GanttTask[] = [];

  projects?.forEach((project) => {
    const projectTasks = tasks?.filter((t) => t.projectId === project.id) || [];
    
    if (projectTasks.length === 0) {
      // Project without tasks
      if (project.startDate && project.endDate) {
        ganttTasks.push({
          id: `project-${project.id}`,
          name: project.name,
          start: new Date(project.startDate),
          end: new Date(project.endDate),
          progress: 0,
          type: "project",
          hideChildren: false,
          styles: {
            backgroundColor: "#3b82f6",
            backgroundSelectedColor: "#2563eb",
            progressColor: "#1d4ed8",
            progressSelectedColor: "#1e40af",
          },
        });
      }
    } else {
      // Project with tasks
      const taskStartDates = projectTasks
        .filter((t) => t.startDate)
        .map((t) => new Date(t.startDate!).getTime());
      const taskEndDates = projectTasks
        .filter((t) => t.dueDate)
        .map((t) => new Date(t.dueDate!).getTime());

      const projectStart = project.startDate
        ? new Date(project.startDate)
        : taskStartDates.length > 0
        ? new Date(Math.min(...taskStartDates))
        : new Date();

      const projectEnd = project.endDate
        ? new Date(project.endDate)
        : taskEndDates.length > 0
        ? new Date(Math.max(...taskEndDates))
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      ganttTasks.push({
        id: `project-${project.id}`,
        name: project.name,
        start: projectStart,
        end: projectEnd,
        progress: 0,
        type: "project",
        hideChildren: false,
        styles: {
          backgroundColor: "#3b82f6",
          backgroundSelectedColor: "#2563eb",
          progressColor: "#1d4ed8",
          progressSelectedColor: "#1e40af",
        },
      });

      // Add tasks
      projectTasks.forEach((task) => {
        if (task.startDate && task.dueDate) {
          ganttTasks.push({
            id: `task-${task.id}`,
            name: task.title,
            start: new Date(task.startDate),
            end: new Date(task.dueDate),
            progress: task.status === "completed" ? 100 : task.status === "in_progress" ? 50 : 0,
            type: "task",
            project: `project-${project.id}`,
            styles: {
              backgroundColor:
                task.priority === "urgent"
                  ? "#ef4444"
                  : task.priority === "high"
                  ? "#f97316"
                  : task.priority === "medium"
                  ? "#eab308"
                  : "#6b7280",
              backgroundSelectedColor:
                task.priority === "urgent"
                  ? "#dc2626"
                  : task.priority === "high"
                  ? "#ea580c"
                  : task.priority === "medium"
                  ? "#ca8a04"
                  : "#4b5563",
            },
          });
        }
      });
    }
  });

  const statusColors: Record<string, string> = {
    planning: "bg-gray-100 text-gray-700",
    active: "bg-blue-100 text-blue-700",
    on_hold: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    planning: "Planificación",
    active: "Activo",
    on_hold: "En Pausa",
    completed: "Completado",
    cancelled: "Cancelado",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
            <p className="text-gray-600 mt-1">
              Gestiona proyectos con diagrama de Gantt
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsProjectDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => {
            const projectTasks = tasks?.filter((t) => t.projectId === project.id) || [];
            const completedTasks = projectTasks.filter((t) => t.status === "completed").length;

            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleEditProject(project)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      <span className="text-lg">{project.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        statusColors[project.status]
                      }`}
                    >
                      {statusLabels[project.status]}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {project.startDate
                          ? format(new Date(project.startDate), "d MMM", { locale: es })
                          : "Sin fecha"}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        {projectTasks.length} tareas
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-medium">{completedTasks > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${completedTasks > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    {projectTasks.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {completedTasks} de {projectTasks.length} tareas completadas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gantt Chart */}
        {ganttTasks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Diagrama de Gantt
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === ViewMode.Day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(ViewMode.Day)}
                  >
                    Día
                  </Button>
                  <Button
                    variant={viewMode === ViewMode.Week ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(ViewMode.Week)}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={viewMode === ViewMode.Month ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(ViewMode.Month)}
                  >
                    Mes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Gantt
                  tasks={ganttTasks}
                  viewMode={viewMode}
                  locale="es"
                  listCellWidth="200px"
                  columnWidth={viewMode === ViewMode.Month ? 100 : viewMode === ViewMode.Week ? 80 : 60}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && projects?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <FolderKanban className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay proyectos
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer proyecto para comenzar
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsProjectDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Project Dialog */}
        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {selectedProject ? "Editar Proyecto" : "Nuevo Proyecto"}
                </DialogTitle>
                <DialogDescription>
                  {selectedProject
                    ? "Modifica los detalles del proyecto"
                    : "Crea un nuevo proyecto"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del proyecto"
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
                    placeholder="Detalles del proyecto..."
                    rows={3}
                  />
                </div>

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
                      <SelectItem value="planning">Planificación</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="on_hold">En Pausa</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Fecha Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Fecha Fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedProject && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteProjectMutation.isPending}
                  >
                    Eliminar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsProjectDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createProjectMutation.isPending || updateProjectMutation.isPending
                  }
                >
                  {createProjectMutation.isPending || updateProjectMutation.isPending
                    ? "Guardando..."
                    : selectedProject
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
