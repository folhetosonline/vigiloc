import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users, DollarSign, Wrench, FileText } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const CRMDashboard = () => {
  const [stats, setStats] = useState({
    total_customers: 0,
    active_customers: 0,
    suspended_customers: 0,
    total_contracts: 0,
    monthly_revenue: 0,
    pending_payments: 0,
    open_tickets: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customers, contracts, payments, tickets] = await Promise.all([
        axios.get(`${API}/admin/customers`),
        axios.get(`${API}/admin/contracts`),
        axios.get(`${API}/admin/payments?status=pending`),
        axios.get(`${API}/admin/tickets?status=open`)
      ]);

      const activeCustomers = customers.data.filter(c => c.status === 'active').length;
      const suspendedCustomers = customers.data.filter(c => c.status === 'suspended').length;
      const monthlyRevenue = contracts.data.reduce((sum, c) => sum + (c.status === 'active' ? c.monthly_value : 0), 0);

      setStats({
        total_customers: customers.data.length,
        active_customers: activeCustomers,
        suspended_customers: suspendedCustomers,
        total_contracts: contracts.data.length,
        monthly_revenue: monthlyRevenue,
        pending_payments: payments.data.length,
        open_tickets: tickets.data.length
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Ativos</p>
                <p className="text-3xl font-bold text-green-600">{stats.active_customers}</p>
                <p className="text-xs text-gray-500">de {stats.total_customers} total</p>
              </div>
              <Users className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Mensal</p>
                <p className="text-3xl font-bold text-blue-600">R$ {(stats.monthly_revenue || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500">{stats.total_contracts} contratos</p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pagamentos Pendentes</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending_payments}</p>
                <p className="text-xs text-gray-500">aguardando confirmação</p>
              </div>
              <FileText className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chamados Abertos</p>
                <p className="text-3xl font-bold text-red-600">{stats.open_tickets}</p>
                <p className="text-xs text-gray-500">requerem atenção</p>
              </div>
              <Wrench className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.suspended_customers > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-600 text-white rounded-full p-2 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-red-900">{stats.suspended_customers} clientes suspensos</p>
                <p className="text-sm text-red-700">Clientes com pagamento em atraso necessitam atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.location.href = '/admin/crm/customers'}>
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Clientes
              </Button>
              <Button className="w-full" variant="outline" onClick={() => window.location.href = '/admin/crm/contracts'}>
                <FileText className="mr-2 h-4 w-4" />
                Ver Contratos
              </Button>
              <Button className="w-full" variant="outline" onClick={() => window.location.href = '/admin/crm/payments'}>
                <DollarSign className="mr-2 h-4 w-4" />
                Gestão de Pagamentos
              </Button>
              <Button className="w-full" variant="outline" onClick={() => window.location.href = '/admin/crm/tickets'}>
                <Wrench className="mr-2 h-4 w-4" />
                Chamados de Manutenção
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Automações</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Lembretes de Pagamento</span>
                <Badge>Automático</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Avisos de Atraso (3 dias)</span>
                <Badge>Automático</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">Avisos de Suspensão (10 dias)</span>
                <Badge variant="destructive">Automático</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboard;