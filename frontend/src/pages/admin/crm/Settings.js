import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Settings as SettingsIcon, Mail } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const Settings = () => {
  const [triggerSettings, setTriggerSettings] = useState({
    payment_reminder_days: 1,
    overdue_notice_days: 3,
    suspension_warning_days: 10
  });

  const [emailTemplates, setEmailTemplates] = useState({
    payment_reminder: {
      subject: "Lembrete: Pagamento próximo ao vencimento",
      body: "Olá {customer_name}!\n\nSeu pagamento de R$ {amount} vence em {due_date}.\n\nChave Pix: {pix_key}\n\nAtenciosamente,\nVigiloc"
    },
    overdue_notice: {
      subject: "⚠️ Pagamento em Atraso",
      body: "Olá {customer_name},\n\nIdentificamos que seu pagamento de R$ {amount} está em atraso desde {due_date}.\n\nPor favor, regularize para evitar a suspensão do serviço.\n\nChave Pix: {pix_key}\n\nAtenciosamente,\nVigiloc"
    },
    suspension_warning: {
      subject: "🚨 AVISO FINAL - Suspensão de Serviço",
      body: "AVISO FINAL\n\n{customer_name},\n\nSeu serviço será suspenso em 24 horas por falta de pagamento.\n\nValor em atraso: R$ {amount}\nVencimento original: {due_date}\n\nREGULARIZE URGENTEMENTE!\n\nChave Pix: {pix_key}\n\nVigiloc"
    }
  });

  const [whatsappTemplates, setWhatsappTemplates] = useState({
    payment_reminder: "Olá {customer_name}! Lembrete: Seu pagamento de R$ {amount} vence em {due_date}. PIX: {pix_key}",
    overdue_notice: "⚠️ {customer_name}, seu pagamento de R$ {amount} está atrasado. Por favor, regularize para evitar suspensão do serviço. PIX: {pix_key}",
    suspension_warning: "🚨 AVISO FINAL {customer_name}: Seu serviço será suspenso em 24h por falta de pagamento. Valor: R$ {amount}. Regularize URGENTE! PIX: {pix_key}"
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/crm/settings`);
      if (response.data) {
        if (response.data.trigger_settings) setTriggerSettings(response.data.trigger_settings);
        if (response.data.email_templates) {
          // Merge with defaults to ensure all templates exist
          setEmailTemplates({
            payment_reminder: response.data.email_templates.payment_reminder || emailTemplates.payment_reminder,
            overdue_notice: response.data.email_templates.overdue_notice || emailTemplates.overdue_notice,
            suspension_warning: response.data.email_templates.suspension_warning || emailTemplates.suspension_warning
          });
        }
        if (response.data.whatsapp_templates) {
          setWhatsappTemplates({
            payment_reminder: response.data.whatsapp_templates.payment_reminder || whatsappTemplates.payment_reminder,
            overdue_notice: response.data.whatsapp_templates.overdue_notice || whatsappTemplates.overdue_notice,
            suspension_warning: response.data.whatsapp_templates.suspension_warning || whatsappTemplates.suspension_warning
          });
        }
      }
    } catch (error) {
      console.log("Carregando configurações padrão");
    }
  };

  const saveTriggerSettings = async () => {
    try {
      await axios.put(`${API}/admin/crm/settings/triggers`, triggerSettings);
      toast.success("Configurações de gatilhos salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const saveEmailTemplates = async () => {
    try {
      await axios.put(`${API}/admin/crm/settings/email-templates`, emailTemplates);
      toast.success("Templates de email salvos!");
    } catch (error) {
      toast.error("Erro ao salvar templates");
    }
  };

  const saveWhatsappTemplates = async () => {
    try {
      await axios.put(`${API}/admin/crm/settings/whatsapp-templates`, whatsappTemplates);
      toast.success("Templates de WhatsApp salvos!");
    } catch (error) {
      toast.error("Erro ao salvar templates");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Configurações CRM</h1>
      </div>

      <Tabs defaultValue="triggers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="triggers">Gatilhos de Notificação</TabsTrigger>
          <TabsTrigger value="email">Templates de Email</TabsTrigger>
          <TabsTrigger value="whatsapp">Templates WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Configurações de Gatilhos Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Lembrete de Pagamento (dias antes do vencimento)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={triggerSettings.payment_reminder_days}
                  onChange={(e) => setTriggerSettings({...triggerSettings, payment_reminder_days: parseInt(e.target.value)})}
                />
                <p className="text-sm text-gray-500 mt-1">Padrão: 1 dia antes</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Aviso de Atraso (dias após vencimento)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={triggerSettings.overdue_notice_days}
                  onChange={(e) => setTriggerSettings({...triggerSettings, overdue_notice_days: parseInt(e.target.value)})}
                />
                <p className="text-sm text-gray-500 mt-1">Padrão: 3 dias após vencimento</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Aviso de Suspensão (dias após vencimento)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={triggerSettings.suspension_warning_days}
                  onChange={(e) => setTriggerSettings({...triggerSettings, suspension_warning_days: parseInt(e.target.value)})}
                />
                <p className="text-sm text-gray-500 mt-1">Padrão: 10 dias após vencimento</p>
              </div>

              <Button onClick={saveTriggerSettings} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Template: Lembrete de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assunto</label>
                  <Input
                    value={emailTemplates?.payment_reminder?.subject || ""}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      payment_reminder: {...emailTemplates.payment_reminder, subject: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Corpo do Email</label>
                  <textarea
                    className="w-full p-3 border rounded min-h-[150px] font-mono text-sm"
                    value={emailTemplates?.payment_reminder?.body || ""}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      payment_reminder: {...emailTemplates.payment_reminder, body: e.target.value}
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{customer_name}'}, {'{amount}'}, {'{due_date}'}, {'{pix_key}'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Template: Aviso de Atraso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assunto</label>
                  <Input
                    value={emailTemplates?.overdue_notice?.subject || ""}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      overdue_notice: {...emailTemplates.overdue_notice, subject: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Corpo do Email</label>
                  <textarea
                    className="w-full p-3 border rounded min-h-[150px] font-mono text-sm"
                    value={emailTemplates?.overdue_notice?.body || ""}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      overdue_notice: {...emailTemplates.overdue_notice, body: e.target.value}
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{customer_name}'}, {'{amount}'}, {'{due_date}'}, {'{pix_key}'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Template: Aviso de Suspensão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assunto</label>
                  <Input
                    value={emailTemplates?.suspension_warning?.subject || ""}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      suspension_warning: {...emailTemplates.suspension_warning, subject: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Corpo do Email</label>
                  <textarea
                    className="w-full p-3 border rounded min-h-[150px] font-mono text-sm"
                    value={emailTemplates?.suspension_warning?.body || ""}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      suspension_warning: {...emailTemplates.suspension_warning, body: e.target.value}
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {'{customer_name}'}, {'{amount}'}, {'{due_date}'}, {'{pix_key}'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveEmailTemplates} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Salvar Templates de Email
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Template: Lembrete de Pagamento (WhatsApp)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full p-3 border rounded min-h-[100px]"
                  value={whatsappTemplates?.payment_reminder || ""}
                  onChange={(e) => setWhatsappTemplates({...whatsappTemplates, payment_reminder: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variáveis: {'{customer_name}'}, {'{amount}'}, {'{due_date}'}, {'{pix_key}'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template: Aviso de Atraso (WhatsApp)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full p-3 border rounded min-h-[100px]"
                  value={whatsappTemplates?.overdue_notice || ""}
                  onChange={(e) => setWhatsappTemplates({...whatsappTemplates, overdue_notice: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variáveis: {'{customer_name}'}, {'{amount}'}, {'{due_date}'}, {'{pix_key}'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template: Aviso de Suspensão (WhatsApp)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full p-3 border rounded min-h-[100px]"
                  value={whatsappTemplates.suspension_warning}
                  onChange={(e) => setWhatsappTemplates({...whatsappTemplates, suspension_warning: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variáveis: {'{customer_name}'}, {'{amount}'}, {'{due_date}'}, {'{pix_key}'}
                </p>
              </CardContent>
            </Card>

            <Button onClick={saveWhatsappTemplates} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Salvar Templates de WhatsApp
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;