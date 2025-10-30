import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, Eye } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics/dashboard`);
      setAnalytics(response.data);
    } catch (error) {
      console.error("Erro ao carregar analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  // Chart data
  const salesChartData = {
    labels: Object.keys(analytics?.daily_sales || {}).reverse(),
    datasets: [
      {
        label: 'Vendas Diárias (R$)',
        data: Object.values(analytics?.daily_sales || {}).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(analytics?.total_revenue || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias: R$ {(analytics?.revenue_30d || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias: {analytics?.orders_30d || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_products || 0}</div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_customers || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
              Vendas Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={salesChartData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-purple-500" />
              Top 5 Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.top_products?.length > 0 ? (
                analytics.top_products.map(([productId, quantity], index) => (
                  <div key={productId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium">Produto ID: {productId.slice(0, 8)}</span>
                    </div>
                    <span className="text-sm text-gray-600">{quantity} vendidos</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhuma venda ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Novo Produto</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Ver Pedidos</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">Clientes</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-sm font-medium">Ver Site</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;