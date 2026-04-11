import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, FileText } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    service_type: "complete",
    monthly_value: "",
    installation_value: "",
    start_date: "",
    end_date: "",
    payment_day: "10",
    status: "active",
    notes: ""
  });

  useEffect(() => {
    fetchContracts();
    fetchCustomers();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API}/admin/contracts`);
      setContracts(response.data);
    } catch (error) {
      toast.error("Erro ao carregar contratos");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        monthly_value: parseFloat(formData.monthly_value),
        installation_value: parseFloat(formData.installation_value),
        payment_day: parseInt(formData.payment_day),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      if (editingContract) {
        await axios.put(`${API}/admin/contracts/${editingContract.id}`, payload);
        toast.success("Contrato atualizado com sucesso");
      } else {
        await axios.post(`${API}/admin/contracts`, payload);
        toast.success("Contrato criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      toast.error("Erro ao salvar contrato");
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      customer_id: contract.customer_id,
      service_type: contract.service_type,
      monthly_value: contract.monthly_value.toString(),
      installation_value: contract.installation_value.toString(),
      start_date: contract.start_date ? contract.start_date.split('T')[0] : "",
      end_date: contract.end_date ? contract.end_date.split('T')[0] : "",
      payment_day: contract.payment_day.toString(),
      status: contract.status,
      notes: contract.notes || ""
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      service_type: "complete",
      monthly_value: "",
      installation_value: "",
      start_date: "",
      end_date: "",
      payment_day: "10",
      status: "active",
      notes: ""
    });
    setEditingContract(null);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "N/A";
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getServiceTypeLabel = (type) => {
    const labels = {
      totem: "Totem",
      camera: "Câmera",
      access_control: "Controle de Acesso",
      complete: "Completo"
    };
    return labels[type] || type;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
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

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Serviço *</label>
                  <Select value={formData.service_type} onValueChange={(value) => setFormData({...formData, service_type: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totem">Totem</SelectItem>
                      <SelectItem value="camera">Câmera</SelectItem>
                      <SelectItem value="access_control">Controle de Acesso</SelectItem>
                      <SelectItem value="complete">Completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status *</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="completed">Completo</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Valor Mensal (R$) *</label>
                  <Input type="number" step="0.01" required value={formData.monthly_value} onChange={(e) => setFormData({...formData, monthly_value: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Valor Instalação (R$) *</label>
                  <Input type="number" step="0.01" required value={formData.installation_value} onChange={(e) => setFormData({...formData, installation_value: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Data Início *</label>
                  <Input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Data Fim</label>
                  <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Dia do Pagamento *</label>
                  <Input type="number" min="1" max="31" required value={formData.payment_day} onChange={(e) => setFormData({...formData, payment_day: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Observações</label>
                  <textarea className="w-full p-2 border rounded" rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>

              <Button type="submit" className="w-full">{editingContract ? "Atualizar" : "Criar"} Contrato</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Valor Mensal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contract_number}</TableCell>
                  <TableCell>{getCustomerName(contract.customer_id)}</TableCell>
                  <TableCell>{getServiceTypeLabel(contract.service_type)}</TableCell>
                  <TableCell>R$ {(contract.monthly_value || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="outline" onClick={() => handleEdit(contract)}>
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

export default Contracts;