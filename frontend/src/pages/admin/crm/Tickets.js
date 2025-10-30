import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Wrench } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formData, setFormData] = useState({
    customer_id: "",
    equipment_id: "",
    title: "",
    description: "",
    priority: "medium",
    status: "open",
    assigned_to: ""
  });

  useEffect(() => {
    fetchTickets();
    fetchCustomers();
    fetchEquipment();
  }, [filterStatus]);

  const fetchTickets = async () => {
    try {
      const url = filterStatus === "all" ? `${API}/admin/tickets` : `${API}/admin/tickets?status=${filterStatus}`;
      const response = await axios.get(url);
      setTickets(response.data);
    } catch (error) {
      toast.error("Erro ao carregar chamados");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/admin/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API}/admin/equipment`);
      setEquipment(response.data);
    } catch (error) {
      toast.error("Erro ao carregar equipamentos");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTicket) {
        await axios.put(`${API}/admin/tickets/${editingTicket.id}`, formData);
        toast.success("Chamado atualizado com sucesso");
      } else {
        await axios.post(`${API}/admin/tickets`, formData);
        toast.success("Chamado criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchTickets();
    } catch (error) {
      toast.error("Erro ao salvar chamado");
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      customer_id: ticket.customer_id,
      equipment_id: ticket.equipment_id || "none",
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assigned_to: ticket.assigned_to || ""
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      equipment_id: "none",
      title: "",
      description: "",
      priority: "medium",
      status: "open",
      assigned_to: ""
    });
    setEditingTicket(null);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "N/A";
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: "Aberto",
      in_progress: "Em Progresso",
      resolved: "Resolvido",
      closed: "Fechado"
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente"
    };
    return labels[priority] || priority;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Chamados de Manutenção</h1>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTicket ? "Editar Chamado" : "Novo Chamado"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Cliente *</label>
                    <Select required value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                      <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Equipamento (Opcional)</label>
                    <Select value={formData.equipment_id || "none"} onValueChange={(value) => setFormData({...formData, equipment_id: value === "none" ? "" : value})}>
                      <SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {equipment.filter(eq => eq.customer_id === formData.customer_id).map(eq => (
                          <SelectItem key={eq.id} value={eq.id}>{eq.equipment_type} - {eq.serial_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Título *</label>
                    <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Descrição *</label>
                    <textarea className="w-full p-2 border rounded" rows="4" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Prioridade *</label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Atribuído a</label>
                    <Input value={formData.assigned_to} onChange={(e) => setFormData({...formData, assigned_to: e.target.value})} placeholder="Nome do técnico" />
                  </div>
                </div>

                <Button type="submit" className="w-full">{editingTicket ? "Atualizar" : "Criar"} Chamado</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Chamado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                  <TableCell>{getCustomerName(ticket.customer_id)}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="outline" onClick={() => handleEdit(ticket)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tickets;