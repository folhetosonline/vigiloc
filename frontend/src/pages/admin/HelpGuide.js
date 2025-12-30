import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, Book, Settings, Mail, MessageCircle, Shield, Camera, 
  Users, FileText, Layout, Palette, Search, Bell, CreditCard, 
  Package, ShoppingCart, ExternalLink, Copy, Check, ChevronRight,
  Sparkles, Zap, Globe, Database, Lock, Server
} from "lucide-react";
import { toast } from "sonner";

const HelpGuide = () => {
  const [activeSection, setActiveSection] = useState("welcome");
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id, language = "bash" }) => (
    <div className="relative bg-gray-900 rounded-lg p-4 mt-2 mb-4 group">
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
      <pre className="text-green-400 text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  const sections = [
    { id: "welcome", label: "👋 Bem-vindo", icon: <HelpCircle /> },
    { id: "sendgrid", label: "📧 SendGrid (Email)", icon: <Mail /> },
    { id: "crm", label: "👥 CRM/ERP", icon: <Users /> },
    { id: "pagebuilder", label: "📄 Page Builder", icon: <Layout /> },
    { id: "products", label: "📦 Produtos", icon: <Package /> },
    { id: "seo", label: "🔍 SEO", icon: <Search /> },
    { id: "whatsapp", label: "💬 WhatsApp", icon: <MessageCircle /> },
    { id: "ai", label: "🤖 IA & Templates", icon: <Sparkles /> },
    { id: "security", label: "🔐 Segurança", icon: <Shield /> },
    { id: "api", label: "🔌 API", icon: <Database /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Book className="w-8 h-8 text-blue-500" />
            Guia Completo do Admin
          </h1>
          <p className="text-gray-600 mt-1">
            Documentação completa para configurar e usar todas as funcionalidades
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          v2.0 - 2026
        </Badge>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <Card className="w-64 shrink-0">
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </Button>
                ))}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Area */}
        <Card className="flex-1">
          <CardContent className="p-6">
            <ScrollArea className="h-[calc(100vh-250px)]">
              {/* Welcome Section */}
              {activeSection === "welcome" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-xl">
                    <h2 className="text-3xl font-bold mb-4">👋 Bem-vindo ao Admin VigiLoc!</h2>
                    <p className="text-lg opacity-90">
                      Este guia completo irá ajudá-lo a configurar e utilizar todas as funcionalidades 
                      do painel administrativo. Navegue pelas seções no menu à esquerda.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <h3 className="font-semibold flex items-center gap-2 text-green-700">
                          <Check className="w-5 h-5" /> Funcionalidades Ativas
                        </h3>
                        <ul className="mt-2 space-y-1 text-sm text-green-600">
                          <li>✓ Page Builder & Visual Builder</li>
                          <li>✓ CRM/ERP Completo</li>
                          <li>✓ Gestão de Produtos & Serviços</li>
                          <li>✓ SEO & Analytics</li>
                          <li>✓ Avaliações de Clientes</li>
                          <li>✓ Templates de IA</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <h3 className="font-semibold flex items-center gap-2 text-yellow-700">
                          <Settings className="w-5 h-5" /> Configuração Necessária
                        </h3>
                        <ul className="mt-2 space-y-1 text-sm text-yellow-600">
                          <li>⚠️ SendGrid para envio de emails</li>
                          <li>⚠️ Google Search Console</li>
                          <li>⚠️ Google Analytics (opcional)</li>
                          <li>⚠️ Gateway de Pagamento (opcional)</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>📚 Navegação Rápida</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {sections.slice(1).map((section) => (
                          <Button 
                            key={section.id}
                            variant="outline" 
                            className="justify-start"
                            onClick={() => setActiveSection(section.id)}
                          >
                            {section.icon}
                            <span className="ml-2">{section.label}</span>
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SendGrid Section */}
              {activeSection === "sendgrid" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6 text-blue-500" />
                    Configuração do SendGrid (Email)
                  </h2>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-blue-800">
                        <strong>O que é SendGrid?</strong> SendGrid é um serviço de envio de emails transacionais. 
                        É necessário para: recuperação de senha, notificações de pedidos, lembretes de pagamento e 
                        comunicação com clientes.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">📝 Passo a Passo</h3>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">1️⃣ Criar Conta no SendGrid</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                          <li>Acesse <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sendgrid.com</a></li>
                          <li>Clique em "Start for Free" (plano gratuito permite 100 emails/dia)</li>
                          <li>Preencha os dados e confirme seu email</li>
                          <li>Complete a verificação de identidade (Single Sender Verification)</li>
                        </ol>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">2️⃣ Criar API Key</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                          <li>No painel SendGrid, vá em <strong>Settings → API Keys</strong></li>
                          <li>Clique em "Create API Key"</li>
                          <li>Nome: "VigiLoc App"</li>
                          <li>Permissões: "Full Access" ou "Restricted Access" com Mail Send habilitado</li>
                          <li>Copie a API Key gerada (começa com SG.)</li>
                        </ol>
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 text-sm">
                            ⚠️ <strong>Importante:</strong> A API Key só é exibida uma vez! Guarde-a em local seguro.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">3️⃣ Verificar Email Remetente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                          <li>Vá em <strong>Settings → Sender Authentication</strong></li>
                          <li>Escolha "Single Sender Verification"</li>
                          <li>Adicione o email que será usado como remetente (ex: noreply@vigiloc.com.br)</li>
                          <li>Confirme o email clicando no link de verificação</li>
                        </ol>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">4️⃣ Configurar no Sistema</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">
                          Adicione as seguintes variáveis no arquivo de ambiente do backend:
                        </p>
                        <CodeBlock 
                          id="sendgrid-env"
                          code={`# No arquivo /app/backend/.env adicione:
SENDGRID_API_KEY="SG.sua-api-key-aqui"
SENDGRID_FROM_EMAIL="noreply@vigiloc.com.br"`}
                        />
                        <p className="text-gray-600 text-sm mt-2">
                          Após configurar, reinicie o backend para aplicar as alterações.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">5️⃣ Testar o Envio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                          <li>Acesse a página de login do admin</li>
                          <li>Clique em "Esqueci minha senha"</li>
                          <li>Digite um email cadastrado</li>
                          <li>Verifique se o email foi recebido</li>
                        </ol>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-700 mb-2">✅ Emails que serão enviados automaticamente:</h4>
                      <ul className="list-disc ml-4 space-y-1 text-green-600">
                        <li>Recuperação de senha</li>
                        <li>Confirmação de pedidos</li>
                        <li>Lembretes de pagamento (CRM)</li>
                        <li>Avisos de vencimento (CRM)</li>
                        <li>Notificações de suspensão (CRM)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* CRM Section */}
              {activeSection === "crm" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-500" />
                    CRM/ERP - Gestão Completa
                  </h2>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <p className="text-purple-800">
                        O sistema CRM/ERP permite gerenciar clientes, contratos, equipamentos, 
                        pagamentos e chamados de manutenção de forma integrada.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">👥 Clientes</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Cadastro completo com endereço</li>
                          <li>Número de WhatsApp para contato</li>
                          <li>Tipo: residencial, comercial, industrial</li>
                          <li>Status: ativo, suspenso, cancelado</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📋 Contratos</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Vinculado ao cliente</li>
                          <li>Tipo de serviço e valor mensal</li>
                          <li>Dia de vencimento do pagamento</li>
                          <li>Data de início e fim</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📦 Equipamentos</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Vinculado ao cliente e contrato</li>
                          <li>Marca, modelo e número de série</li>
                          <li>Data de instalação e garantia</li>
                          <li>Status: ativo, manutenção, inativo</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">💰 Pagamentos</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-600">
                        <ul className="list-disc ml-4 space-y-1">
                          <li>Geração automática mensal</li>
                          <li>Chave PIX e QR Code</li>
                          <li>Marcar como pago</li>
                          <li>Histórico completo</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>🔔 Notificações Automáticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">
                        Configure em <strong>CRM → Configurações</strong> os gatilhos de notificação:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span>📩 Lembrete de pagamento</span>
                          <Badge>X dias antes do vencimento</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <span>⚠️ Aviso de atraso</span>
                          <Badge variant="warning">X dias após vencimento</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span>🚨 Aviso de suspensão</span>
                          <Badge variant="destructive">X dias após vencimento</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Page Builder Section */}
              {activeSection === "pagebuilder" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Layout className="w-6 h-6 text-green-500" />
                    Page Builder & Visual Builder
                  </h2>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-green-800">
                        Crie e edite páginas do site sem precisar de código! 
                        Escolha entre o Page Builder (blocos) ou Visual Builder (drag-and-drop).
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">📄 Page Builder (Páginas do Sistema)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">
                          Edite as páginas principais do site: Home, Produtos, Totens, Contato, Sobre.
                        </p>
                        <ul className="list-disc ml-4 space-y-1 text-gray-600">
                          <li><strong>Hero:</strong> Banner principal com título, subtítulo e CTA</li>
                          <li><strong>Texto:</strong> Blocos de texto formatado</li>
                          <li><strong>Cards:</strong> Grade de cards com imagens</li>
                          <li><strong>Banner:</strong> Imagens promocionais</li>
                          <li><strong>Produtos:</strong> Lista de produtos filtrada</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">✨ Visual Builder (Páginas Personalizadas)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">
                          Crie landing pages e páginas promocionais do zero.
                        </p>
                        <ul className="list-disc ml-4 space-y-1 text-gray-600">
                          <li>Templates prontos (Black Friday, Natal, etc.)</li>
                          <li>Componentes arrastáveis</li>
                          <li>Preview em tempo real</li>
                          <li>Publicação com um clique</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">🔄 Funcionalidade de Duplicação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-3">
                          Economize tempo duplicando páginas, serviços e templates existentes!
                        </p>
                        <ul className="list-disc ml-4 space-y-1 text-gray-600">
                          <li><strong>Páginas:</strong> Clique no ícone de cópia no card da página</li>
                          <li><strong>Serviços:</strong> Use o botão "Duplicar" na lista de serviços</li>
                          <li><strong>Templates:</strong> Duplique templates na página de Sazonalidade</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Products Section */}
              {activeSection === "products" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="w-6 h-6 text-orange-500" />
                    Gestão de Produtos
                  </h2>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🏷️ Badges de Produtos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">
                        Use badges para destacar produtos especiais:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-500">🆕 Novidade</Badge>
                        <Badge className="bg-blue-500">🚀 Lançamento</Badge>
                        <Badge className="bg-yellow-500">⭐ Top de Linha</Badge>
                        <Badge className="bg-red-500">🔥 Oferta</Badge>
                        <Badge className="bg-purple-500">💎 Custo-Benefício</Badge>
                        <Badge className="bg-pink-500">✨ Destaque</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">📍 Exibição por Página</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">
                        Configure em quais páginas cada produto deve aparecer:
                      </p>
                      <ul className="list-disc ml-4 space-y-1 text-gray-600">
                        <li><strong>Home:</strong> Produtos em destaque na página inicial</li>
                        <li><strong>Totens:</strong> Apenas totens e produtos relacionados</li>
                        <li><strong>Produtos:</strong> Catálogo completo</li>
                        <li><strong>Todas:</strong> Aparece em todas as páginas</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SEO Section */}
              {activeSection === "seo" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-500" />
                    SEO & Otimização
                  </h2>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-blue-800">
                        O sistema gera automaticamente robots.txt, sitemap.xml e llms.txt 
                        para otimizar a indexação do site nos buscadores e IAs.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🔧 Configuração do Google Search Console</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                        <li>Acesse <a href="https://search.google.com/search-console" target="_blank" className="text-blue-600 hover:underline">Google Search Console</a></li>
                        <li>Adicione a propriedade do seu domínio</li>
                        <li>Verifique a propriedade via DNS ou arquivo HTML</li>
                        <li>Envie o sitemap: /sitemap.xml</li>
                        <li>Monitore a indexação e erros de rastreamento</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">📊 Google Analytics 4</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                        <li>Acesse <a href="https://analytics.google.com" target="_blank" className="text-blue-600 hover:underline">Google Analytics</a></li>
                        <li>Crie uma propriedade GA4</li>
                        <li>Copie o Measurement ID (G-XXXXXXXXXX)</li>
                        <li>Configure em SEO & Integração no admin</li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* WhatsApp Section */}
              {activeSection === "whatsapp" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                    Integração WhatsApp
                  </h2>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-green-800">
                        Configure mensagens automáticas e respostas por palavras-chave para WhatsApp.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">💬 Respostas Automáticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">
                        Configure em <strong>CRM → Notificações</strong>:
                      </p>
                      <ul className="list-disc ml-4 space-y-1 text-gray-600">
                        <li><strong>Mensagem de boas-vindas:</strong> Enviada ao primeiro contato</li>
                        <li><strong>Horário comercial:</strong> Resposta durante expediente</li>
                        <li><strong>Fora do horário:</strong> Resposta automática após expediente</li>
                        <li><strong>Palavras-chave:</strong> Respostas baseadas em termos (preço, horário, endereço)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Section */}
              {activeSection === "ai" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    IA & Geração de Templates
                  </h2>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <p className="text-purple-800">
                        Use inteligência artificial para gerar templates promocionais personalizados!
                        Escolha entre Gemini (Google) ou GPT (OpenAI).
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🤖 Como Usar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal ml-4 space-y-2 text-gray-700">
                        <li>Acesse <strong>Sazonalidade 🎄</strong> no menu</li>
                        <li>Clique em <strong>"Gerar com IA"</strong></li>
                        <li>Escolha o provedor: Gemini ou GPT</li>
                        <li>Descreva o template desejado (ex: "Promoção de Dia das Mães com foco em segurança residencial")</li>
                        <li>Aguarde a geração e customize se necessário</li>
                        <li>Aplique em qualquer página do site!</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">💡 Dicas para Melhores Resultados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc ml-4 space-y-1 text-gray-600">
                        <li>Seja específico: mencione cores, tema, público-alvo</li>
                        <li>Inclua detalhes de ofertas ou descontos</li>
                        <li>Mencione datas importantes</li>
                        <li>Especifique o tom: formal, descontraído, urgente</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-500" />
                    Segurança
                  </h2>

                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <p className="text-red-800">
                        <strong>⚠️ Importante:</strong> Mantenha suas credenciais seguras e 
                        atualize regularmente as senhas de administrador.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🔐 Boas Práticas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc ml-4 space-y-2 text-gray-700">
                        <li>Use senhas fortes (mínimo 12 caracteres)</li>
                        <li>Ative autenticação de dois fatores quando disponível</li>
                        <li>Não compartilhe credenciais de admin</li>
                        <li>Revise periodicamente os usuários com acesso</li>
                        <li>Mantenha as API keys em variáveis de ambiente</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* API Section */}
              {activeSection === "api" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Database className="w-6 h-6 text-cyan-500" />
                    API & Integrações
                  </h2>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🔌 Endpoints Principais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 font-mono text-sm">
                        <div className="p-2 bg-gray-100 rounded">
                          <span className="text-green-600">GET</span> /api/products - Lista produtos
                        </div>
                        <div className="p-2 bg-gray-100 rounded">
                          <span className="text-green-600">GET</span> /api/services - Lista serviços
                        </div>
                        <div className="p-2 bg-gray-100 rounded">
                          <span className="text-blue-600">POST</span> /api/auth/login - Login
                        </div>
                        <div className="p-2 bg-gray-100 rounded">
                          <span className="text-green-600">GET</span> /api/admin/analytics/dashboard - Dashboard
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🔑 Variáveis de Ambiente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock 
                        id="env-vars"
                        code={`# /app/backend/.env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="vigiloc_db"
JWT_SECRET_KEY="sua-chave-secreta"
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM_EMAIL="noreply@vigiloc.com"
EMERGENT_LLM_KEY="sk-emergent-xxx"`}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpGuide;
