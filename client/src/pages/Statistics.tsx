import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#6b7280",
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  blocked: "#ef4444",
};

export default function Statistics() {
  const [dateRange, setDateRange] = useState(30); // días

  const { data: tasks, isLoading: loadingTasks } = trpc.tasks.list.useQuery();
  const { data: projects, isLoading: loadingProjects } = trpc.projects.list.useQuery();

  if (loadingTasks || loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filtrar tareas por rango de fechas
  const startDate = subDays(new Date(), dateRange);
  const filteredTasks = tasks?.filter(task => 
    new Date(task.createdAt) >= startDate
  ) || [];

  // Calcular métricas
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === "completed").length;
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress").length;
  const blockedTasks = filteredTasks.filter(t => t.status === "blocked").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Datos para gráfico de tareas por día
  const tasksByDay = Array.from({ length: Math.min(dateRange, 30) }, (_, i) => {
    const date = subDays(new Date(), Math.min(dateRange, 30) - 1 - i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const completed = filteredTasks.filter(t => 
      t.status === "completed" && 
      new Date(t.updatedAt) >= dayStart && 
      new Date(t.updatedAt) <= dayEnd
    ).length;

    return {
      date: format(date, "dd/MM", { locale: es }),
      completadas: completed,
    };
  });

  // Datos para gráfico de distribución por prioridad
  const tasksByPriority = [
    { name: "Urgente", value: filteredTasks.filter(t => t.priority === "urgent").length, color: COLORS.urgent },
    { name: "Alta", value: filteredTasks.filter(t => t.priority === "high").length, color: COLORS.high },
    { name: "Media", value: filteredTasks.filter(t => t.priority === "medium").length, color: COLORS.medium },
    { name: "Baja", value: filteredTasks.filter(t => t.priority === "low").length, color: COLORS.low },
  ].filter(item => item.value > 0);

  // Datos para gráfico de distribución por estado
  const tasksByStatus = [
    { name: "Por Hacer", value: filteredTasks.filter(t => t.status === "todo").length, color: COLORS.todo },
    { name: "En Progreso", value: filteredTasks.filter(t => t.status === "in_progress").length, color: COLORS.in_progress },
    { name: "Completadas", value: filteredTasks.filter(t => t.status === "completed").length, color: COLORS.completed },
    { name: "Bloqueadas", value: filteredTasks.filter(t => t.status === "blocked").length, color: COLORS.blocked },
  ].filter(item => item.value > 0);

  // Datos para gráfico de tareas por proyecto
  const tasksByProject = projects?.map(project => ({
    name: project.name,
    total: filteredTasks.filter(t => t.projectId === project.id).length,
    completadas: filteredTasks.filter(t => t.projectId === project.id && t.status === "completed").length,
  })).filter(item => item.total > 0) || [];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text("Reporte de Estadísticas - TaskFlow Organizer", 14, 20);
    
    // Fecha del reporte
    doc.setFontSize(10);
    doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, 14, 28);
    doc.text(`Período: Últimos ${dateRange} días`, 14, 34);
    
    // Métricas generales
    doc.setFontSize(14);
    doc.text("Métricas Generales", 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total de Tareas", totalTasks.toString()],
        ["Tareas Completadas", completedTasks.toString()],
        ["Tareas en Progreso", inProgressTasks.toString()],
        ["Tareas Bloqueadas", blockedTasks.toString()],
        ["Tasa de Completado", `${completionRate}%`],
      ],
    });

    // Distribución por prioridad
    doc.setFontSize(14);
    doc.text("Distribución por Prioridad", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Prioridad", "Cantidad"]],
      body: tasksByPriority.map(item => [item.name, item.value.toString()]),
    });

    // Distribución por estado
    doc.setFontSize(14);
    doc.text("Distribución por Estado", 14, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Estado", "Cantidad"]],
      body: tasksByStatus.map(item => [item.name, item.value.toString()]),
    });

    // Tareas por proyecto
    if (tasksByProject.length > 0) {
      doc.setFontSize(14);
      doc.text("Tareas por Proyecto", 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Proyecto", "Total", "Completadas"]],
        body: tasksByProject.map(item => [item.name, item.total.toString(), item.completadas.toString()]),
      });
    }

    // Guardar PDF
    doc.save(`estadisticas-taskflow-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Reporte PDF generado exitosamente");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
            <p className="text-gray-600 mt-1">Análisis de productividad y métricas</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
              <option value={365}>Último año</option>
            </select>
            <Button onClick={exportToPDF} className="gap-2">
              <FileDown className="w-4 h-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Tareas</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalTasks}</div>
              <p className="text-xs text-gray-500 mt-1">En los últimos {dateRange} días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completadas</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedTasks}</div>
              <p className="text-xs text-gray-500 mt-1">{completionRate}% de tasa de completado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Progreso</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressTasks}</div>
              <p className="text-xs text-gray-500 mt-1">Tareas activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bloqueadas</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{blockedTasks}</div>
              <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tareas completadas por día */}
          <Card>
            <CardHeader>
              <CardTitle>Tareas Completadas por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tasksByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completadas" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por prioridad */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Prioridad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tasksByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribución por estado */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tareas por proyecto */}
          {tasksByProject.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tareas por Proyecto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tasksByProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Total" />
                    <Bar dataKey="completadas" fill="#22c55e" name="Completadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
