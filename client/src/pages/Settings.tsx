import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Link as LinkIcon, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const utils = trpc.useUtils();

  const { data: authUrl } = trpc.google.getAuthUrl.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: reminderSettings } = trpc.reminders.getSettings.useQuery();

  const [enabled, setEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [defaultMinutesBefore, setDefaultMinutesBefore] = useState("30");

  // Sincronizar estado local con datos del servidor
  useEffect(() => {
    if (reminderSettings) {
      setEnabled(reminderSettings.enabled);
      setEmailEnabled(reminderSettings.emailEnabled);
      setPushEnabled(reminderSettings.pushEnabled);
      setDefaultMinutesBefore(reminderSettings.defaultMinutesBefore.toString());
    }
  }, [reminderSettings]);

  const updateRemindersMutation = trpc.reminders.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configuración de recordatorios actualizada");
      utils.reminders.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error("Error al actualizar configuración: " + error.message);
    },
  });

  const handleSaveReminders = () => {
    updateRemindersMutation.mutate({
      enabled,
      emailEnabled,
      pushEnabled,
      defaultMinutesBefore: parseInt(defaultMinutesBefore),
    });
  };

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

  // Solicitar permisos de notificaciones
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Permisos de notificaciones concedidos");
      } else {
        toast.error("Permisos de notificaciones denegados");
      }
    } else {
      toast.error("Este navegador no soporta notificaciones");
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle>Recordatorios Automáticos</CardTitle>
            </div>
            <CardDescription>
              Configura cuándo y cómo recibir recordatorios de tus tareas y eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Activar recordatorios</Label>
                  <p className="text-sm text-gray-500">
                    Recibe notificaciones antes de tus tareas y eventos
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="minutesBefore">Tiempo de anticipación</Label>
                    <Select value={defaultMinutesBefore} onValueChange={setDefaultMinutesBefore}>
                      <SelectTrigger id="minutesBefore">
                        <SelectValue placeholder="Selecciona tiempo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos antes</SelectItem>
                        <SelectItem value="30">30 minutos antes</SelectItem>
                        <SelectItem value="60">1 hora antes</SelectItem>
                        <SelectItem value="120">2 horas antes</SelectItem>
                        <SelectItem value="1440">1 día antes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Cuánto tiempo antes de la tarea quieres recibir el recordatorio
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailEnabled">Notificaciones por email</Label>
                        <p className="text-sm text-gray-500">
                          Enviar recordatorios a tu correo electrónico
                        </p>
                      </div>
                      <Switch
                        id="emailEnabled"
                        checked={emailEnabled}
                        onCheckedChange={setEmailEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushEnabled">Notificaciones push</Label>
                        <p className="text-sm text-gray-500">
                          Mostrar notificaciones en el navegador
                        </p>
                      </div>
                      <Switch
                        id="pushEnabled"
                        checked={pushEnabled}
                        onCheckedChange={setPushEnabled}
                      />
                    </div>

                    {pushEnabled && "Notification" in window && Notification.permission !== "granted" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 mb-2">
                          Necesitas conceder permisos para recibir notificaciones push
                        </p>
                        <Button size="sm" variant="outline" onClick={requestNotificationPermission}>
                          Solicitar permisos
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSaveReminders}
                      disabled={updateRemindersMutation.isPending}
                    >
                      {updateRemindersMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar configuración"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
