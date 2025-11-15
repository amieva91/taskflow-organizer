import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Calendar, Clock, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  personal: "#3b82f6", // azul
  professional: "#8b5cf6", // morado
  meeting: "#f97316", // naranja
  reminder: "#10b981", // verde
};

const TYPE_LABELS = {
  personal: "Personal",
  professional: "Profesional",
  meeting: "Reunión",
  reminder: "Recordatorio",
};

export default function CalendarStats() {
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading } = trpc.calendarStats.get.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Estadísticas del Calendario</h1>
            <p className="text-muted-foreground">Análisis de tus eventos y gestión del tiempo</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos suficientes para mostrar estadísticas.</p>
                <p className="text-sm mt-2">Crea algunos eventos en tu calendario para ver análisis.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Preparar datos para gráficos
  const pieData = Object.entries(stats.typeDistribution).map(([type, count]) => ({
    name: TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type,
    value: count,
    color: COLORS[type as keyof typeof COLORS] || "#gray",
  }));

  const monthData = Object.entries(stats.eventsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
      eventos: count,
    }));

  const weekData = Object.entries(stats.hoursByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, hours]) => ({
      semana: new Date(week).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      horas: Number(hours.toFixed(1)),
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div>
          <h1 className="text-3xl font-bold">Estadísticas del Calendario</h1>
          <p className="text-muted-foreground">Análisis de tus eventos y gestión del tiempo</p>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.metrics.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {stats.metrics.avgEventsPerDay} por día
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Día Más Ocupado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stats.metrics.busiestDay ? (
                <>
                  <div className="text-2xl font-bold">{stats.metrics.busiestDay.count} eventos</div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(stats.metrics.busiestDay.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Sin datos</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Eventos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.typeDistribution).length}</div>
              <p className="text-xs text-muted-foreground">Categorías utilizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo</CardTitle>
              <CardDescription>Eventos clasificados por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sin datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eventos por mes */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Mes</CardTitle>
              <CardDescription>Tendencia de actividad mensual</CardDescription>
            </CardHeader>
            <CardContent>
              {monthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="eventos" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sin datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Horas por semana */}
        <Card>
          <CardHeader>
            <CardTitle>Horas Programadas por Semana</CardTitle>
            <CardDescription>Carga de trabajo semanal (últimas 8 semanas)</CardDescription>
          </CardHeader>
          <CardContent>
            {weekData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="horas" fill="#8b5cf6" name="Horas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin datos para mostrar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
