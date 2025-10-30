import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, ShoppingCart, TrendingUp, Users, Download,
  Calendar, Filter
} from "lucide-react";
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
import { format, subDays } from "date-fns";

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

const Reports = () => {
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90 days
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesData, setSalesData] = useState(null);
  const [crmData, setCrmData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch sales analytics
      const analyticsRes = await axios.get(`${API}/admin/analytics/dashboard`);
      setSalesData(analyticsRes.data);

      // Fetch CRM data
      const customersRes = await axios.get(`${API}/admin/crm/customers`);
      const paymentsRes = await axios.get(`${API}/admin/crm/payments`);
      const contractsRes = await axios.get(`${API}/admin/crm/contracts`);
      const ticketsRes = await axios.get(`${API}/admin/crm/tickets`);

      setCrmData({
        customers: customersRes.data,
        payments: paymentsRes.data,
        contracts: contractsRes.data,
        tickets: ticketsRes.data
      });
    } catch (error) {
      console.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + data;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salesChartData = {
    labels: salesData?.orders_by_day?.map(([date]) => format(new Date(date), 'dd/MM')) || [],
    datasets: [
      {
        label: 'Vendas (R$)',
        data: salesData?.orders_by_day?.map(([_, total]) => total) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const productChartData = {
    labels: salesData?.top_products?.map(([id]) => `Produto ${id.slice(0, 8)}`) || [],
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: salesData?.top_products?.map(([_, qty]) => qty) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ]
      }
    ]
  };

  const crmPaymentsStatus = crmData ? {
    labels: ['Pago', 'Pendente', 'Atrasado', 'Cancelado'],
    datasets: [{
      data: [
        crmData.payments.filter(p => p.status === 'paid').length,
        crmData.payments.filter(p => p.status === 'pending').length,
        crmData.payments.filter(p => p.status === 'overdue').length,
        crmData.payments.filter(p => p.status === 'cancelled').length,
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ]
    }]
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-gray-600">Análises detalhadas de vendas e CRM</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="crm">
            <Users className="w-4 h-4 mr-2" />
            CRM
          </TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {salesData?.revenue?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-gray-500">últimos {dateRange} dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.orders_count || 0}</div>
                <p className="text-xs text-gray-500">pedidos processados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(salesData?.orders_count > 0 ? salesData.revenue / salesData.orders_count : 0).toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">por pedido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.products_count || 0}</div>
                <p className="text-xs text-gray-500">itens únicos</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Vendas ao Longo do Tempo</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportToCSV("", "vendas")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <Line data={salesChartData} options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' }
                  }
                }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={productChartData} options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  }
                }} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CRM TAB */}
        <TabsContent value="crm" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmData?.customers?.length || 0}</div>
                <p className="text-xs text-gray-500">clientes cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crmData?.contracts?.filter(c => c.status === 'active').length || 0}
                </div>
                <p className="text-xs text-gray-500">de {crmData?.contracts?.length || 0} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crmData?.payments?.filter(p => p.status === 'pending').length || 0}
                </div>
                <p className="text-xs text-gray-500">aguardando pagamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crmData?.tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0}
                </div>
                <p className="text-xs text-gray-500">chamados ativos</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Status dos Pagamentos</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportToCSV("", "pagamentos_crm")}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent className="flex justify-center">
                {crmPaymentsStatus && (
                  <div style={{maxWidth: '300px'}}>
                    <Doughnut data={crmPaymentsStatus} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita Mensal Recorrente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded">
                    <span className="text-sm font-medium">MRR Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {(crmData?.contracts?.filter(c => c.status === 'active')
                        .reduce((sum, c) => sum + (c.monthly_value || 0), 0) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pagos este mês</span>
                      <span className="font-medium">
                        {crmData?.payments?.filter(p => p.status === 'paid').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pendentes</span>
                      <span className="font-medium text-orange-600">
                        {crmData?.payments?.filter(p => p.status === 'pending').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Atrasados</span>
                      <span className="font-medium text-red-600">
                        {crmData?.payments?.filter(p => p.status === 'overdue').length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
