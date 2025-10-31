import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    address: "",
    city: "",
    state: "",
    cep: "",
    shipping_method: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    fetchShippingRates();
  }, []);

  const fetchCart = async () => {
    try {
      const sessionId = localStorage.getItem("cart_session_id");
      const response = await axios.get(`${API}/cart?session_id=${sessionId}`);
      setCart(response.data);
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
    }
  };

  const fetchShippingRates = async () => {
    try {
      const response = await axios.get(`${API}/shipping/rates`);
      setShippingRates(response.data);
    } catch (error) {
      console.error("Erro ao carregar fretes:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionId = localStorage.getItem("cart_session_id");
      const orderData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          cep: formData.cep
        },
        shipping_method: formData.shipping_method,
        notes: formData.notes
      };

      const response = await axios.post(`${API}/orders?session_id=${sessionId}`, orderData);
      toast.success("Pedido realizado com sucesso!");
      
      // Redirect to WhatsApp
      const message = `Olá! Gostaria de confirmar meu pedido #${response.data.order_number}`;
      window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, "_blank");
      
      navigate("/");
    } catch (error) {
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  };

  const getSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  };

  const getShippingCost = () => {
    const rate = shippingRates.find(r => r.id === formData.shipping_method);
    return rate && rate.price ? rate.price : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo</label>
                <Input
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <Input
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">CEP</label>
                <Input
                  required
                  value={formData.cep}
                  onChange={(e) => setFormData({...formData, cep: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Endereço</label>
                <Input
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <Input
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado</label>
                  <Input
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forma de Envio</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.shipping_method} onValueChange={(value) => setFormData({...formData, shipping_method: value})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o frete" />
                </SelectTrigger>
                <SelectContent>
                  {shippingRates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      {rate.name} - R$ {rate.price.toFixed(2)} ({rate.min_days}-{rate.max_days} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Alguma observação sobre o pedido?"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>R$ {getShippingCost().toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">R$ {(getSubtotal() + getShippingCost()).toFixed(2)}</span>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : "Finalizar Pedido"}
              </Button>
              <p className="text-sm text-gray-600 mt-4 text-center">
                Após finalizar, você será direcionado ao WhatsApp para confirmar o pagamento
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Checkout;