import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Users, Building2, Mail, Phone, Search, User, UserPlus } from "lucide-react";

interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  departmentId: number | null;
  isFictional: boolean;
  avatar: string | null;
  notes: string | null;
}

interface Department {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
}

export default function Contacts() {
  const utils = trpc.useUtils();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    isFictional: false,
    notes: "",
  });

  const [departmentFormData, setDepartmentFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const { data: contacts, isLoading: contactsLoading } = trpc.contacts.list.useQuery();
  const { data: departments, isLoading: departmentsLoading } = trpc.departments.list.useQuery();

  const createContactMutation = trpc.contacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contacto creado exitosamente");
      utils.contacts.list.invalidate();
      setIsContactDialogOpen(false);
      resetContactForm();
    },
  });

  const updateContactMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contacto actualizado exitosamente");
      utils.contacts.list.invalidate();
      setIsContactDialogOpen(false);
      resetContactForm();
    },
  });

  const deleteContactMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contacto eliminado exitosamente");
      utils.contacts.list.invalidate();
      setIsContactDialogOpen(false);
      resetContactForm();
      setSelectedContact(null);
    },
  });

  const createDepartmentMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("Departamento creado exitosamente");
      utils.departments.list.invalidate();
      setIsDepartmentDialogOpen(false);
      resetDepartmentForm();
    },
  });

  const updateDepartmentMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("Departamento actualizado exitosamente");
      utils.departments.list.invalidate();
      setIsDepartmentDialogOpen(false);
      resetDepartmentForm();
    },
  });

  const deleteDepartmentMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("Departamento eliminado exitosamente");
      utils.departments.list.invalidate();
      setIsDepartmentDialogOpen(false);
      resetDepartmentForm();
      setSelectedDepartment(null);
    },
  });

  const resetContactForm = () => {
    setContactFormData({
      name: "",
      email: "",
      phone: "",
      departmentId: "",
      isFictional: false,
      notes: "",
    });
    setSelectedContact(null);
  };

  const resetDepartmentForm = () => {
    setDepartmentFormData({
      name: "",
      description: "",
      color: "#3b82f6",
    });
    setSelectedDepartment(null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactFormData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const data = {
      name: contactFormData.name,
      email: contactFormData.email || undefined,
      phone: contactFormData.phone || undefined,
      departmentId: contactFormData.departmentId ? parseInt(contactFormData.departmentId) : undefined,
      isFictional: contactFormData.isFictional,
      notes: contactFormData.notes || undefined,
    };

    if (selectedContact) {
      updateContactMutation.mutate({
        id: selectedContact.id,
        ...data,
      });
    } else {
      createContactMutation.mutate(data);
    }
  };

  const handleDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentFormData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const data = {
      name: departmentFormData.name,
      description: departmentFormData.description || undefined,
      color: departmentFormData.color,
    };

    if (selectedDepartment) {
      updateDepartmentMutation.mutate({
        id: selectedDepartment.id,
        ...data,
      });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      departmentId: contact.departmentId?.toString() || "",
      isFictional: contact.isFictional,
      notes: contact.notes || "",
    });
    setIsContactDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setDepartmentFormData({
      name: department.name,
      description: department.description || "",
      color: department.color || "#3b82f6",
    });
    setIsDepartmentDialogOpen(true);
  };

  const handleDeleteContact = () => {
    if (selectedContact) {
      if (confirm("¿Estás seguro de que quieres eliminar este contacto?")) {
        deleteContactMutation.mutate({ id: selectedContact.id });
      }
    }
  };

  const handleDeleteDepartment = () => {
    if (selectedDepartment) {
      if (confirm("¿Estás seguro de que quieres eliminar este departamento?")) {
        deleteDepartmentMutation.mutate({ id: selectedDepartment.id });
      }
    }
  };

  // Filter contacts
  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || 
      (filterDepartment === "none" && !contact.departmentId) ||
      contact.departmentId?.toString() === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getDepartmentName = (departmentId: number | null) => {
    if (!departmentId) return "Sin departamento";
    return departments?.find(d => d.id === departmentId)?.name || "Desconocido";
  };

  const getDepartmentColor = (departmentId: number | null) => {
    if (!departmentId) return "#9ca3af";
    return departments?.find(d => d.id === departmentId)?.color || "#3b82f6";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contactos</h1>
            <p className="text-gray-600 mt-1">
              Gestiona personas y departamentos
            </p>
          </div>
        </div>

        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts">
              <Users className="h-4 w-4 mr-2" />
              Contactos
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Building2 className="h-4 w-4 mr-2" />
              Departamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar contactos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="none">Sin departamento</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  resetContactForm();
                  setIsContactDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Contacto
              </Button>
            </div>

            {contactsLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredContacts && filteredContacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleEditContact(contact)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {contact.isFictional ? (
                              <UserPlus className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <span className="text-lg">{contact.name}</span>
                        </div>
                        {contact.isFictional && (
                          <Badge variant="secondary">Ficticio</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4" />
                        <Badge
                          style={{
                            backgroundColor: getDepartmentColor(contact.departmentId) + "20",
                            color: getDepartmentColor(contact.departmentId),
                            borderColor: getDepartmentColor(contact.departmentId),
                          }}
                          variant="outline"
                        >
                          {getDepartmentName(contact.departmentId)}
                        </Badge>
                      </div>
                      {contact.notes && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                          {contact.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Users className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay contactos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crea tu primer contacto para comenzar
                  </p>
                  <Button
                    onClick={() => {
                      resetContactForm();
                      setIsContactDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Contacto
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  resetDepartmentForm();
                  setIsDepartmentDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Departamento
              </Button>
            </div>

            {departmentsLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : departments && departments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((department) => {
                  const deptContacts = contacts?.filter(c => c.departmentId === department.id) || [];
                  return (
                    <Card
                      key={department.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleEditDepartment(department)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: department.color || "#3b82f6" }}
                          />
                          <span className="text-lg">{department.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {department.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {department.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
                          <Users className="h-4 w-4" />
                          <span>{deptContacts.length} contactos</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay departamentos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crea tu primer departamento para organizar contactos
                  </p>
                  <Button
                    onClick={() => {
                      resetDepartmentForm();
                      setIsDepartmentDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Departamento
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Contact Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleContactSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {selectedContact ? "Editar Contacto" : "Nuevo Contacto"}
                </DialogTitle>
                <DialogDescription>
                  {selectedContact
                    ? "Modifica los detalles del contacto"
                    : "Crea un nuevo contacto real o ficticio"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Nombre *</Label>
                  <Input
                    id="contact-name"
                    value={contactFormData.name}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, name: e.target.value })
                    }
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactFormData.email}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, email: e.target.value })
                      }
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-phone">Teléfono</Label>
                    <Input
                      id="contact-phone"
                      value={contactFormData.phone}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, phone: e.target.value })
                      }
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contact-department">Departamento</Label>
                  <Select
                    value={contactFormData.departmentId}
                    onValueChange={(value) =>
                      setContactFormData({ ...contactFormData, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin departamento</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="contact-fictional"
                    checked={contactFormData.isFictional}
                    onChange={(e) =>
                      setContactFormData({
                        ...contactFormData,
                        isFictional: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="contact-fictional" className="cursor-pointer">
                    Contacto ficticio (para recordatorios personales)
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contact-notes">Notas</Label>
                  <Textarea
                    id="contact-notes"
                    value={contactFormData.notes}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, notes: e.target.value })
                    }
                    placeholder="Información adicional..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedContact && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteContact}
                    disabled={deleteContactMutation.isPending}
                  >
                    Eliminar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsContactDialogOpen(false);
                    resetContactForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createContactMutation.isPending || updateContactMutation.isPending
                  }
                >
                  {createContactMutation.isPending || updateContactMutation.isPending
                    ? "Guardando..."
                    : selectedContact
                    ? "Actualizar"
                    : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Department Dialog */}
        <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleDepartmentSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {selectedDepartment ? "Editar Departamento" : "Nuevo Departamento"}
                </DialogTitle>
                <DialogDescription>
                  {selectedDepartment
                    ? "Modifica los detalles del departamento"
                    : "Crea un nuevo departamento"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dept-name">Nombre *</Label>
                  <Input
                    id="dept-name"
                    value={departmentFormData.name}
                    onChange={(e) =>
                      setDepartmentFormData({ ...departmentFormData, name: e.target.value })
                    }
                    placeholder="Nombre del departamento"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dept-description">Descripción</Label>
                  <Textarea
                    id="dept-description"
                    value={departmentFormData.description}
                    onChange={(e) =>
                      setDepartmentFormData({
                        ...departmentFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Detalles del departamento..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dept-color">Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="dept-color"
                      type="color"
                      value={departmentFormData.color}
                      onChange={(e) =>
                        setDepartmentFormData({
                          ...departmentFormData,
                          color: e.target.value,
                        })
                      }
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-gray-600">
                      {departmentFormData.color}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedDepartment && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteDepartment}
                    disabled={deleteDepartmentMutation.isPending}
                  >
                    Eliminar
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDepartmentDialogOpen(false);
                    resetDepartmentForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createDepartmentMutation.isPending ||
                    updateDepartmentMutation.isPending
                  }
                >
                  {createDepartmentMutation.isPending ||
                  updateDepartmentMutation.isPending
                    ? "Guardando..."
                    : selectedDepartment
                    ? "Actualizar"
                    : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
