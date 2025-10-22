import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, Clock, CheckCircle, XCircle, Copy } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchCustomers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/admin/notifications`);
      setNotifications(response.data);
    } catch (error) {
      toast.error("Erro ao carregar notificações");
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

  const handleSendReminders = async () => {
    try {
      const response = await axios.post(`${API}/admin/notifications/send-payment-reminders`);
      toast.success(response.data.message);
      fetchNotifications();
    } catch (error) {
      toast.error("Erro ao enviar lembretes");
    }
  };

  const handleSendOverdueNotices = async () => {
    try {
      const response = await axios.post(`${API}/admin/notifications/send-overdue-notices`);
      toast.success(response.data.message);
      fetchNotifications();
    } catch (error) {
      toast.error("Erro ao enviar avisos de atraso");
    }
  };

  const handleSendSuspensionWarnings = async () => {
    try {
      const response = await axios.post(`${API}/admin/notifications/send-suspension-warnings`);
      toast.success(response.data.message);
      fetchNotifications();
    } catch (error) {
      toast.error("Erro ao enviar avisos de suspensão");
    }
  };

  const getCustomer = (customerId) => {
    return customers.find(c => c.id === customerId);
  };

  const openWhatsAppDialog = (notif) => {
    const customer = getCustomer(notif.customer_id);
    setSelectedNotif({ ...notif, customer });
    setOpen(true);
  };

  const copyWhatsAppNumber = () => {
    if (selectedNotif?.customer?.whatsapp) {
      navigator.clipboard.writeText(selectedNotif.customer.whatsapp);
      toast.success("Número copiado!");
    }
  };

  const copyMessage = () => {
    if (selectedNotif?.message) {
      navigator.clipboard.writeText(selectedNotif.message);
      toast.success("Mensagem copiada!");
    }
  };

  const openWhatsApp = () => {
    if (selectedNotif?.customer?.whatsapp && selectedNotif?.message) {
      const url = `https://wa.me/${selectedNotif.customer.whatsapp}?text=${encodeURIComponent(selectedNotif.message)}`;
      window.open(url, '_blank');
      toast.success("WhatsApp aberto!");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeColor = (type) => {
    const colors = {
      payment_reminder: "bg-blue-100 text-blue-800",
      overdue: "bg-orange-100 text-orange-800",
      suspension: "bg-red-100 text-red-800",
      order: "bg-green-100 text-green-800",
      ticket: "bg-purple-100 text-purple-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type) => {
    const labels = {
      payment_reminder: "Lembrete de Pagamento",
      overdue: "Aviso de Atraso",
      suspension: "Aviso de Suspensão",
      order: "Pedido",
      ticket: "Chamado"
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notificações</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Lembretes de Pagamento
            </h3>
            <p className="text-sm text-gray-600 mb-4">Enviar lembretes 1 dia antes do vencimento</p>
            <Button onClick={handleSendReminders} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Enviar Lembretes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <Bell className="mr-2 h-5 w-5 text-orange-600" />
              Avisos de Atraso
            </h3>
            <p className="text-sm text-gray-600 mb-4">Enviar avisos 3 dias após vencimento</p>
            <Button onClick={handleSendOverdueNotices} className="w-full" variant="outline">
              <Send className="mr-2 h-4 w-4" />
              Enviar Avisos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-red-600" />
              Avisos de Suspensão
            </h3>
            <p className="text-sm text-gray-600 mb-4">Enviar avisos 10 dias após vencimento</p>
            <Button onClick={handleSendSuspensionWarnings} className="w-full" variant="destructive">
              <Send className="mr-2 h-4 w-4" />
              Enviar Avisos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Histórico de Notificações</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => {
                const customer = getCustomer(notif.customer_id);
                return (
                  <TableRow key={notif.id}>
                    <TableCell className="text-sm">{formatDate(notif.created_at)}</TableCell>
                    <TableCell className="font-medium">{customer?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(notif.type)}>{getTypeLabel(notif.type)}</Badge>
                    </TableCell>
                    <TableCell className="uppercase text-sm">{notif.channel}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{notif.message}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(notif.status)}>{notif.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {notif.channel === "whatsapp" && (
                        <Button size="sm" variant="outline" onClick={() => openWhatsAppDialog(notif)}>
                          Enviar WhatsApp
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar via WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium mb-1">Cliente</p>
              <p className="text-lg">{selectedNotif?.customer?.name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Número WhatsApp</p>
                <Button size="sm" variant="ghost" onClick={copyWhatsAppNumber}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <p className="text-lg font-mono">{selectedNotif?.customer?.whatsapp}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Mensagem</p>
                <Button size="sm" variant="ghost" onClick={copyMessage}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <p className="whitespace-pre-wrap">{selectedNotif?.message}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={openWhatsApp} className="flex-1">
                Abrir WhatsApp Web
              </Button>
              <Button variant="outline" onClick={() => {
                copyWhatsAppNumber();
                copyMessage();
              }} className="flex-1">
                Copiar Tudo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;