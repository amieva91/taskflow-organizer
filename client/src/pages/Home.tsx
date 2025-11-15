import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Calendar, CheckSquare, Users, BarChart3, Clock, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Iniciar Sesión</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Organiza tu vida profesional y personal
          <br />
          <span className="text-primary">en un solo lugar</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          TaskFlow Organizer integra Google Calendar y Gmail para ofrecerte una experiencia completa de gestión de proyectos, tareas y tiempo.
        </p>
        <Button size="lg" asChild className="text-lg px-8 py-6">
          <a href={getLoginUrl()}>Comenzar Gratis</a>
        </Button>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Calendar className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Calendario Integrado</h3>
            <p className="text-gray-600">
              Sincronización bidireccional con Google Calendar. Visualiza y gestiona eventos en múltiples vistas: día, semana, mes y año.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <CheckSquare className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Gestión de Tareas</h3>
            <p className="text-gray-600">
              Organiza tareas con prioridades, etiquetas y asignaciones. Vista estilo Planner con filtros avanzados.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <BarChart3 className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Proyectos Profesionales</h3>
            <p className="text-gray-600">
              Gestión completa estilo Microsoft Project con diagramas Gantt, fases, recursos y dependencias entre tareas.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Recursos y Equipos</h3>
            <p className="text-gray-600">
              Gestiona contactos, departamentos y asignaciones. Visualiza la carga de trabajo de cada recurso.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Clock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Optimización de Tiempo</h3>
            <p className="text-gray-600">
              Sugerencias inteligentes de slots de tiempo disponibles usando IA para maximizar tu productividad.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">PWA Móvil</h3>
            <p className="text-gray-600">
              Instala como app nativa. Widgets, notificaciones push y acceso rápido desde cualquier dispositivo.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-primary text-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-4">¿Listo para optimizar tu tiempo?</h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a TaskFlow Organizer y lleva tu productividad al siguiente nivel
          </p>
          <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
            <a href={getLoginUrl()}>Empezar Ahora</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 {APP_TITLE}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
