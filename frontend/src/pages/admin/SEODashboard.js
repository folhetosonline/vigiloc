import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import { 
  Search,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  RefreshCw,
  Loader2,
  Bot,
  Link as LinkIcon,
  Star,
  Import,
  Copy,
  HelpCircle
} from "lucide-react";
import AdminGuidePopup from "@/components/admin/AdminGuidePopup";

const SEODashboard = () => {
  const [seoReport, setSeoReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState(null);

  useEffect(() => {
    fetchSEOReport();
  }, []);

  const fetchSEOReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/seo/report`);
      setSeoReport(response.data);
    } catch (error) {
      toast.error("Erro ao carregar relatório SEO");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const handleImportReview = async () => {
    if (!importUrl.trim()) {
      toast.error("Cole o link da avaliação");
      return;
    }

    setImportLoading(true);
    
    // Simular extração de dados (em produção, seria uma API real)
    setTimeout(() => {
      // Parse básico do URL para detectar a fonte
      let source = "manual";
      if (importUrl.includes("google.com") || importUrl.includes("g.co")) {
        source = "google";
      } else if (importUrl.includes("facebook.com") || importUrl.includes("fb.com")) {
        source = "facebook";
      } else if (importUrl.includes("instagram.com")) {
        source = "instagram";
      }

      setImportedData({
        author_name: "",
        rating: 5,
        text: "",
        source: source,
        source_url: importUrl
      });
      setImportLoading(false);
    }, 1000);
  };

  const saveImportedReview = async () => {
    if (!importedData.author_name || !importedData.text) {
      toast.error("Preencha nome e texto da avaliação");
      return;
    }

    try {
      await axios.post(`${API}/admin/social-reviews`, {
        ...importedData,
        published: true,
        featured: true
      });
      toast.success("Avaliação importada com sucesso!");
      setImportDialogOpen(false);
      setImportUrl("");
      setImportedData(null);
    } catch (error) {
      toast.error("Erro ao salvar avaliação");
      console.error(error);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === "✅") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === "⚠️") return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (status === "🔄") return <RefreshCw className="w-5 h-5 text-blue-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO & Integração</h1>
          <p className="text-gray-600 mt-1">
            Relatório de otimização para buscadores e LLMs
          </p>
        </div>
        <div className="flex gap-2">
          <AdminGuidePopup 
            trigger={
              <Button variant="outline" className="gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 text-yellow-700 hover:from-yellow-100 hover:to-orange-100">
                <HelpCircle className="w-4 h-4" />
                📚 Guia Completo
              </Button>
            }
          />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Import className="w-4 h-4 mr-2" />
            Importar Review
          </Button>
          <Button onClick={fetchSEOReport}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="llm">LLMs / IA</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Serviços</p>
                    <p className="text-2xl font-bold">{seoReport?.content_analysis?.total_services || 0}</p>
                  </div>
                  <Globe className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Páginas</p>
                    <p className="text-2xl font-bold">{seoReport?.content_analysis?.total_pages || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avaliações</p>
                    <p className="text-2xl font-bold">{seoReport?.content_analysis?.total_reviews || 0}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Nota Média</p>
                    <p className="text-2xl font-bold">{seoReport?.content_analysis?.average_rating || 0}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Domain Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domínio Configurado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
                  {seoReport?.domain || "https://www.vigiloc.com.br"}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(seoReport?.domain)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Indexed URLs */}
          <Card>
            <CardHeader>
              <CardTitle>URLs Indexadas ({seoReport?.indexed_urls?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {seoReport?.indexed_urls?.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <code className="text-gray-700">{url}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Checklist SEO
              </CardTitle>
              <CardDescription>
                Status dos elementos essenciais para otimização de busca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoReport?.seo_checklist && Object.entries(seoReport.seo_checklist).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={value.status} />
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-sm text-gray-600">{value.note}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Engines */}
          <Card>
            <CardHeader>
              <CardTitle>Buscadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seoReport?.search_engines && Object.entries(seoReport.search_engines).map(([engine, data]) => (
                  <div key={engine} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <StatusIcon status={data.status} />
                      <span className="font-semibold capitalize">{engine}</span>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {data.actions?.map((action, idx) => (
                        <li key={idx}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Arquivos SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Arquivos de Configuração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/robots.txt" target="_blank" rel="noopener noreferrer">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">robots.txt</span>
                    </div>
                    <p className="text-sm text-gray-600">Regras para crawlers</p>
                  </div>
                </a>
                <a href="/api/sitemap.xml" target="_blank" rel="noopener noreferrer">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-green-500" />
                      <span className="font-medium">sitemap.xml</span>
                    </div>
                    <p className="text-sm text-gray-600">Mapa do site dinâmico</p>
                  </div>
                </a>
                <a href="/llms.txt" target="_blank" rel="noopener noreferrer">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">llms.txt</span>
                    </div>
                    <p className="text-sm text-gray-600">Informações para IAs</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Tab */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Otimização para LLMs
              </CardTitle>
              <CardDescription>
                Configurações para ChatGPT, Claude, Perplexity e outros assistentes de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoReport?.llm_optimization && Object.entries(seoReport.llm_optimization).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={value.status} />
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-sm text-gray-600">{value.note}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* LLM Crawlers */}
          <Card>
            <CardHeader>
              <CardTitle>Crawlers de IA Permitidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "GPTBot", company: "OpenAI", color: "bg-green-100" },
                  { name: "Claude-Web", company: "Anthropic", color: "bg-orange-100" },
                  { name: "PerplexityBot", company: "Perplexity", color: "bg-blue-100" },
                  { name: "Google-Extended", company: "Google/Gemini", color: "bg-red-100" },
                  { name: "Bytespider", company: "Microsoft", color: "bg-cyan-100" },
                  { name: "YouBot", company: "You.com", color: "bg-purple-100" },
                  { name: "cohere-ai", company: "Cohere", color: "bg-pink-100" },
                  { name: "ChatGPT-User", company: "OpenAI", color: "bg-green-100" }
                ].map((bot) => (
                  <div key={bot.name} className={`p-3 rounded-lg ${bot.color}`}>
                    <p className="font-medium text-sm">{bot.name}</p>
                    <p className="text-xs text-gray-600">{bot.company}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações</CardTitle>
              <CardDescription>Ações para melhorar o posicionamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoReport?.recommendations?.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Badge 
                      variant={rec.priority === "alta" ? "destructive" : rec.priority === "média" ? "default" : "secondary"}
                    >
                      {rec.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{rec.action}</p>
                      {rec.note && <p className="text-sm text-gray-600 mt-1">{rec.note}</p>}
                    </div>
                    {rec.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={rec.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Links Rápidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium">Google Search Console</p>
                    <p className="text-sm text-gray-600">Monitorar indexação no Google</p>
                  </div>
                </a>
                <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium">Bing Webmaster Tools</p>
                    <p className="text-sm text-gray-600">Monitorar indexação no Bing</p>
                  </div>
                </a>
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium">Google My Business</p>
                    <p className="text-sm text-gray-600">Gerenciar perfil comercial</p>
                  </div>
                </a>
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="block">
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium">Google Analytics</p>
                    <p className="text-sm text-gray-600">Analisar tráfego do site</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Review Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Avaliação</DialogTitle>
            <DialogDescription>
              Cole o link da avaliação do Google, Facebook ou Instagram
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!importedData ? (
              <>
                <div className="space-y-2">
                  <Label>URL da Avaliação</Label>
                  <Input
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://g.co/kgs/... ou https://facebook.com/..."
                  />
                </div>
                <Button 
                  onClick={handleImportReview} 
                  disabled={importLoading}
                  className="w-full"
                >
                  {importLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Extrair Dados
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nome do Autor *</Label>
                  <Input
                    value={importedData.author_name}
                    onChange={(e) => setImportedData({...importedData, author_name: e.target.value})}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nota (1-5)</Label>
                  <Select
                    value={String(importedData.rating)}
                    onValueChange={(v) => setImportedData({...importedData, rating: parseInt(v)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5,4,3,2,1].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {"⭐".repeat(n)} ({n})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Texto da Avaliação *</Label>
                  <Textarea
                    value={importedData.text}
                    onChange={(e) => setImportedData({...importedData, text: e.target.value})}
                    placeholder="Cole ou digite o texto da avaliação"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Fonte detectada:</span>
                  <Badge>{importedData.source}</Badge>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialogOpen(false);
              setImportUrl("");
              setImportedData(null);
            }}>
              Cancelar
            </Button>
            {importedData && (
              <Button onClick={saveImportedReview}>
                Salvar Avaliação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SEODashboard;
