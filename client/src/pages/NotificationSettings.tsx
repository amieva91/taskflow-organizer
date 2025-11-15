import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function NotificationSettings() {
  const { data: settings, isLoading } = trpc.notificationSettings.get.useQuery();
  const upsertMutation = trpc.notificationSettings.upsert.useMutation();
  const utils = trpc.useUtils();

  const [enabled, setEnabled] = useState(true);
  const [notificationMinutes, setNotificationMinutes] = useState(15);
  const [notifyPersonal, setNotifyPersonal] = useState(false);
  const [notifyProfessional, setNotifyProfessional] = useState(false);
  const [notifyMeeting, setNotifyMeeting] = useState(true);
  const [notifyReminder, setNotifyReminder] = useState(true);

  // Cargar configuración cuando esté disponible
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setNotificationMinutes(settings.notificationMinutes);
      setNotifyPersonal(settings.notifyPersonal);
      setNotifyProfessional(settings.notifyProfessional);
      setNotifyMeeting(settings.notifyMeeting);
      setNotifyReminder(settings.notifyReminder);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        enabled,
        notificationMinutes,
        notifyPersonal,
        notifyProfessional,
        notifyMeeting,
        notifyReminder,
      });
      
      utils.notificationSettings.get.invalidate();
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar la configuración");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Notificaciones</h1>
          <p className="text-gray-600 mt-1">
            Personaliza cómo y cuándo recibes recordatorios de tus eventos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones de Eventos
            </CardTitle>
            <CardDescription>
              Configura los recordatorios automáticos para tus eventos del calendario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle global */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base">
                  Activar notificaciones
                </Label>
                <p className="text-sm text-gray-500">
                  Recibe recordatorios automáticos antes de tus eventos
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div className="border-t pt-6" />

            {/* Tiempo de antelación */}
            <div className="space-y-2">
              <Label htmlFor="minutes">Tiempo de antelación</Label>
              <Select
                value={String(notificationMinutes)}
                onValueChange={(value) => setNotificationMinutes(Number(value))}
                disabled={!enabled}
              >
                <SelectTrigger id="minutes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutos antes</SelectItem>
                  <SelectItem value="10">10 minutos antes</SelectItem>
                  <SelectItem value="15">15 minutos antes</SelectItem>
                  <SelectItem value="30">30 minutos antes</SelectItem>
                  <SelectItem value="60">1 hora antes</SelectItem>
                  <SelectItem value="120">2 horas antes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Cuánto tiempo antes del evento quieres recibir la notificación
              </p>
            </div>

            <div className="border-t pt-6" />

            {/* Tipos de eventos */}
            <div className="space-y-4">
              <Label className="text-base">Tipos de eventos a notificar</Label>
              <p className="text-sm text-gray-500 -mt-2">
                Selecciona qué tipos de eventos deben generar notificaciones
              </p>

              <div className="space-y-4 pl-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <Label htmlFor="personal" className="cursor-pointer">
                      Personal
                    </Label>
                  </div>
                  <Switch
                    id="personal"
                    checked={notifyPersonal}
                    onCheckedChange={setNotifyPersonal}
                    disabled={!enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <Label htmlFor="professional" className="cursor-pointer">
                      Profesional
                    </Label>
                  </div>
                  <Switch
                    id="professional"
                    checked={notifyProfessional}
                    onCheckedChange={setNotifyProfessional}
                    disabled={!enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <Label htmlFor="meeting" className="cursor-pointer">
                      Reunión
                    </Label>
                  </div>
                  <Switch
                    id="meeting"
                    checked={notifyMeeting}
                    onCheckedChange={setNotifyMeeting}
                    disabled={!enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <Label htmlFor="reminder" className="cursor-pointer">
                      Recordatorio
                    </Label>
                  </div>
                  <Switch
                    id="reminder"
                    checked={notifyReminder}
                    onCheckedChange={setNotifyReminder}
                    disabled={!enabled}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6" />

            {/* Botón guardar */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Las notificaciones del navegador deben estar activadas para recibir recordatorios. 
              Si no ves el banner de activación en el Calendario, verifica los permisos de notificaciones en la configuración de tu navegador.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
