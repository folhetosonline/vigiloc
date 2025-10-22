import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, MonitorSmartphone } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    contract_id: "",
    equipment_type: "",
    brand: "",
    model: "",
    serial_number: "",
    installation_date: "",
    warranty_until: "",
    status: "active",
    location: "",
    notes: ""
  });

  useEffect(() => {
    fetchEquipment();
    fetchCustomers();
    fetchContracts();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`${API}/admin/equipment`);
      setEquipment(response.data);
    } catch (error) {
      toast.error("Erro ao carregar equipamentos");
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

  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API}/admin/contracts`);
      setContracts(response.data);
    } catch (error) {
      toast.error("Erro ao carregar contratos");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        installation_date: new Date(formData.installation_date).toISOString(),
        warranty_until: formData.warranty_until ? new Date(formData.warranty_until).toISOString() : null
      };

      if (editingEquipment) {
        await axios.put(`${API}/admin/equipment/${editingEquipment.id}`, payload);
        toast.success("Equipamento atualizado com sucesso");
      } else {
        await axios.post(`${API}/admin/equipment`, payload);
        toast.success("Equipamento criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchEquipment();
    } catch (error) {
      toast.error("Erro ao salvar equipamento");
    }
  };

  const handleEdit = (eq) => {
    setEditingEquipment(eq);
    setFormData({
      customer_id: eq.customer_id,
      contract_id: eq.contract_id,
      equipment_type: eq.equipment_type,
      brand: eq.brand,
      model: eq.model,
      serial_number: eq.serial_number,
      installation_date: eq.installation_date ? eq.installation_date.split('T')[0] : "",
      warranty_until: eq.warranty_until ? eq.warranty_until.split('T')[0] : "",
      status: eq.status,
      location: eq.location,
      notes: eq.notes || ""
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      contract_id: "",
      equipment_type: "",
      brand: "",
      model: "",
      serial_number: "",
      installation_date: "",
      warranty_until: "",
      status: "active",
      location: "",
      notes: ""
    });
    setEditingEquipment(null);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "N/A";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      inactive: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: "Ativo",
      maintenance: "Manutenção",
      inactive: "Inativo"
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Equipamentos</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEquipment ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
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
                  <label className="block text-sm font-medium mb-2">Contrato *</label>
                  <Select required value={formData.contract_id} onValueChange={(value) => setFormData({...formData, contract_id: value})}>
                    <SelectTrigger><SelectValue placeholder="Selecione um contrato" /></SelectTrigger>
                    <SelectContent>
                      {contracts.filter(c => c.customer_id === formData.customer_id).map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>{contract.contract_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Equipamento *</label>
                  <Input required value={formData.equipment_type} onChange={(e) => setFormData({...formData, equipment_type: e.target.value})} placeholder="Ex: Câmera IP, Totem" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Marca *</label>
                  <Input required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Modelo *</label>
                  <Input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">N° de Série *</label>
                  <Input required value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Data Instalação *</label>
                  <Input type="date" required value={formData.installation_date} onChange={(e) => setFormData({...formData, installation_date: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Garantia Até</label>
                  <Input type="date" value={formData.warranty_until} onChange={(e) => setFormData({...formData, warranty_until: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Localização *</label>
                  <Input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Ex: Portaria, Estacionamento" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Observações</label>
                  <textarea className="w-full p-2 border rounded" rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>

              <Button type="submit" className="w-full">{editingEquipment ? "Atualizar" : "Criar"} Equipamento</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>N° Série</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{getCustomerName(eq.customer_id)}</TableCell>
                  <TableCell>{eq.equipment_type}</TableCell>
                  <TableCell>{eq.brand} {eq.model}</TableCell>
                  <TableCell className="text-sm text-gray-600">{eq.serial_number}</TableCell>
                  <TableCell>{eq.location}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(eq.status)}>{getStatusLabel(eq.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="outline" onClick={() => handleEdit(eq)}>
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

export default Equipment;