import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      const url = filterStatus === "all" ? `${API}/admin/payments` : `${API}/admin/payments?status=${filterStatus}`;
      const response = await axios.get(url);
      setPayments(response.data);
    } catch (error) {
      toast.error("Erro ao carregar pagamentos");
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

  const handleGenerateMonthly = async () => {
    try {
      const response = await axios.post(`${API}/admin/payments/generate-monthly`);
      toast.success(response.data.message);
      fetchPayments();
    } catch (error) {
      toast.error("Erro ao gerar pagamentos mensais");
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;
    try {
      await axios.post(`${API}/admin/payments/${selectedPayment.id}/mark-paid`, null, {
        params: { payment_method: paymentMethod }
      });
      toast.success("Pagamento marcado como pago");
      setOpen(false);
      fetchPayments();
    } catch (error) {
      toast.error("Erro ao marcar pagamento");
    }
  };

  const openMarkPaidDialog = (payment) => {
    setSelectedPayment(payment);
    setOpen(true);
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "N/A";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendente",
      paid: "Pago",
      overdue: "Atrasado",
      cancelled: "Cancelado"
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="overdue">Atrasados</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateMonthly}>
            <RefreshCw className="mr-2 w-4 h-4" />
            Gerar Mensalidades
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Chave Pix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.invoice_number}</TableCell>
                  <TableCell>{getCustomerName(payment.customer_id)}</TableCell>
                  <TableCell>R$ {(payment.amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{formatDate(payment.due_date)}</TableCell>
                  <TableCell className="text-sm text-gray-600">{payment.pix_key || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>{getStatusLabel(payment.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {payment.status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => openMarkPaidDialog(payment)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Marcar Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{selectedPayment && getCustomerName(selectedPayment.customer_id)}</span></p>
              <p className="text-sm text-gray-600">Valor: <span className="font-medium">R$ {(selectedPayment?.amount || 0).toFixed(2)}</span></p>
              <p className="text-sm text-gray-600">Fatura: <span className="font-medium">{selectedPayment?.invoice_number}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Método de Pagamento</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMarkPaid} className="w-full">
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;