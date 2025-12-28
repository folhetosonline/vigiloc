import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import { 
  FileText,
  Save,
  RotateCcw,
  RefreshCw,
  Loader2,
  Bot,
  Search,
  Globe,
  Shield,
  Code,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Trash2,
  Download,
  Terminal,
  Zap,
  BarChart3,
  Calendar,
  Filter
} from "lucide-react";

// Crawler icons and colors
const CRAWLER_CONFIG = {
  google: { name: "Google", icon: "🔴", color: "bg-red-100 text-red-700", category: "search" },
  bing: { name: "Bing", icon: "🔵", color: "bg-blue-100 text-blue-700", category: "search" },
  yahoo: { name: "Yahoo", icon: "🟣", color: "bg-purple-100 text-purple-700", category: "search" },
  duckduckgo: { name: "DuckDuckGo", icon: "🦆", color: "bg-orange-100 text-orange-700", category: "search" },
  yandex: { name: "Yandex", icon: "🔶", color: "bg-yellow-100 text-yellow-700", category: "search" },
  baidu: { name: "Baidu", icon: "🐼", color: "bg-blue-100 text-blue-700", category: "search" },
  openai: { name: "OpenAI/GPT", icon: "🤖", color: "bg-green-100 text-green-700", category: "llm" },
  anthropic: { name: "Anthropic/Claude", icon: "🧠", color: "bg-orange-100 text-orange-700", category: "llm" },
  perplexity: { name: "Perplexity", icon: "💡", color: "bg-cyan-100 text-cyan-700", category: "llm" },
  google_ai: { name: "Google AI/Gemini", icon: "✨", color: "bg-blue-100 text-blue-700", category: "llm" },
  cohere: { name: "Cohere", icon: "🔮", color: "bg-pink-100 text-pink-700", category: "llm" },
  you: { name: "You.com", icon: "🎯", color: "bg-indigo-100 text-indigo-700", category: "llm" },
  microsoft: { name: "Microsoft/Copilot", icon: "🪟", color: "bg-sky-100 text-sky-700", category: "llm" },
  facebook: { name: "Facebook", icon: "📘", color: "bg-blue-100 text-blue-700", category: "social" },
  twitter: { name: "Twitter/X", icon: "🐦", color: "bg-gray-100 text-gray-700", category: "social" },
  linkedin: { name: "LinkedIn", icon: "💼", color: "bg-blue-100 text-blue-700", category: "social" },
  whatsapp: { name: "WhatsApp", icon: "💬", color: "bg-green-100 text-green-700", category: "social" },
  telegram: { name: "Telegram", icon: "✈️", color: "bg-blue-100 text-blue-700", category: "social" },
  apple: { name: "Apple", icon: "🍎", color: "bg-gray-100 text-gray-700", category: "other" },
  unknown: { name: "Desconhecido", icon: "❓", color: "bg-gray-100 text-gray-700", category: "other" }
};

const FILE_CONFIG = {
  robots: { 
    name: "robots.txt", 
    icon: <Bot className="w-5 h-5" />, 
    color: "text-blue-600",
    description: "Controla quais páginas os crawlers podem acessar"
  },
  llms: { 
    name: "llms.txt", 
    icon: <Zap className="w-5 h-5" />, 
    color: "text-purple-600",
    description: "Informações estruturadas para IAs como ChatGPT e Claude"
  },
  manifest: { 
    name: "manifest.json", 
    icon: <Code className="w-5 h-5" />, 
    color: "text-green-600",
    description: "Configurações do PWA e metadados da aplicação"
  },
  security: { 
    name: "security.txt", 
    icon: <Shield className="w-5 h-5" />, 
    color: "text-red-600",
    description: "Informações de contato para reportar vulnerabilidades"
  }
};

const SEOFilesManager = () => {
  const [files, setFiles] = useState([]);
  const [crawlerLogs, setCrawlerLogs] = useState({ logs: [], by_crawler: {}, by_category: {}, daily: [] });
  const [activityLogs, setActivityLogs] = useState([]);
  const [healthCheck, setHealthCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("files");
  
  // Editor state
  const [editingFile, setEditingFile] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  
  // Filters
  const [crawlerFilter, setCrawlerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchFiles = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/seo/files`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, []);

  const fetchCrawlerLogs = useCallback(async () => {
    try {
      let url = `${API}/admin/seo/crawler-logs?limit=200`;
      if (crawlerFilter !== "all") url += `&crawler=${crawlerFilter}`;
      if (categoryFilter !== "all") url += `&category=${categoryFilter}`;
      
      const response = await axios.get(url);
      setCrawlerLogs(response.data);
    } catch (error) {
      console.error("Error fetching crawler logs:", error);
    }
  }, [crawlerFilter, categoryFilter]);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/seo/activity-logs`);
      setActivityLogs(response.data);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  }, []);

  const fetchHealthCheck = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/seo/health-check`);
      setHealthCheck(response.data);
    } catch (error) {
      console.error("Error fetching health check:", error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchFiles(),
      fetchCrawlerLogs(),
      fetchActivityLogs(),
      fetchHealthCheck()
    ]);
    setLoading(false);
  }, [fetchFiles, fetchCrawlerLogs, fetchActivityLogs, fetchHealthCheck]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchCrawlerLogs();
  }, [crawlerFilter, categoryFilter, fetchCrawlerLogs]);

  const handleEditFile = (file) => {
    setEditingFile(file);
    setEditContent(file.content || "");
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    
    setSaving(true);
    try {
      await axios.put(`${API}/admin/seo/files/${editingFile.type}`, {
        content: editContent
      });
      toast.success(`${editingFile.name} salvo com sucesso!`);
      setEditingFile(null);
      fetchFiles();
      fetchActivityLogs();
    } catch (error) {
      toast.error("Erro ao salvar arquivo");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreFile = async (fileType) => {
    try {
      await axios.post(`${API}/admin/seo/files/${fileType}/restore`);
      toast.success("Arquivo restaurado do backup!");
      fetchFiles();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao restaurar arquivo");
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Tem certeza que deseja limpar todos os logs de crawlers?")) return;
    
    try {
      const response = await axios.delete(`${API}/admin/seo/crawler-logs`);
      toast.success(`${response.data.deleted} logs removidos`);
      fetchCrawlerLogs();
    } catch (error) {
      toast.error("Erro ao limpar logs");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "2-digit",
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCrawlerBadge = (crawler) => {
    const config = CRAWLER_CONFIG[crawler] || CRAWLER_CONFIG.unknown;
    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.icon} {config.name}
      </Badge>
    );
  };

  const getCategoryBadge = (category) => {
    const colors = {
      search_engine: "bg-blue-100 text-blue-700",
      llm: "bg-purple-100 text-purple-700",
      social: "bg-pink-100 text-pink-700",
      other: "bg-gray-100 text-gray-700"
    };
    const labels = {
      search_engine: "🔍 Buscador",
      llm: "🤖 LLM/IA",
      social: "📱 Social",
      other: "🔗 Outro"
    };
    return (
      <Badge variant="outline" className={`${colors[category] || colors.other} border-0`}>
        {labels[category] || category}
      </Badge>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">📂 Gerenciador de Arquivos SEO</h1>
          <p className="text-gray-600 mt-1">
            Edite arquivos, monitore crawlers e visualize logs em tempo real
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar Tudo
        </Button>
      </div>

      {/* Health Score Card */}
      {healthCheck && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                  healthCheck.grade === "A+" || healthCheck.grade === "A" ? "bg-green-100 text-green-700" :
                  healthCheck.grade === "B" ? "bg-blue-100 text-blue-700" :
                  healthCheck.grade === "C" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {healthCheck.grade}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pontuação SEO</h3>
                  <p className="text-3xl font-bold text-blue-600">{healthCheck.score}/100</p>
                  <p className="text-sm text-gray-600">Última verificação: {formatDate(healthCheck.timestamp)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{healthCheck.content?.services_count || 0}</div>
                  <div className="text-xs text-gray-600">Serviços</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{healthCheck.content?.reviews_count || 0}</div>
                  <div className="text-xs text-gray-600">Avaliações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{Object.keys(healthCheck.files || {}).filter(k => healthCheck.files[k]?.exists).length}</div>
                  <div className="text-xs text-gray-600">Arquivos OK</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{crawlerLogs.last_24h || 0}</div>
                  <div className="text-xs text-gray-600">Visitas 24h</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="files" className="gap-2">
            <FileText className="w-4 h-4" />
            Arquivos
          </TabsTrigger>
          <TabsTrigger value="crawlers" className="gap-2">
            <Bot className="w-4 h-4" />
            Crawlers
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => {
              const config = FILE_CONFIG[file.type] || {};
              return (
                <Card key={file.name} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{file.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {config.description}
                          </CardDescription>
                        </div>
                      </div>
                      {file.exists ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Ausente
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {file.exists ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-4">
                          <div>
                            <span className="block text-gray-400">Tamanho</span>
                            <span className="font-medium">{formatBytes(file.size)}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400">Linhas</span>
                            <span className="font-medium">{file.lines}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400">Modificado</span>
                            <span className="font-medium">{formatDate(file.modified)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setViewingFile(file);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleEditFile(file)}
                          >
                            <Terminal className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRestoreFile(file.type)}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Restaurar backup
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => handleEditFile({ ...file, content: "" })}>
                        Criar Arquivo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Crawlers Tab */}
        <TabsContent value="crawlers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="search_engine">🔍 Buscadores</SelectItem>
                    <SelectItem value="llm">🤖 LLMs/IA</SelectItem>
                    <SelectItem value="social">📱 Social</SelectItem>
                    <SelectItem value="other">🔗 Outros</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={crawlerFilter} onValueChange={setCrawlerFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Crawler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Crawlers</SelectItem>
                    {Object.entries(CRAWLER_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Badge variant="outline">
                  {crawlerLogs.total || 0} logs totais
                </Badge>
                <Button variant="outline" size="sm" onClick={handleClearLogs}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpar Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Crawler Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(crawlerLogs.by_crawler || {})
                    .filter(([key]) => ["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu"].includes(key))
                    .slice(0, 5)
                    .map(([crawler, count]) => (
                      <div key={crawler} className="flex items-center justify-between text-sm">
                        {getCrawlerBadge(crawler)}
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  {Object.keys(crawlerLogs.by_crawler || {}).filter(k => ["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu"].includes(k)).length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum registro</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  LLMs / IAs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(crawlerLogs.by_crawler || {})
                    .filter(([key]) => ["openai", "anthropic", "perplexity", "google_ai", "cohere", "you", "microsoft"].includes(key))
                    .slice(0, 5)
                    .map(([crawler, count]) => (
                      <div key={crawler} className="flex items-center justify-between text-sm">
                        {getCrawlerBadge(crawler)}
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  {Object.keys(crawlerLogs.by_crawler || {}).filter(k => ["openai", "anthropic", "perplexity", "google_ai", "cohere", "you", "microsoft"].includes(k)).length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum registro</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(crawlerLogs.by_crawler || {})
                    .filter(([key]) => ["facebook", "twitter", "linkedin", "whatsapp", "telegram"].includes(key))
                    .slice(0, 5)
                    .map(([crawler, count]) => (
                      <div key={crawler} className="flex items-center justify-between text-sm">
                        {getCrawlerBadge(crawler)}
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  {Object.keys(crawlerLogs.by_crawler || {}).filter(k => ["facebook", "twitter", "linkedin", "whatsapp", "telegram"].includes(k)).length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum registro</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs de Acesso ({crawlerLogs.logs?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Crawler</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Caminho</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crawlerLogs.logs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Nenhum log de crawler registrado ainda.
                          <br />
                          <span className="text-sm">Os logs aparecerão quando crawlers visitarem seu site.</span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      crawlerLogs.logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatDate(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>{getCrawlerBadge(log.crawler)}</TableCell>
                          <TableCell>{getCategoryBadge(log.category)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">
                            {log.path}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{log.ip}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Histórico de Edições
              </CardTitle>
              <CardDescription>
                Todas as alterações realizadas nos arquivos SEO
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade registrada</p>
                  <p className="text-sm">Edições nos arquivos aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Arquivo <code className="bg-gray-200 px-1 rounded">{log.file}</code> editado
                        </p>
                        <p className="text-xs text-gray-500">
                          Por {log.user} • {log.content_length} caracteres
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Visitas por Dia (Últimos 7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {crawlerLogs.daily?.length > 0 ? (
                  <div className="space-y-2">
                    {crawlerLogs.daily.map((day) => {
                      const maxCount = Math.max(...crawlerLogs.daily.map(d => d.count));
                      const percentage = (day.count / maxCount) * 100;
                      return (
                        <div key={day._id} className="flex items-center gap-3">
                          <span className="text-sm w-24 text-gray-600">{day._id}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-xs text-white font-bold">{day.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(crawlerLogs.by_category || {}).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(crawlerLogs.by_category).map(([category, count]) => {
                      const total = Object.values(crawlerLogs.by_category).reduce((a, b) => a + b, 0);
                      const percentage = ((count / total) * 100).toFixed(1);
                      const colors = {
                        search_engine: "from-blue-500 to-blue-600",
                        llm: "from-purple-500 to-purple-600",
                        social: "from-pink-500 to-pink-600",
                        other: "from-gray-400 to-gray-500"
                      };
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1">
                            {getCategoryBadge(category)}
                            <span className="text-sm font-bold">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div 
                              className={`h-full bg-gradient-to-r ${colors[category] || colors.other} rounded-full`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Crawlers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏆 Top Crawlers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(crawlerLogs.by_crawler || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12)
                  .map(([crawler, count], index) => (
                    <div key={crawler} className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="text-2xl mb-2">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : CRAWLER_CONFIG[crawler]?.icon || "🤖"}
                      </div>
                      <p className="font-medium text-sm">{CRAWLER_CONFIG[crawler]?.name || crawler}</p>
                      <p className="text-2xl font-bold text-blue-600">{count}</p>
                      <p className="text-xs text-gray-500">visitas</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Editor Dialog */}
      <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Editando: {editingFile?.name}
            </DialogTitle>
            <DialogDescription>
              {FILE_CONFIG[editingFile?.type]?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="font-mono text-sm h-[50vh] resize-none"
              placeholder="Conteúdo do arquivo..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {editContent.length} caracteres • {editContent.split('\n').length} linhas
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingFile(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFile} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* View File Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {viewingFile?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              {viewingFile?.content}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SEOFilesManager;
