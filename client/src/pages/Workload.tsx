import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

export default function Workload() {
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Calcular rango de fechas (semana actual + offset)
  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });

  const { data: workloads, isLoading } = trpc.workload.getAllContacts.useQuery({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
  });

  const { data: dailyAvailability } = trpc.workload.getDailyAvailability.useQuery(
    {
      contactId: selectedContactId!,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    },
    { enabled: !!selectedContactId }
  );

  const selectedContact = workloads?.find(w => w.contact.id === selectedContactId);

  // Preparar datos para el gráfico de barras
  const chartData = workloads?.map(w => ({
    name: w.contact.name,
    asignadas: Math.round(w.totalHours),
    disponibles: Math.round(w.availableHours),
    utilizacion: w.utilizationRate,
  })) || [];

  // Preparar datos para el gráfico de disponibilidad diaria
  const dailyChartData = dailyAvailability?.map(day => ({
    fecha: format(new Date(day.date), "EEE dd", { locale: es }),
    asignadas: day.hoursAssigned,
    disponibles: day.hoursAvailable,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carga de Trabajo</h1>
            <p className="text-gray-600 mt-1">
              Visualiza la disponibilidad y carga de trabajo de cada recurso
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setWeekOffset(weekOffset - 1)}>
              ← Semana anterior
            </Button>
            <Button variant="outline" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
              Semana actual
            </Button>
            <Button variant="outline" onClick={() => setWeekOffset(weekOffset + 1)}>
              Semana siguiente →
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recursos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workloads?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Contactos con asignaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recursos Sobrecargados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {workloads?.filter(w => w.isOverloaded).length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Más de 100% de utilización
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilización Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workloads && workloads.length > 0
                  ? Math.round(workloads.reduce((sum, w) => sum + w.utilizationRate, 0) / workloads.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Del total de recursos
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Carga de Trabajo por Recurso</CardTitle>
                <CardDescription>
                  Semana del {format(weekStart, "dd MMM", { locale: es })} al {format(weekEnd, "dd MMM yyyy", { locale: es })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Cargando...</div>
              </div>
            ) : workloads && workloads.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="asignadas" fill="#3b82f6" name="Horas Asignadas" />
                    <Bar dataKey="disponibles" fill="#10b981" name="Horas Disponibles" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {workloads.map((workload) => (
                    <div
                      key={workload.contact.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedContactId === workload.contact.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedContactId(workload.contact.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {workload.contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{workload.contact.name}</p>
                            <p className="text-sm text-gray-500">
                              {workload.contact.email || "Sin email"} 
                              {workload.contact.isFictional && (
                                <Badge variant="outline" className="ml-2">Ficticio</Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Horas asignadas</p>
                            <p className="font-semibold">{Math.round(workload.totalHours)}h / {Math.round(workload.availableHours)}h</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Utilización</p>
                            <Badge
                              variant={workload.isOverloaded ? "destructive" : "default"}
                              className={workload.isOverloaded ? "" : "bg-green-600"}
                            >
                              {workload.utilizationRate}%
                            </Badge>
                          </div>
                          {workload.isOverloaded && (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay contactos con asignaciones esta semana</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedContact && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle>Disponibilidad Diaria: {selectedContact.contact.name}</CardTitle>
              </div>
              <CardDescription>
                Distribución de horas asignadas por día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="asignadas" fill="#3b82f6" name="Horas Asignadas">
                    {dailyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.asignadas > entry.disponibles ? "#ef4444" : "#3b82f6"} />
                    ))}
                  </Bar>
                  <Bar dataKey="disponibles" fill="#10b981" name="Horas Disponibles" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Tareas Asignadas ({selectedContact.tasks.length})</h3>
                <div className="space-y-2">
                  {selectedContact.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">
                          {task.startDate && format(new Date(task.startDate), "dd MMM", { locale: es })} - 
                          {task.dueDate && format(new Date(task.dueDate), "dd MMM", { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          task.priority === "urgent" ? "destructive" :
                          task.priority === "high" ? "default" :
                          "outline"
                        }>
                          {task.priority === "urgent" ? "Urgente" :
                           task.priority === "high" ? "Alta" :
                           task.priority === "medium" ? "Media" : "Baja"}
                        </Badge>
                        <span className="text-sm font-semibold">{task.hoursAllocated}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
