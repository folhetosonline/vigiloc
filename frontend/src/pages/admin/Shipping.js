import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const Shipping = () => {
  const [rates, setRates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "fixed",
    price: 0,
    min_days: 0,
    max_days: 0,
    active: true
  });

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API}/shipping/rates`);
      setRates(response.data);
    } catch (error) {
      toast.error("Erro ao carregar taxas de frete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingRate) {
        await axios.put(`${API}/admin/shipping/rates/${editingRate.id}`, formData);
        toast.success("Taxa atualizada com sucesso");
      } else {
        await axios.post(`${API}/admin/shipping/rates`, formData);
        toast.success("Taxa criada com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchRates();
    } catch (error) {
      toast.error("Erro ao salvar taxa");
    }
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      name: rate.name,
      type: rate.type,
      price: rate.price,
      min_days: rate.min_days,
      max_days: rate.max_days,
      active: rate.active
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar esta taxa?")) return;

    try {
      await axios.delete(`${API}/admin/shipping/rates/${id}`);
      toast.success("Taxa deletada com sucesso");
      fetchRates();
    } catch (error) {
      toast.error("Erro ao deletar taxa");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "fixed",
      price: 0,
      min_days: 0,
      max_days: 0,
      active: true
    });
    setEditingRate(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Taxas de Frete</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Nova Taxa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRate ? "Editar Taxa" : "Nova Taxa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PAC, SEDEX, Frete Grátis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                    <SelectItem value="free">Grátis</SelectItem>
                    <SelectItem value="cep">Por CEP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preço</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dias Mín</label>
                  <Input
                    type="number"
                    required
                    value={formData.min_days}
                    onChange={(e) => setFormData({ ...formData, min_days: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Dias Máx</label>
                  <Input
                    type="number"
                    required
                    value={formData.max_days}
                    onChange={(e) => setFormData({ ...formData, max_days: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <label>Ativo</label>
              </div>

              <Button type="submit" className="w-full">
                {editingRate ? "Atualizar" : "Criar"} Taxa
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.name}</TableCell>
                  <TableCell>{rate.type}</TableCell>
                  <TableCell>R$ {(rate.price || 0).toFixed(2)}</TableCell>
                  <TableCell>{rate.min_days || 0}-{rate.max_days || 0} dias</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${rate.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rate.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="icon" variant="outline" onClick={() => handleEdit(rate)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(rate.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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

export default Shipping;