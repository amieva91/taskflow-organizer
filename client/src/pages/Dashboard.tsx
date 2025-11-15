import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  Plus, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Timer
} from "lucide-react";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const weekEnd = endOfDay(addDays(today, 7));

  // Fetch tasks
  const { data: allTasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: todayTasks } = trpc.tasks.byDateRange.useQuery({
    startDate: todayStart.toISOString(),
    endDate: todayEnd.toISOString(),
  });

  // Fetch calendar events
  const { data: calendarEvents, isLoading: eventsLoading } = trpc.calendar.list.useQuery({
    timeMin: todayStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    maxResults: 10,
  }, {
    enabled: true,
    retry: false,
  });

  // Fetch projects
  const { data: projects } = trpc.projects.list.useQuery();

  // Calculate statistics
  const totalTasks = allTasks?.length || 0;
  const completedTasks = allTasks?.filter(t => t.status === "completed").length || 0;
  const pendingTasks = allTasks?.filter(t => t.status === "todo").length || 0;
  const inProgressTasks = allTasks?.filter(t => t.status === "in_progress").length || 0;
  const urgentTasks = allTasks?.filter(t => t.priority === "urgent").length || 0;
  const todayTasksCount = todayTasks?.length || 0;

  const activeProjects = projects?.filter(p => p.status === "active").length || 0;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/tasks")}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
            <Button variant="outline" onClick={() => setLocation("/calendar")}>
              <Calendar className="h-4 w-4 mr-2" />
              Ver Calendario
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Totales</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks} completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                De todas las tareas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Hoy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTasksCount}</div>
              <p className="text-xs text-muted-foreground">
                Programadas para hoy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                En progreso
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Tareas Pendientes</CardTitle>
              <CardDescription>
                {pendingTasks} tareas por hacer, {inProgressTasks} en progreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTasks
                    ?.filter(t => t.status !== "completed")
                    .slice(0, 5)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setLocation("/tasks")}
                      >
                        <div className="mt-0.5">
                          {task.status === "in_progress" ? (
                            <Timer className="h-5 w-5 text-blue-500" />
                          ) : task.priority === "urgent" ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckSquare className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                task.priority === "urgent"
                                  ? "bg-red-100 text-red-700"
                                  : task.priority === "high"
                                  ? "bg-orange-100 text-orange-700"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {task.priority === "urgent"
                                ? "Urgente"
                                : task.priority === "high"
                                ? "Alta"
                                : task.priority === "medium"
                                ? "Media"
                                : "Baja"}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(task.dueDate), "d MMM", { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {(!allTasks || allTasks.filter(t => t.status !== "completed").length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>¡No hay tareas pendientes!</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>
                Eventos de esta semana desde Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : calendarEvents && calendarEvents.length > 0 ? (
                <div className="space-y-3">
                  {calendarEvents.slice(0, 5).map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setLocation("/calendar")}
                    >
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.summary || "Sin título"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.start?.dateTime
                            ? format(new Date(event.start.dateTime), "d MMM, HH:mm", {
                                locale: es,
                              })
                            : event.start?.date
                            ? format(new Date(event.start.date), "d MMM", { locale: es })
                            : "Fecha no especificada"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="mb-2">No hay eventos próximos</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/settings")}
                    >
                      Conectar Google Calendar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Tareas por Estado</CardTitle>
            <CardDescription>Distribución de todas tus tareas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{pendingTasks}</div>
                <p className="text-sm text-gray-600 mt-1">Por Hacer</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{inProgressTasks}</div>
                <p className="text-sm text-blue-600 mt-1">En Progreso</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
                <p className="text-sm text-green-600 mt-1">Completadas</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{urgentTasks}</div>
                <p className="text-sm text-red-600 mt-1">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
