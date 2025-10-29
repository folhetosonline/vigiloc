import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ShoppingCart } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipcode: ""
    },
    shipping_method: "manual",
    shipping_cost: 0,
    payment_method: "pending",
    status: "pending",
    notes: "",
    items: []
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/admin/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: "", product_name: "", price: 0, quantity: 1, image: "" }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity: newItems[index].quantity || 1,
          image: product.image
        };
      }
    } else {
      newItems[index][field] = value;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal + formData.shipping_cost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    try {
      await axios.post(`${API}/admin/orders/create`, formData);
      toast.success("Pedido criado com sucesso!");
      navigate("/admin/orders");
    } catch (error) {
      toast.error("Erro ao criar pedido");
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Criar Pedido Manualmente</h1>
          <p className="text-gray-600">Registre um pedido realizado fora do sistema</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/orders")}>
          Voltar para Pedidos
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                <Input
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="João da Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  required
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  placeholder="joao@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefone *</label>
                <Input
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CEP *</label>
                <Input
                  required
                  value={formData.shipping_address.zipcode}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, zipcode: e.target.value }
                  })}
                  placeholder="12345-678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rua *</label>
                <Input
                  required
                  value={formData.shipping_address.street}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, street: e.target.value }
                  })}
                  placeholder="Rua Example"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Número *</label>
                <Input
                  required
                  value={formData.shipping_address.number}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, number: e.target.value }
                  })}
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Complemento</label>
                <Input
                  value={formData.shipping_address.complement}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, complement: e.target.value }
                  })}
                  placeholder="Apto 45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bairro *</label>
                <Input
                  required
                  value={formData.shipping_address.neighborhood}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, neighborhood: e.target.value }
                  })}
                  placeholder="Centro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cidade *</label>
                <Input
                  required
                  value={formData.shipping_address.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, city: e.target.value }
                  })}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estado *</label>
                <Input
                  required
                  value={formData.shipping_address.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    shipping_address: { ...formData.shipping_address, state: e.target.value }
                  })}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Itens do Pedido</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum item adicionado. Clique em "Adicionar Item" para começar.</p>
            )}
            
            {formData.items.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Produto *</label>
                    <Select 
                      value={item.product_id} 
                      onValueChange={(value) => updateItem(index, "product_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - R$ {product.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantidade *</label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subtotal</label>
                    <Input
                      disabled
                      value={`R$ ${(item.price * item.quantity).toFixed(2)}`}
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="mt-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Custo de Frete (R$)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Método de Pagamento</label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status do Pedido</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <textarea
                className="w-full p-2 border rounded min-h-[80px]"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais sobre o pedido..."
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total do Pedido:</span>
                <span className="text-green-600">R$ {calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/orders")} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Criar Pedido
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
