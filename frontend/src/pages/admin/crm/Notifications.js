import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Clock, CheckCircle, XCircle, Copy, Plus, Trash2, Edit2, Save, MessageCircle } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [open, setOpen] = useState(false);
  const [autoReplyOpen, setAutoReplyOpen] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Auto-reply settings
  const [autoReplySettings, setAutoReplySettings] = useState({
    enabled: false,
    welcome_message: "Olá! 👋 Bem-vindo à VigiLoc! Como posso ajudar você hoje?",
    business_hours_message: "Nosso horário de atendimento é de Segunda a Sexta, das 8h às 18h. Deixe sua mensagem que retornaremos o mais breve possível!",
    outside_hours_message: "Estamos fora do horário de atendimento. Retornaremos sua mensagem no próximo dia útil. Obrigado pela compreensão! 🙏",
    auto_replies: [
      { id: "1", trigger: "preço", response: "Para informações sobre preços e orçamentos, por favor acesse nosso site ou fale com um consultor: [LINK]" },
      { id: "2", trigger: "horário", response: "Nosso horário de atendimento é de Segunda a Sexta, das 8h às 18h, e Sábados das 8h às 12h." },
      { id: "3", trigger: "endereço", response: "Estamos localizados na Av. Paulista, 1000 - São Paulo/SP. CEP: 01310-100" },
    ]
  });

  const [newReply, setNewReply] = useState({ trigger: "", response: "" });

  useEffect(() => {
    fetchNotifications();
    fetchCustomers();
    fetchAutoReplySettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/admin/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/admin/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchAutoReplySettings = async () => {
    try {
      const response = await axios.get(`${API}/whatsapp-auto-reply-settings`);
      if (response.data) {
        setAutoReplySettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error fetching auto-reply settings:", error);
    }
  };

  const saveAutoReplySettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put(`${API}/admin/whatsapp-auto-reply-settings`, autoReplySettings);
      toast.success("Configurações de resposta automática salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSavingSettings(false);
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

  const addAutoReply = () => {
    if (!newReply.trigger || !newReply.response) {
      toast.error("Preencha todos os campos");
      return;
    }
    const newId = Date.now().toString();
    setAutoReplySettings(prev => ({
      ...prev,
      auto_replies: [...prev.auto_replies, { ...newReply, id: newId }]
    }));
    setNewReply({ trigger: "", response: "" });
    setAutoReplyOpen(false);
    toast.success("Resposta automática adicionada!");
  };

  const deleteAutoReply = (id) => {
    setAutoReplySettings(prev => ({
      ...prev,
      auto_replies: prev.auto_replies.filter(r => r.id !== id)
    }));
    toast.success("Resposta automática removida!");
  };

  const updateAutoReply = (id, field, value) => {
    setAutoReplySettings(prev => ({
      ...prev,
      auto_replies: prev.auto_replies.map(r => 
        r.id === id ? { ...r, [field]: value } : r
      )
    }));
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
      {/* Header with WhatsApp icon */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notificações</h1>
            <p className="text-gray-600">WhatsApp & Respostas Automáticas</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Enviar Notificações
          </TabsTrigger>
          <TabsTrigger value="auto-reply" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-500" />
            Respostas Automáticas
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Clock className="mr-2 h-5 w-5 text-orange-600" />
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
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma notificação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notif) => {
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
                                <MessageCircle className="h-4 w-4 mr-1 text-green-500" />
                                Enviar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Reply Tab */}
        <TabsContent value="auto-reply" className="space-y-6">
          {/* Enable/Disable Auto-Reply */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Respostas Automáticas do WhatsApp</h3>
                    <p className="text-sm text-gray-600">Ative para responder automaticamente mensagens recebidas</p>
                  </div>
                </div>
                <Switch
                  checked={autoReplySettings.enabled}
                  onCheckedChange={(checked) => setAutoReplySettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Padrão</CardTitle>
              <CardDescription>Configure as mensagens automáticas gerais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Textarea
                  value={autoReplySettings.welcome_message}
                  onChange={(e) => setAutoReplySettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Olá! Bem-vindo..."
                  rows={2}
                />
                <p className="text-xs text-gray-500">Enviada automaticamente na primeira mensagem do cliente</p>
              </div>
              
              <div className="space-y-2">
                <Label>Mensagem de Horário Comercial</Label>
                <Textarea
                  value={autoReplySettings.business_hours_message}
                  onChange={(e) => setAutoReplySettings(prev => ({ ...prev, business_hours_message: e.target.value }))}
                  placeholder="Nosso horário de atendimento..."
                  rows={2}
                />
                <p className="text-xs text-gray-500">Informações sobre o horário de funcionamento</p>
              </div>
              
              <div className="space-y-2">
                <Label>Mensagem Fora do Horário</Label>
                <Textarea
                  value={autoReplySettings.outside_hours_message}
                  onChange={(e) => setAutoReplySettings(prev => ({ ...prev, outside_hours_message: e.target.value }))}
                  placeholder="Estamos fora do horário..."
                  rows={2}
                />
                <p className="text-xs text-gray-500">Enviada quando a mensagem chega fora do horário comercial</p>
              </div>
            </CardContent>
          </Card>

          {/* Custom Auto-Replies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Respostas por Palavra-chave</CardTitle>
                  <CardDescription>Responda automaticamente quando o cliente usar palavras específicas</CardDescription>
                </div>
                <Button onClick={() => setAutoReplyOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Resposta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Palavra-chave (Gatilho)</TableHead>
                    <TableHead>Resposta Automática</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {autoReplySettings.auto_replies.map((reply) => (
                    <TableRow key={reply.id}>
                      <TableCell>
                        <Input
                          value={reply.trigger}
                          onChange={(e) => updateAutoReply(reply.id, "trigger", e.target.value)}
                          className="font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={reply.response}
                          onChange={(e) => updateAutoReply(reply.id, "response", e.target.value)}
                          rows={2}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAutoReply(reply.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {autoReplySettings.auto_replies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        Nenhuma resposta automática configurada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={saveAutoReplySettings} disabled={savingSettings} size="lg">
              <Save className="w-4 h-4 mr-2" />
              {savingSettings ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Enviar via WhatsApp
            </DialogTitle>
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
              <Button onClick={openWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600">
                <MessageCircle className="mr-2 h-4 w-4" />
                Abrir WhatsApp Web
              </Button>
              <Button variant="outline" onClick={() => {
                copyWhatsAppNumber();
                copyMessage();
              }} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Tudo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Auto-Reply Dialog */}
      <Dialog open={autoReplyOpen} onOpenChange={setAutoReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Resposta Automática</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Palavra-chave (Gatilho)</Label>
              <Input
                value={newReply.trigger}
                onChange={(e) => setNewReply(prev => ({ ...prev, trigger: e.target.value }))}
                placeholder="Ex: preço, orçamento, horário..."
              />
              <p className="text-xs text-gray-500">A resposta será enviada quando o cliente mencionar esta palavra</p>
            </div>
            <div className="space-y-2">
              <Label>Resposta Automática</Label>
              <Textarea
                value={newReply.response}
                onChange={(e) => setNewReply(prev => ({ ...prev, response: e.target.value }))}
                placeholder="Digite a resposta que será enviada automaticamente..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoReplyOpen(false)}>Cancelar</Button>
            <Button onClick={addAutoReply}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
