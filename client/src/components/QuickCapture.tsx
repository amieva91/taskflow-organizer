import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, Check, Calendar, ArrowRight, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCapture({ isOpen, onClose }: QuickCaptureProps) {
  const [newNote, setNewNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const utils = trpc.useUtils();

  // Query para obtener notas del día seleccionado
  const { data: notes = [] } = trpc.quickNotes.getByDate.useQuery(
    { date: selectedDate },
    { enabled: isOpen }
  );

  // Mutations
  const createMutation = trpc.quickNotes.create.useMutation({
    onSuccess: () => {
      utils.quickNotes.getByDate.invalidate();
      setNewNote("");
      toast.success("Nota añadida");
    },
  });

  const toggleMutation = trpc.quickNotes.toggle.useMutation({
    onSuccess: () => {
      utils.quickNotes.getByDate.invalidate();
    },
  });

  const deleteMutation = trpc.quickNotes.delete.useMutation({
    onSuccess: () => {
      utils.quickNotes.getByDate.invalidate();
      toast.success("Nota eliminada");
    },
  });

  const moveMutation = trpc.quickNotes.moveToDate.useMutation({
    onSuccess: () => {
      utils.quickNotes.getByDate.invalidate();
      toast.success("Nota movida al día siguiente");
    },
  });

  const updateMutation = trpc.quickNotes.updateContent.useMutation({
    onSuccess: () => {
      utils.quickNotes.getByDate.invalidate();
      setEditingNoteId(null);
      setEditingContent("");
      toast.success("Nota actualizada");
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    createMutation.mutate({
      content: newNote,
      date: selectedDate,
    });
  };

  const handleToggle = (noteId: number) => {
    toggleMutation.mutate({ noteId });
  };

  const handleDelete = (noteId: number) => {
    if (confirm("¿Eliminar esta nota?")) {
      deleteMutation.mutate({ noteId });
    }
  };

  const handleMoveToTomorrow = (noteId: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    moveMutation.mutate({
      noteId,
      newDate: format(tomorrow, "yyyy-MM-dd"),
    });
  };

  const handleStartEdit = (noteId: number, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingContent.trim()) {
      updateMutation.mutate({
        noteId: editingNoteId,
        content: editingContent,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent("");
  };

  // Atajo de teclado Escape para cerrar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const pendingNotes = notes.filter((n) => n.isCompleted === 0);
  const completedNotes = notes.filter((n) => n.isCompleted === 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Captura Rápida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de fecha */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <span className="text-sm text-muted-foreground">
              {format(new Date(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}
            </span>
          </div>

          {/* Formulario para añadir nota */}
          <form onSubmit={handleAddNote} className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe algo rápido..."
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              <Plus className="w-4 h-4 mr-1" />
              Añadir
            </Button>
          </form>

          {/* Lista de notas pendientes */}
          {pendingNotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Pendientes ({pendingNotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => handleToggle(note.id)}
                      className="mt-1"
                    />
                    
                    {editingNoteId === note.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{note.content}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(note.id, note.content)}
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveToTomorrow(note.id)}
                            title="Mover a mañana"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(note.id)}
                            title="Eliminar"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Lista de notas completadas */}
          {completedNotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completadas ({completedNotes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggle(note.id)}
                      className="mt-1"
                    />
                    <span className="flex-1 text-sm line-through text-muted-foreground">
                      {note.content}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {notes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No hay notas para este día</p>
              <p className="text-sm">Añade algo rápido arriba</p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Presiona <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> para cerrar
        </div>
      </DialogContent>
    </Dialog>
  );
}
