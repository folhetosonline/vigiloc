import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Building2, Users, MapPin, TrendingUp, AlertTriangle, 
  Calendar as CalendarIcon, Route, Target, DollarSign,
  ChevronRight, RefreshCw, Loader2, Navigation, Clock,
  CheckCircle, XCircle, Building, Store, Home as HomeIcon,
  BarChart3, PieChart, Map, Filter, Plus, Eye, Play,
  Layers, Thermometer, MapPinned, Compass, Search, Trash2, Edit,
  Phone, Mail, User, FileText, ShieldCheck, Download
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

// Lazy load the map component to avoid SSR issues
const ProspectingMap = lazy(() => import("../../components/ProspectingMap"));

const ProspectingIntel = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState("Santos");
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [generatingRoute, setGeneratingRoute] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [resultData, setResultData] = useState({
    status: "concluido",
    contratos_fechados: 0,
    valor_total: 0,
    notas: ""
  });
  
  // Map controls
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailOpen, setLeadDetailOpen] = useState(false);

  // NEW - Prospects management
  const [prospects, setProspects] = useState([]);
  const [loadingProspects, setLoadingProspects] = useState(false);
  const [tiposPortaria, setTiposPortaria] = useState({});
  const [prospectsStats, setProspectsStats] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [editProspectOpen, setEditProspectOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  
  // Filters for prospects
  const [prospectFilters, setProspectFilters] = useState({
    cidade: "",
    tipo: "",
    tipo_portaria: "",
    interesse: "",
    prioridade: ""
  });

  // New prospect form
  const [newProspect, setNewProspect] = useState({
    nome: "",
    tipo: "condominio",
    cidade: "Santos",
    bairro: "",
    endereco: "",
    telefone: "",
    email: "",
    tipo_portaria: "desconhecido",
    unidades: 0,
    torres: 0,
    sindico: "",
    administradora: "",
    servico_interesse: [],
    valor_estimado: 0,
    notas: ""
  });

  // Scrape form
  const [scrapeForm, setScrapeForm] = useState({
    cidade: "Santos",
    bairro: "",
    tipo: "condominio",
    tipo_portaria: "",
    max_results: 10
  });

  const municipios = [
    "Santos", "São Vicente", "Guarujá", "Praia Grande", 
    "Cubatão", "Itanhaém", "Mongaguá", "Peruíbe", "Bertioga"
  ];

  const bairros = {
    "Santos": ["Gonzaga", "Boqueirão", "Ponta da Praia", "Aparecida", "Vila Mathias", "Centro", "Embaré", "Marapé"],
    "São Vicente": ["Centro", "Itararé", "Gonzaguinha", "Cidade Náutica"],
    "Guarujá": ["Pitangueiras", "Astúrias", "Enseada", "Centro"],
    "Praia Grande": ["Boqueirão", "Guilhermina", "Aviação", "Ocian"],
    "Cubatão": ["Centro", "Vila Nova", "Jardim Casqueiro"],
    "Itanhaém": ["Centro", "Praia do Sonho", "Suarão"],
    "Mongaguá": ["Centro", "Agenor de Campos"],
    "Peruíbe": ["Centro", "Jardim Brasil"],
    "Bertioga": ["Centro", "Riviera", "Indaiá"]
  };

  const interesseOptions = [
    { value: "nao_contatado", label: "Não Contatado", color: "bg-gray-500" },
    { value: "interessado", label: "Interessado", color: "bg-blue-500" },
    { value: "negociando", label: "Em Negociação", color: "bg-yellow-500" },
    { value: "fechado", label: "Fechado", color: "bg-green-500" },
    { value: "descartado", label: "Descartado", color: "bg-red-500" }
  ];

  const servicosOptions = [
    { value: "totem", label: "Totem de Acesso" },
    { value: "cameras", label: "Câmeras CFTV" },
    { value: "controle_acesso", label: "Controle de Acesso" },
    { value: "alarme", label: "Alarme" },
    { value: "portaria_remota", label: "Portaria Remota" },
    { value: "monitoramento", label: "Monitoramento 24h" }
  ];

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard();
    fetchRoutes();
    fetchSchedules();
    fetchTiposPortaria();
  }, []);

  // Auto-fetch leads when municipio changes
  useEffect(() => {
    fetchLeads(selectedMunicipio);
  }, [selectedMunicipio]);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/admin/prospecting/dashboard`, { withCredentials: true });
      setDashboard(response.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (municipio) => {
    setLoadingLeads(true);
    try {
      const response = await axios.get(`${API}/admin/prospecting/leads/${municipio}`, { withCredentials: true });
      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API}/admin/prospecting/routes`, { withCredentials: true });
      setRoutes(response.data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${API}/admin/prospecting/schedules`, { withCredentials: true });
      setSchedules(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchTiposPortaria = async () => {
    try {
      const response = await axios.get(`${API}/admin/prospecting/tipos-portaria`, { withCredentials: true });
      setTiposPortaria(response.data);
    } catch (error) {
      console.error("Error fetching tipos portaria:", error);
    }
  };

  const fetchProspects = async () => {
    setLoadingProspects(true);
    try {
      const params = new URLSearchParams();
      Object.entries(prospectFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${API}/admin/prospecting/prospects?${params.toString()}`, { withCredentials: true });
      setProspects(response.data);
    } catch (error) {
      console.error("Error fetching prospects:", error);
    } finally {
      setLoadingProspects(false);
    }
  };

  const fetchProspectsStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/prospecting/prospects-stats`, { withCredentials: true });
      setProspectsStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    await fetchLeads(selectedMunicipio);
    setRefreshing(false);
    toast.success("Dados atualizados!");
  };

  const handleGenerateRoute = async () => {
    setGeneratingRoute(true);
    try {
      const response = await axios.post(`${API}/admin/prospecting/generate-route`, {
        municipio: selectedMunicipio,
        max_visits: 8
      }, { withCredentials: true });
      toast.success("Rota gerada com sucesso!");
      fetchRoutes();
      setSelectedRoute(response.data);
    } catch (error) {
      toast.error("Erro ao gerar rota");
    } finally {
      setGeneratingRoute(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      await axios.post(`${API}/admin/prospecting/schedule`, {
        route_id: selectedRoute?.id,
        data_agendada: scheduleDate.toISOString(),
        municipio: selectedMunicipio
      }, { withCredentials: true });
      toast.success("Visita agendada!");
      setScheduleDialogOpen(false);
      fetchSchedules();
    } catch (error) {
      toast.error("Erro ao agendar");
    }
  };

  const handleUpdateResult = async () => {
    try {
      await axios.put(`${API}/admin/prospecting/schedules/${selectedSchedule.id}`, resultData, { withCredentials: true });
      toast.success("Resultado registrado!");
      setResultDialogOpen(false);
      fetchSchedules();
      fetchDashboard();
    } catch (error) {
      toast.error("Erro ao salvar resultado");
    }
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setLeadDetailOpen(true);
  };

  // NEW - Prospect handlers
  const handleCreateProspect = async () => {
    try {
      await axios.post(`${API}/admin/prospecting/prospects`, newProspect, { withCredentials: true });
      toast.success("Prospect criado com sucesso!");
      setCreateDialogOpen(false);
      setNewProspect({
        nome: "",
        tipo: "condominio",
        cidade: "Santos",
        bairro: "",
        endereco: "",
        telefone: "",
        email: "",
        tipo_portaria: "desconhecido",
        unidades: 0,
        torres: 0,
        sindico: "",
        administradora: "",
        servico_interesse: [],
        valor_estimado: 0,
        notas: ""
      });
      fetchProspects();
      fetchProspectsStats();
    } catch (error) {
      toast.error("Erro ao criar prospect");
    }
  };

  const handleScrapeProspects = async () => {
    setScraping(true);
    try {
      const response = await axios.post(`${API}/admin/prospecting/scrape`, scrapeForm, { withCredentials: true });
      toast.success(`${response.data.total_created} prospects criados!`);
      setScrapeDialogOpen(false);
      fetchProspects();
      fetchProspectsStats();
    } catch (error) {
      toast.error("Erro ao buscar prospects");
    } finally {
      setScraping(false);
    }
  };

  const handleUpdateProspect = async () => {
    try {
      await axios.put(`${API}/admin/prospecting/prospects/${selectedProspect.id}`, selectedProspect, { withCredentials: true });
      toast.success("Prospect atualizado!");
      setEditProspectOpen(false);
      fetchProspects();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDeleteProspect = async (id) => {
    if (!window.confirm("Excluir este prospect?")) return;
    try {
      await axios.delete(`${API}/admin/prospecting/prospects/${id}`, { withCredentials: true });
      toast.success("Prospect excluído!");
      fetchProspects();
      fetchProspectsStats();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "alta": return "bg-red-500";
      case "media": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const getCrimeColor = (index) => {
    if (index >= 7.5) return "text-red-600";
    if (index >= 6) return "text-orange-500";
    if (index >= 4) return "text-yellow-600";
    return "text-green-600";
  };

  const getPortariaLabel = (tipo) => {
    return tiposPortaria[tipo]?.nome || tipo;
  };

  const getInteresseColor = (interesse) => {
    const opt = interesseOptions.find(o => o.value === interesse);
    return opt?.color || "bg-gray-500";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Prospecção Intel
          </h1>
          <p className="text-gray-600 mt-1">
            Inteligência de mercado para prospecção de clientes • Dados reais IBGE + SSP-SP
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Municípios</p>
                <p className="text-3xl font-bold">{dashboard?.region_stats?.municipios?.length || 0}</p>
              </div>
              <MapPin className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">População</p>
                <p className="text-3xl font-bold">
                  {(dashboard?.region_stats?.totals?.populacao / 1000000)?.toFixed(1) || 0}M
                </p>
              </div>
              <Users className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Condomínios</p>
                <p className="text-3xl font-bold">
                  {dashboard?.region_stats?.totals?.condominios_estimados?.toLocaleString() || 0}
                </p>
              </div>
              <Building2 className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Empresas</p>
                <p className="text-3xl font-bold">
                  {dashboard?.region_stats?.totals?.empresas_estimadas?.toLocaleString() || 0}
                </p>
              </div>
              <Store className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Conversão</p>
                <p className="text-3xl font-bold">{dashboard?.metrics?.taxa_conversao || 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prospects" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full max-w-5xl">
          <TabsTrigger value="prospects" data-testid="tab-prospects">📋 Prospects</TabsTrigger>
          <TabsTrigger value="map" data-testid="tab-map">🗺️ Mapa</TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="zones" data-testid="tab-zones">📍 Zonas</TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads">🎯 Leads</TabsTrigger>
          <TabsTrigger value="routes" data-testid="tab-routes">🛣️ Rotas</TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">📅 Agenda</TabsTrigger>
        </TabsList>

        {/* Prospects Tab - NEW */}
        <TabsContent value="prospects">
          <div className="space-y-6">
            {/* Actions Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-3">
                <Button onClick={() => setCreateDialogOpen(true)} data-testid="create-prospect-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Prospect
                </Button>
                <Button variant="outline" onClick={() => setScrapeDialogOpen(true)} data-testid="scrape-prospects-btn">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Automático
                </Button>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={prospectFilters.cidade || "all"} onValueChange={(v) => setProspectFilters({...prospectFilters, cidade: v === "all" ? "" : v})}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={prospectFilters.tipo_portaria || "all"} onValueChange={(v) => setProspectFilters({...prospectFilters, tipo_portaria: v === "all" ? "" : v})}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo Portaria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(tiposPortaria).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={prospectFilters.interesse || "all"} onValueChange={(v) => setProspectFilters({...prospectFilters, interesse: v === "all" ? "" : v})}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {interesseOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchProspects} data-testid="filter-prospects-btn">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            {prospectsStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">{prospectsStats.total}</p>
                    <p className="text-sm text-gray-500">Total Prospects</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{prospectsStats.by_interesse?.interessado || 0}</p>
                    <p className="text-sm text-gray-500">Interessados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-600">{prospectsStats.by_interesse?.negociando || 0}</p>
                    <p className="text-sm text-gray-500">Em Negociação</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{prospectsStats.by_interesse?.fechado || 0}</p>
                    <p className="text-sm text-gray-500">Fechados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-500">{prospectsStats.by_interesse?.nao_contatado || 0}</p>
                    <p className="text-sm text-gray-500">Não Contatados</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Prospects List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Lista de Prospects
                </CardTitle>
                <CardDescription>
                  {prospects.length} prospects encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProspects ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : prospects.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {prospects.map(prospect => (
                        <div key={prospect.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{prospect.nome}</span>
                              <Badge className={getInteresseColor(prospect.interesse)}>
                                {interesseOptions.find(o => o.value === prospect.interesse)?.label || prospect.interesse}
                              </Badge>
                              <Badge variant="outline">{getPortariaLabel(prospect.tipo_portaria)}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {prospect.endereco && `${prospect.endereco}, `}{prospect.bairro}, {prospect.cidade}
                            </p>
                            <div className="flex gap-4 mt-1 text-sm text-gray-500">
                              {prospect.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{prospect.telefone}</span>}
                              {prospect.unidades > 0 && <span>{prospect.unidades} unidades</span>}
                              {prospect.valor_estimado > 0 && <span className="text-green-600 font-medium">R$ {prospect.valor_estimado.toLocaleString()}</span>}
                            </div>
                          </div>
                          
                          <Badge className={getPriorityColor(prospect.prioridade)}>
                            {prospect.prioridade}
                          </Badge>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedProspect(prospect); setEditProspectOpen(true); }} data-testid={`edit-prospect-${prospect.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDeleteProspect(prospect.id)} data-testid={`delete-prospect-${prospect.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Nenhum prospect encontrado</p>
                    <p className="text-sm text-gray-400 mb-4">Crie prospects manualmente ou use a busca automática</p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Manualmente
                      </Button>
                      <Button variant="outline" onClick={() => setScrapeDialogOpen(true)}>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar Automático
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map Controls */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5" />
                  Controles do Mapa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Município</Label>
                  <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio}>
                    <SelectTrigger className="w-full mt-1" data-testid="map-municipio-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Heatmap Crime</span>
                  </div>
                  <Switch 
                    checked={showHeatmap} 
                    onCheckedChange={setShowHeatmap}
                    data-testid="heatmap-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Clusters</span>
                  </div>
                  <Switch 
                    checked={showClusters} 
                    onCheckedChange={setShowClusters}
                    data-testid="clusters-toggle"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Legenda</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span>Prioridade Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span>Prioridade Média</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span>Prioridade Baixa</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleGenerateRoute}
                  disabled={generatingRoute || leads.length === 0}
                  data-testid="generate-route-btn"
                >
                  {generatingRoute ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                  ) : (
                    <><Route className="w-4 h-4 mr-2" /> Gerar Rota</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="w-5 h-5" />
                      Mapa - {selectedMunicipio}
                    </CardTitle>
                    <CardDescription>
                      {leads.length} zonas mapeadas
                    </CardDescription>
                  </div>
                  {loadingLeads && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={
                  <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                }>
                  <ProspectingMap
                    leads={leads}
                    selectedMunicipio={selectedMunicipio}
                    showHeatmap={showHeatmap}
                    showClusters={showClusters}
                    route={selectedRoute}
                    onLeadClick={handleLeadClick}
                    height="500px"
                  />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Ranking de Oportunidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard?.region_stats?.municipios
                    ?.sort((a, b) => b.indice_oportunidade - a.indice_oportunidade)
                    .map((mun, index) => (
                      <div key={mun.codigo_ibge} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{mun.nome}</span>
                            <span className="text-sm text-gray-500">{mun.indice_oportunidade}/10</span>
                          </div>
                          <Progress value={mun.indice_oportunidade * 10} className="h-2" />
                        </div>
                        <Badge className={getCrimeColor(mun.dados_crime?.indice)}>
                          {mun.dados_crime?.indice}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Sazonalidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Demanda Atual:</span>
                    <Badge className={
                      dashboard?.seasonality?.mes_atual?.indice_demanda === "Alto" ? "bg-red-500" :
                      dashboard?.seasonality?.mes_atual?.indice_demanda === "Médio-Alto" ? "bg-orange-500" : "bg-green-500"
                    }>
                      {dashboard?.seasonality?.mes_atual?.indice_demanda}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{dashboard?.seasonality?.mes_atual?.recomendacao}</p>
                </div>

                <div className="space-y-3">
                  {dashboard?.seasonality?.periodos_alta_demanda?.map((periodo, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{periodo.periodo}</span>
                        <Badge variant="outline" className="text-green-600">{periodo.aumento_demanda}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{periodo.motivo}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Zonas por Município</CardTitle>
                <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeads ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads.map(lead => (
                    <Card key={lead.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLeadClick(lead)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{lead.zona}</h4>
                            <p className="text-sm text-gray-500">{lead.endereco_aproximado}</p>
                          </div>
                          <Badge className={getPriorityColor(lead.prioridade)}>{lead.prioridade}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span>{lead.potencial_condominios} cond.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Store className="w-4 h-4 text-purple-500" />
                            <span>{lead.potencial_empresas} emp.</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t mt-3">
                          <span className="text-green-600 font-medium">{lead.chance_fechamento}%</span>
                          <Badge variant="outline">{lead.tipo}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Oportunidades de Prospecção</CardTitle>
                  <CardDescription>Leads ordenados por probabilidade</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateRoute} disabled={generatingRoute}>
                    <Route className="w-4 h-4 mr-2" />
                    Gerar Rota
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {leads.sort((a, b) => b.chance_fechamento - a.chance_fechamento).map((lead, index) => (
                    <div key={lead.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => handleLeadClick(lead)}>
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{lead.zona}</span>
                          <Badge className={getPriorityColor(lead.prioridade)}>{lead.prioridade}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{lead.endereco_aproximado}</p>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-2xl font-bold text-green-600">{lead.chance_fechamento}%</div>
                      </div>
                      <div className="text-center px-4 border-l">
                        <Building2 className="w-4 h-4 mx-auto" />
                        <span>{lead.potencial_condominios}</span>
                      </div>
                      <div className="text-sm text-gray-500 px-4 border-l">
                        {lead.melhor_horario}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedRoute && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-blue-500" />
                        Rota Gerada
                      </CardTitle>
                      <CardDescription>
                        {selectedRoute.total_visitas} paradas • {selectedRoute.tempo_estimado}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setScheduleDialogOpen(true)}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Agendar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedRoute.paradas?.map((parada, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                          {parada.ordem}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{parada.local}</p>
                          <p className="text-sm text-gray-500">{parada.endereco}</p>
                        </div>
                        <Badge variant="outline">{parada.tipo}</Badge>
                        <span className="text-green-600 font-bold">{parada.chance_fechamento}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={selectedRoute ? "" : "lg:col-span-2"}>
              <CardHeader>
                <CardTitle>Rotas Salvas</CardTitle>
              </CardHeader>
              <CardContent>
                {routes.length > 0 ? (
                  <div className="space-y-3">
                    {routes.map(route => (
                      <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{route.id}</p>
                          <p className="text-sm text-gray-500">{route.total_visitas} visitas</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={route.status === "concluido" ? "default" : "secondary"}>{route.status}</Badge>
                          <Button size="sm" variant="outline" onClick={() => setSelectedRoute(route)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Route className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Nenhuma rota gerada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Agenda de Prospecção</CardTitle>
              </CardHeader>
              <CardContent>
                {schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules.map(schedule => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {new Date(schedule.data_agendada).toLocaleDateString('pt-BR', {
                                weekday: 'long', day: 'numeric', month: 'long'
                              })}
                            </span>
                            <Badge>{schedule.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">{schedule.municipio} • {schedule.vendedor}</p>
                          {schedule.contratos_fechados > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>{schedule.contratos_fechados} contrato(s) • R$ {schedule.valor_total?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        {schedule.status === "agendado" && (
                          <Button size="sm" onClick={() => { setSelectedSchedule(schedule); setResultDialogOpen(true); }}>
                            <Play className="w-4 h-4 mr-1" />
                            Registrar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Nenhuma visita agendada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{dashboard?.metrics?.total_visitas || 0}</p>
                  <p className="text-sm text-gray-600">Total Visitas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{dashboard?.metrics?.taxa_conversao || 0}%</p>
                  <p className="text-sm text-gray-600">Conversão</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">R$ {(dashboard?.metrics?.receita_gerada || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Receita</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Prospect Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Prospect</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input
                value={newProspect.nome}
                onChange={(e) => setNewProspect({...newProspect, nome: e.target.value})}
                placeholder="Nome do condomínio ou empresa"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select value={newProspect.tipo} onValueChange={(v) => setNewProspect({...newProspect, tipo: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="condominio">Condomínio</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Portaria</Label>
              <Select value={newProspect.tipo_portaria} onValueChange={(v) => setNewProspect({...newProspect, tipo_portaria: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tiposPortaria).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cidade</Label>
              <Select value={newProspect.cidade} onValueChange={(v) => setNewProspect({...newProspect, cidade: v, bairro: ""})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Bairro</Label>
              <Select value={newProspect.bairro} onValueChange={(v) => setNewProspect({...newProspect, bairro: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(bairros[newProspect.cidade] || []).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Endereço</Label>
              <Input
                value={newProspect.endereco}
                onChange={(e) => setNewProspect({...newProspect, endereco: e.target.value})}
                placeholder="Rua, número"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={newProspect.telefone}
                onChange={(e) => setNewProspect({...newProspect, telefone: e.target.value})}
                placeholder="(13) 99999-9999"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={newProspect.email}
                onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                placeholder="contato@exemplo.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Unidades</Label>
              <Input
                type="number"
                value={newProspect.unidades}
                onChange={(e) => setNewProspect({...newProspect, unidades: parseInt(e.target.value) || 0})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Torres</Label>
              <Input
                type="number"
                value={newProspect.torres}
                onChange={(e) => setNewProspect({...newProspect, torres: parseInt(e.target.value) || 0})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Síndico</Label>
              <Input
                value={newProspect.sindico}
                onChange={(e) => setNewProspect({...newProspect, sindico: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Administradora</Label>
              <Input
                value={newProspect.administradora}
                onChange={(e) => setNewProspect({...newProspect, administradora: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Valor Estimado (R$)</Label>
              <Input
                type="number"
                value={newProspect.valor_estimado}
                onChange={(e) => setNewProspect({...newProspect, valor_estimado: parseFloat(e.target.value) || 0})}
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label>Notas</Label>
              <Textarea
                value={newProspect.notas}
                onChange={(e) => setNewProspect({...newProspect, notas: e.target.value})}
                placeholder="Observações..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProspect} data-testid="confirm-create-prospect-btn">Criar Prospect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scrape Dialog */}
      <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Busca Automática de Prospects
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={scrapeForm.tipo} onValueChange={(v) => setScrapeForm({...scrapeForm, tipo: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="condominio">Condomínios</SelectItem>
                  <SelectItem value="empresa">Empresas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cidade</Label>
              <Select value={scrapeForm.cidade} onValueChange={(v) => setScrapeForm({...scrapeForm, cidade: v, bairro: ""})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Bairro (opcional)</Label>
              <Select value={scrapeForm.bairro || "all"} onValueChange={(v) => setScrapeForm({...scrapeForm, bairro: v === "all" ? "" : v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos os bairros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(bairros[scrapeForm.cidade] || []).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Portaria (opcional)</Label>
              <Select value={scrapeForm.tipo_portaria} onValueChange={(v) => setScrapeForm({...scrapeForm, tipo_portaria: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(tiposPortaria).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantidade máxima</Label>
              <Input
                type="number"
                value={scrapeForm.max_results}
                onChange={(e) => setScrapeForm({...scrapeForm, max_results: parseInt(e.target.value) || 10})}
                min={1}
                max={50}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-1">Fontes de dados:</p>
              <ul className="list-disc list-inside">
                <li>Diretórios de empresas públicos</li>
                <li>Listagens do Google Maps</li>
                <li>Cadastros municipais</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScrapeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleScrapeProspects} disabled={scraping} data-testid="confirm-scrape-btn">
              {scraping ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Buscar Prospects</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Prospect Dialog */}
      <Dialog open={editProspectOpen} onOpenChange={setEditProspectOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Prospect</DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input
                  value={selectedProspect.nome}
                  onChange={(e) => setSelectedProspect({...selectedProspect, nome: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={selectedProspect.interesse} onValueChange={(v) => setSelectedProspect({...selectedProspect, interesse: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interesseOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Portaria</Label>
                <Select value={selectedProspect.tipo_portaria} onValueChange={(v) => setSelectedProspect({...selectedProspect, tipo_portaria: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tiposPortaria).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Telefone</Label>
                <Input
                  value={selectedProspect.telefone || ""}
                  onChange={(e) => setSelectedProspect({...selectedProspect, telefone: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={selectedProspect.email || ""}
                  onChange={(e) => setSelectedProspect({...selectedProspect, email: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Unidades</Label>
                <Input
                  type="number"
                  value={selectedProspect.unidades || 0}
                  onChange={(e) => setSelectedProspect({...selectedProspect, unidades: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Valor Estimado (R$)</Label>
                <Input
                  type="number"
                  value={selectedProspect.valor_estimado || 0}
                  onChange={(e) => setSelectedProspect({...selectedProspect, valor_estimado: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Síndico</Label>
                <Input
                  value={selectedProspect.sindico || ""}
                  onChange={(e) => setSelectedProspect({...selectedProspect, sindico: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Administradora</Label>
                <Input
                  value={selectedProspect.administradora || ""}
                  onChange={(e) => setSelectedProspect({...selectedProspect, administradora: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label>Notas</Label>
                <Textarea
                  value={selectedProspect.notas || ""}
                  onChange={(e) => setSelectedProspect({...selectedProspect, notas: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProspectOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateProspect} data-testid="confirm-update-prospect-btn">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <Dialog open={leadDetailOpen} onOpenChange={setLeadDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedLead?.zona}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Endereço</p>
                <p className="font-medium">{selectedLead.endereco_aproximado}</p>
                <p className="text-sm text-gray-500">{selectedLead.municipio}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg text-center">
                  <Building2 className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{selectedLead.potencial_condominios}</p>
                  <p className="text-xs text-gray-500">Condomínios</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <Store className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                  <p className="text-2xl font-bold">{selectedLead.potencial_empresas}</p>
                  <p className="text-xs text-gray-500">Empresas</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <AlertTriangle className={`w-6 h-6 mx-auto mb-1 ${getCrimeColor(selectedLead.indice_criminalidade)}`} />
                  <p className="text-2xl font-bold">{selectedLead.indice_criminalidade}</p>
                  <p className="text-xs text-gray-500">Índice Crime</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <Target className="w-6 h-6 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold text-green-600">{selectedLead.chance_fechamento}%</p>
                  <p className="text-xs text-gray-500">Chance</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Melhor Horário:</span>
                </div>
                <span className="font-bold">{selectedLead.melhor_horario}</span>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getPriorityColor(selectedLead.prioridade)}>
                  Prioridade {selectedLead.prioridade?.toUpperCase()}
                </Badge>
                <Badge variant="outline">{selectedLead.tipo}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadDetailOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data da Visita</Label>
              <Calendar
                mode="single"
                selected={scheduleDate}
                onSelect={setScheduleDate}
                className="rounded-md border mt-2"
              />
            </div>
            <div>
              <Label>Município</Label>
              <Input value={selectedMunicipio} disabled className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSchedule}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Resultado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={resultData.status} onValueChange={(v) => setResultData({...resultData, status: v})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contratos Fechados</Label>
              <Input 
                type="number" 
                value={resultData.contratos_fechados}
                onChange={(e) => setResultData({...resultData, contratos_fechados: parseInt(e.target.value) || 0})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Valor Total (R$)</Label>
              <Input 
                type="number"
                value={resultData.valor_total}
                onChange={(e) => setResultData({...resultData, valor_total: parseFloat(e.target.value) || 0})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={resultData.notas}
                onChange={(e) => setResultData({...resultData, notas: e.target.value})}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateResult}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectingIntel;
