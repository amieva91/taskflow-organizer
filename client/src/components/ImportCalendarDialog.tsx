import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { parseICS, readICSFile, ParsedEvent } from "@/lib/icsParser";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ImportCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface EventToImport extends ParsedEvent {
  selected: boolean;
  isDuplicate?: boolean;
  conflictReason?: string;
  conflictStrategy: "skip" | "overwrite" | "create_new";
}

export default function ImportCalendarDialog({ open, onOpenChange, onImportComplete }: ImportCalendarDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [events, setEvents] = useState<EventToImport[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const checkDuplicateMutation = trpc.calendarImport.checkDuplicate.useMutation();
  const importBatchMutation = trpc.calendarImport.importBatch.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".ics")) {
      toast.error("Por favor selecciona un archivo .ics válido");
      return;
    }

    setFile(selectedFile);
    setEvents([]);
    setImportResult(null);
    setIsProcessing(true);

    try {
      // Leer y parsear archivo
      const content = await readICSFile(selectedFile);
      const parsedEvents = parseICS(content);

      if (parsedEvents.length === 0) {
        toast.error("No se encontraron eventos en el archivo");
        setIsProcessing(false);
        return;
      }

      // Verificar duplicados para cada evento
      const eventsWithDuplicateCheck: EventToImport[] = [];

      for (const event of parsedEvents) {
        try {
          const duplicateCheck = await checkDuplicateMutation.mutateAsync({
            title: event.title,
            description: event.description,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            location: event.location,
            allDay: event.allDay,
            type: event.type,
            isRecurring: event.isRecurring,
            recurrencePattern: event.recurrencePattern || "none",
            recurrenceEndDate: event.recurrenceEndDate?.toISOString(),
          });

          eventsWithDuplicateCheck.push({
            ...event,
            selected: !duplicateCheck.isDuplicate, // Por defecto, no seleccionar duplicados
            isDuplicate: duplicateCheck.isDuplicate,
            conflictReason: duplicateCheck.conflictReason,
            conflictStrategy: "skip",
          });
        } catch (error) {
          // Si falla la verificación, añadir el evento sin marcar como duplicado
          eventsWithDuplicateCheck.push({
            ...event,
            selected: true,
            isDuplicate: false,
            conflictStrategy: "skip",
          });
        }
      }

      setEvents(eventsWithDuplicateCheck);
      toast.success(`${parsedEvents.length} eventos encontrados en el archivo`);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error al procesar el archivo .ics");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleEvent = (index: number) => {
    setEvents((prev) =>
      prev.map((e, i) => (i === index ? { ...e, selected: !e.selected } : e))
    );
  };

  const handleToggleAll = () => {
    const allSelected = events.every((e) => e.selected);
    setEvents((prev) => prev.map((e) => ({ ...e, selected: !allSelected })));
  };

  const handleConflictStrategyChange = (index: number, strategy: "skip" | "overwrite" | "create_new") => {
    setEvents((prev) =>
      prev.map((e, i) => (i === index ? { ...e, conflictStrategy: strategy } : e))
    );
  };

  const handleImport = async () => {
    const selectedEvents = events.filter((e) => e.selected);

    if (selectedEvents.length === 0) {
      toast.error("Selecciona al menos un evento para importar");
      return;
    }

    setIsImporting(true);

    try {
      const result = await importBatchMutation.mutateAsync(
        selectedEvents.map((e) => ({
          title: e.title,
          description: e.description,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate.toISOString(),
          location: e.location,
          allDay: e.allDay,
          type: e.type,
          isRecurring: e.isRecurring,
          recurrencePattern: e.recurrencePattern || "none",
          recurrenceEndDate: e.recurrenceEndDate?.toISOString(),
          conflictStrategy: e.conflictStrategy,
        }))
      );

      setImportResult(result);
      toast.success(`Importación completada: ${result.imported} eventos importados`);
      
      // Esperar un momento para que el usuario vea el resumen
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error importing events:", error);
      toast.error("Error al importar eventos");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setEvents([]);
    setImportResult(null);
    onOpenChange(false);
  };

  const selectedCount = events.filter((e) => e.selected).length;
  const duplicateCount = events.filter((e) => e.isDuplicate).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Eventos desde .ics</DialogTitle>
          <DialogDescription>
            Selecciona un archivo iCalendar (.ics) para importar eventos a tu calendario local
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de archivo */}
          <div>
            <Label htmlFor="file-upload">Archivo .ics</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".ics"
              onChange={handleFileChange}
              disabled={isProcessing || isImporting}
            />
          </div>

          {/* Procesando */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Procesando archivo...</span>
            </div>
          )}

          {/* Resultado de importación */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-semibold text-green-900">Importación Completada</h4>
                  <div className="text-sm text-green-700 mt-1">
                    <p>Total: {importResult.total} eventos</p>
                    <p>✓ Importados: {importResult.imported}</p>
                    <p>⊘ Saltados: {importResult.skipped}</p>
                    {importResult.errors > 0 && <p>✗ Errores: {importResult.errors}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de eventos */}
          {events.length > 0 && !importResult && (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedCount} de {events.length} eventos seleccionados
                  {duplicateCount > 0 && ` • ${duplicateCount} duplicados detectados`}
                </div>
                <Button variant="outline" size="sm" onClick={handleToggleAll}>
                  {events.every((e) => e.selected) ? "Deseleccionar todos" : "Seleccionar todos"}
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="w-12 p-2"></th>
                        <th className="text-left p-2">Título</th>
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2 w-40">Conflicto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event, index) => (
                        <tr
                          key={index}
                          className={`border-t ${event.isDuplicate ? "bg-yellow-50" : ""}`}
                        >
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={event.selected}
                              onCheckedChange={() => handleToggleEvent(index)}
                            />
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{event.title}</div>
                            {event.location && (
                              <div className="text-xs text-muted-foreground">{event.location}</div>
                            )}
                          </td>
                          <td className="p-2 text-sm">
                            {event.startDate.toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: event.allDay ? undefined : "2-digit",
                              minute: event.allDay ? undefined : "2-digit",
                            })}
                          </td>
                          <td className="p-2 text-sm capitalize">{event.type}</td>
                          <td className="p-2">
                            {event.isDuplicate ? (
                              <div className="space-y-1">
                                <div className="flex items-center text-xs text-yellow-700">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Duplicado
                                </div>
                                <Select
                                  value={event.conflictStrategy}
                                  onValueChange={(value: "skip" | "overwrite" | "create_new") =>
                                    handleConflictStrategyChange(index, value)
                                  }
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="skip">Saltar</SelectItem>
                                    <SelectItem value="overwrite">Sobrescribir</SelectItem>
                                    <SelectItem value="create_new">Crear nuevo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <span className="text-xs text-green-600">Nuevo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancelar
          </Button>
          {events.length > 0 && !importResult && (
            <Button onClick={handleImport} disabled={isImporting || selectedCount === 0}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {selectedCount} evento{selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
