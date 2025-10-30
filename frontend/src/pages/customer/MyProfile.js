import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const MyProfile = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    cpf: user?.cpf || "",
    address: {
      street: user?.address?.street || "",
      number: user?.address?.number || "",
      complement: user?.address?.complement || "",
      neighborhood: user?.address?.neighborhood || "",
      city: user?.address?.city || "",
      state: user?.address?.state || "",
      zip: user?.address?.zip || ""
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('customer_token');
      await axios.put(`${API}/customer/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Perfil atualizado com sucesso!');
      onUpdate({ ...user, ...formData });
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              value={user?.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome Completo</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Telefone</label>
            <Input
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">CPF</label>
            <Input
              required
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">CEP</label>
                <Input
                  value={formData.address.zip}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, zip: e.target.value }
                  })}
                  placeholder="00000-000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Rua</label>
                <Input
                  value={formData.address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, street: e.target.value }
                  })}
                  placeholder="Nome da rua"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Número</label>
                <Input
                  value={formData.address.number}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, number: e.target.value }
                  })}
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Complemento</label>
                <Input
                  value={formData.address.complement}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, complement: e.target.value }
                  })}
                  placeholder="Apto, Bloco..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Bairro</label>
                <Input
                  value={formData.address.neighborhood}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, neighborhood: e.target.value }
                  })}
                  placeholder="Nome do bairro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cidade</label>
                <Input
                  value={formData.address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: e.target.value }
                  })}
                  placeholder="Nome da cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <Input
                  value={formData.address.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, state: e.target.value }
                  })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MyProfile;