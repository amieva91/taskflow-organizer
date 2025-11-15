import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();

  const { data: authUrl } = trpc.google.getAuthUrl.useQuery();
  const { data: user } = trpc.auth.me.useQuery();

  const handleCallbackMutation = trpc.google.handleCallback.useMutation({
    onSuccess: () => {
      toast.success("Cuenta de Google conectada exitosamente");
      utils.auth.me.invalidate();
      setLocation("/settings");
    },
    onError: (error) => {
      toast.error("Error al conectar con Google: " + error.message);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const code = params.get("code");
    
    if (code && !handleCallbackMutation.isPending) {
      handleCallbackMutation.mutate({ code });
    }
  }, [search]);

  const isGoogleConnected = !!user?.googleAccessToken;

  const handleConnectGoogle = () => {
    if (authUrl?.url) {
      window.location.href = authUrl.url;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus integraciones y preferencias
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Integración con Google</CardTitle>
            <CardDescription>
              Conecta tu cuenta de Google para sincronizar Calendar y Gmail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isGoogleConnected ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {isGoogleConnected ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <LinkIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {isGoogleConnected ? "Cuenta Conectada" : "Cuenta No Conectada"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isGoogleConnected
                        ? "Google Calendar y Gmail están sincronizados"
                        : "Conecta tu cuenta para acceder a Calendar y Gmail"}
                    </p>
                  </div>
                </div>
                {handleCallbackMutation.isPending ? (
                  <Button disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </Button>
                ) : isGoogleConnected ? (
                  <Button variant="outline" disabled>
                    Conectado
                  </Button>
                ) : (
                  <Button onClick={handleConnectGoogle}>
                    Conectar Google
                  </Button>
                )}
              </div>

              {isGoogleConnected && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Funcionalidades Disponibles
                  </h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>✓ Sincronización bidireccional con Google Calendar</li>
                    <li>✓ Visualización de eventos en el calendario</li>
                    <li>✓ Creación y edición de eventos</li>
                    <li>✓ Envío de correos desde Gmail</li>
                    <li>✓ Notificaciones de eventos</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
            <CardDescription>
              Detalles de tu cuenta en TaskFlow Organizer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Nombre</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.name || "No disponible"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.email || "No disponible"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
