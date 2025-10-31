import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, DollarSign, Truck } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await axios.get(`${API}/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      processing: { label: 'Processando', color: 'bg-blue-100 text-blue-800' },
      shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      returned: { label: 'Devolvido', color: 'bg-orange-100 text-orange-800' },
      payment_failed: { label: 'Pagamento Não Aprovado', color: 'bg-red-100 text-red-800' }
    };
    return statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return <div className="text-center py-12">Carregando pedidos...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
          <p className="text-gray-600 mb-4">Quando você fizer um pedido, ele aparecerá aqui</p>
          <Link to="/produtos" className="text-blue-600 hover:underline">Continuar comprando</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg mb-2">
                  Pedido #{order.order_number}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    R$ {order.total.toFixed(2)}
                  </div>
                </div>
              </div>
              <Badge className={getStatusBadge(order.status).color}>
                {getStatusBadge(order.status).label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Order Items */}
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity}x R$ {(item.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tracking */}
              {order.tracking_code && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Código de Rastreamento</span>
                  </div>
                  <p className="text-sm">{order.tracking_code}</p>
                </div>
              )}

              {/* Estimated Delivery */}
              {order.estimated_delivery && (
                <div className="text-sm text-gray-600">
                  📦 Previsão de entrega: {format(new Date(order.estimated_delivery), "dd/MM/yyyy")}
                </div>
              )}

              {/* Action Button */}
              <Link to={`/pedido/${order.id}`}>
                <button className="text-blue-600 hover:underline text-sm font-medium">
                  Ver detalhes do pedido →
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyOrders;