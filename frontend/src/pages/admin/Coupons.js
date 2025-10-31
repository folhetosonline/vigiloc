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
import { format } from "date-fns";

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_purchase: 0,
    max_uses: null,
    expires_at: ""
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/admin/coupons`);
      setCoupons(response.data);
    } catch (error) {
      toast.error("Erro ao carregar cupons");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCoupon) {
        await axios.put(`${API}/admin/coupons/${editingCoupon.id}`, formData);
        toast.success("Cupom atualizado com sucesso");
      } else {
        await axios.post(`${API}/admin/coupons`, formData);
        toast.success("Cupom criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar cupom");
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_uses: coupon.max_uses,
      expires_at: coupon.expires_at ? format(new Date(coupon.expires_at), "yyyy-MM-dd'T'HH:mm") : ""
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar este cupom?")) return;

    try {
      await axios.delete(`${API}/admin/coupons/${id}`);
      toast.success("Cupom deletado com sucesso");
      fetchCoupons();
    } catch (error) {
      toast.error("Erro ao deletar cupom");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 0,
      min_purchase: 0,
      max_uses: null,
      expires_at: ""
    });
    setEditingCoupon(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Código</label>
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="EX: DESCONTO10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Desconto</label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Valor do Desconto {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Compra Mínima (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Máximo de Usos (opcional)</label>
                <Input
                  type="number"
                  value={formData.max_uses || ""}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data de Expiração (opcional)</label>
                <Input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingCoupon ? "Atualizar" : "Criar"} Cupom
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
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Min. Compra</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>{coupon.discount_type === 'percentage' ? 'Percentual' : 'Fixo'}</TableCell>
                  <TableCell>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${(coupon.discount_value || 0).toFixed(2)}`}
                  </TableCell>
                  <TableCell>R$ {(coupon.min_purchase || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {coupon.uses_count} / {coupon.max_uses || '∞'}
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? format(new Date(coupon.expires_at), "dd/MM/yyyy HH:mm") : 'Sem expiração'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="icon" variant="outline" onClick={() => handleEdit(coupon)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(coupon.id)}>
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

export default Coupons;
