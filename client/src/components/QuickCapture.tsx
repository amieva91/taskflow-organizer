import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, Check, Calendar, ArrowRight, Edit2, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SortableNoteProps {
  note: any;
  editingNoteId: number | null;
  editingContent: string;
  onToggle: (id: number) => void;
  onStartEdit: (id: number, content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onMoveToTomorrow: (id: number) => void;
  onDelete: (id: number) => void;
  setEditingContent: (content: string) => void;
}

function SortableNote({
  note,
  editingNoteId,
  editingContent,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onMoveToTomorrow,
  onDelete,
  setEditingContent,
}: SortableNoteProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        checked={note.isCompleted === 1}
        onCheckedChange={() => onToggle(note.id)}
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
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <Button size="sm" variant="ghost" onClick={onSaveEdit}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className={`flex-1 text-sm ${note.isCompleted === 1 ? 'line-through text-muted-foreground' : ''}`}>
            {note.content}
          </span>
          {note.isCompleted === 0 && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStartEdit(note.id, note.content)}
                title="Editar"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveToTomorrow(note.id)}
                title="Mover a mañana"
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(note.id)}
                title="Eliminar"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          {note.isCompleted === 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Eliminar"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function QuickCapture({ isOpen, onClose }: QuickCaptureProps) {
  const [newNote, setNewNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [localNotes, setLocalNotes] = useState<any[]>([]);

  const utils = trpc.useUtils();

  // Query para obtener notas del día seleccionado
  const { data: notes = [] } = trpc.quickNotes.getByDate.useQuery(
    { date: selectedDate },
    { enabled: isOpen }
  );

  // Actualizar notas locales cuando cambien las del servidor
  useEffect(() => {
    if (JSON.stringify(notes) !== JSON.stringify(localNotes)) {
      setLocalNotes(notes);
    }
  }, [notes]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const reorderMutation = trpc.quickNotes.reorder.useMutation({
    onSuccess: () => {
      utils.quickNotes.getByDate.invalidate();
      toast.success("Orden actualizado");
    },
  });

  // Configurar sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localNotes.findIndex((note) => note.id === active.id);
    const newIndex = localNotes.findIndex((note) => note.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Actualizar orden local inmediatamente
    const newNotes = arrayMove(localNotes, oldIndex, newIndex);
    setLocalNotes(newNotes);

    // Crear array de nuevos órdenes
    const noteOrders = newNotes.map((note, index) => ({
      noteId: note.id,
      sortOrder: index,
    }));

    // Enviar al servidor
    reorderMutation.mutate({ noteOrders });
  };

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

  const pendingNotes = localNotes.filter((n) => n.isCompleted === 0);
  const completedNotes = localNotes.filter((n) => n.isCompleted === 1);

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

          {/* Lista de notas pendientes con drag-and-drop */}
          {pendingNotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Pendientes ({pendingNotes.length})
                  <span className="text-xs text-muted-foreground ml-2">
                    Arrastra para reordenar
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pendingNotes.map((n) => n.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {pendingNotes.map((note) => (
                      <SortableNote
                        key={note.id}
                        note={note}
                        editingNoteId={editingNoteId}
                        editingContent={editingContent}
                        onToggle={handleToggle}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onMoveToTomorrow={handleMoveToTomorrow}
                        onDelete={handleDelete}
                        setEditingContent={setEditingContent}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* Lista de notas completadas (sin drag-and-drop) */}
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

          {localNotes.length === 0 && (
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
