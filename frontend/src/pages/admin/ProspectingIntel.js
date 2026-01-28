import { useState, useEffect } from "react";
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
import { 
  Building2, Users, MapPin, TrendingUp, AlertTriangle, 
  Calendar as CalendarIcon, Route, Target, DollarSign,
  ChevronRight, RefreshCw, Loader2, Navigation, Clock,
  CheckCircle, XCircle, Building, Store, Home as HomeIcon,
  BarChart3, PieChart, Map, Filter, Plus, Eye, Play
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

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

  const municipios = [
    "Santos", "São Vicente", "Guarujá", "Praia Grande", 
    "Cubatão", "Itanhaém", "Mongaguá", "Peruíbe", "Bertioga"
  ];

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard();
    fetchRoutes();
    fetchSchedules();
  }, []);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
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
            Inteligência de mercado para prospecção de clientes
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar Dados
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Municípios</p>
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
                <p className="text-green-100 text-sm">Condomínios Est.</p>
                <p className="text-3xl font-bold">
                  {dashboard?.region_stats?.totals?.condominios_estimados?.toLocaleString() || 0}
                </p>
              </div>
              <Building2 className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Empresas Est.</p>
                <p className="text-3xl font-bold">
                  {dashboard?.region_stats?.totals?.empresas_estimadas?.toLocaleString() || 0}
                </p>
              </div>
              <Store className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Taxa Conversão</p>
                <p className="text-3xl font-bold">{dashboard?.metrics?.taxa_conversao || 0}%</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Contratos</p>
                <p className="text-3xl font-bold">{dashboard?.metrics?.contratos_fechados || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="zones">🗺️ Zonas</TabsTrigger>
          <TabsTrigger value="leads">🎯 Leads</TabsTrigger>
          <TabsTrigger value="routes">🛣️ Rotas</TabsTrigger>
          <TabsTrigger value="schedule">📅 Agenda</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Municipalities Ranking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Ranking de Oportunidades
                </CardTitle>
                <CardDescription>
                  Municípios ordenados por índice de oportunidade
                </CardDescription>
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
                            <span className="text-sm text-gray-500">
                              {mun.indice_oportunidade}/10
                            </span>
                          </div>
                          <Progress value={mun.indice_oportunidade * 10} className="h-2" />
                        </div>
                        <Badge className={getCrimeColor(mun.dados_crime?.indice)}>
                          Crime: {mun.dados_crime?.indice}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Seasonality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Sazonalidade
                </CardTitle>
                <CardDescription>
                  Períodos de alta demanda por segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Demanda Atual:</span>
                    <Badge className={
                      dashboard?.seasonality?.mes_atual?.indice_demanda === "Alto" ? "bg-red-500" :
                      dashboard?.seasonality?.mes_atual?.indice_demanda === "Médio-Alto" ? "bg-orange-500" :
                      "bg-green-500"
                    }>
                      {dashboard?.seasonality?.mes_atual?.indice_demanda}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {dashboard?.seasonality?.mes_atual?.recomendacao}
                  </p>
                </div>

                <div className="space-y-3">
                  {dashboard?.seasonality?.periodos_alta_demanda?.map((periodo, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{periodo.periodo}</span>
                        <Badge variant="outline" className="text-green-600">
                          {periodo.aumento_demanda}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{periodo.motivo}</p>
                      <div className="flex gap-1 mt-2">
                        {periodo.crimes_mais_comuns?.map((crime, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {crime.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Crime Statistics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Estatísticas de Criminalidade por Município
                </CardTitle>
                <CardDescription>
                  Dados baseados em estatísticas da SSP-SP (2023-2024)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Município</th>
                        <th className="text-center py-2">Furto Res.</th>
                        <th className="text-center py-2">Roubo Res.</th>
                        <th className="text-center py-2">Furto Veíc.</th>
                        <th className="text-center py-2">Roubo Veíc.</th>
                        <th className="text-center py-2">Índice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard?.region_stats?.municipios?.map((mun) => (
                        <tr key={mun.codigo_ibge} className="border-b hover:bg-gray-50">
                          <td className="py-2 font-medium">{mun.nome}</td>
                          <td className="text-center py-2">{mun.dados_crime?.furto_residencia || 0}</td>
                          <td className="text-center py-2">{mun.dados_crime?.roubo_residencia || 0}</td>
                          <td className="text-center py-2">{mun.dados_crime?.furto_veiculo || 0}</td>
                          <td className="text-center py-2">{mun.dados_crime?.roubo_veiculo || 0}</td>
                          <td className="text-center py-2">
                            <Badge className={getCrimeColor(mun.dados_crime?.indice)}>
                              {mun.dados_crime?.indice}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    Zonas por Município
                  </CardTitle>
                  <CardDescription>
                    Bairros e áreas com potencial de prospecção
                  </CardDescription>
                </div>
                <Select value={selectedMunicipio} onValueChange={(v) => { setSelectedMunicipio(v); fetchLeads(v); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeads ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{lead.zona}</h4>
                            <p className="text-sm text-gray-500">{lead.endereco_aproximado}</p>
                          </div>
                          <Badge className={getPriorityColor(lead.prioridade)}>
                            {lead.prioridade}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span>{lead.potencial_condominios} cond.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Store className="w-4 h-4 text-purple-500" />
                            <span>{lead.potencial_empresas} emp.</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className={`w-4 h-4 ${getCrimeColor(lead.indice_criminalidade)}`} />
                            <span>Crime: {lead.indice_criminalidade}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{lead.melhor_horario}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-green-600">
                              {lead.chance_fechamento}% chance
                            </span>
                          </div>
                          <Badge variant="outline">
                            {lead.tipo}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {leads.length === 0 && !loadingLeads && (
                <div className="text-center py-12">
                  <Map className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">Selecione um município para ver as zonas</p>
                  <Button className="mt-4" onClick={() => fetchLeads(selectedMunicipio)}>
                    Carregar Zonas
                  </Button>
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
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Oportunidades de Prospecção
                  </CardTitle>
                  <CardDescription>
                    Leads ordenados por probabilidade de fechamento
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <Select value={selectedMunicipio} onValueChange={(v) => { setSelectedMunicipio(v); fetchLeads(v); }}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleGenerateRoute} disabled={generatingRoute || leads.length === 0}>
                    {generatingRoute ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                    ) : (
                      <><Route className="w-4 h-4 mr-2" /> Gerar Rota</>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {leads
                    .sort((a, b) => b.chance_fechamento - a.chance_fechamento)
                    .map((lead, index) => (
                      <div key={lead.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {index + 1}
                        </span>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{lead.zona}</span>
                            <Badge className={getPriorityColor(lead.prioridade)} variant="secondary">
                              {lead.prioridade}
                            </Badge>
                            <Badge variant="outline">{lead.tipo}</Badge>
                          </div>
                          <p className="text-sm text-gray-500">{lead.endereco_aproximado}</p>
                        </div>

                        <div className="text-center px-4">
                          <div className="text-2xl font-bold text-green-600">{lead.chance_fechamento}%</div>
                          <div className="text-xs text-gray-500">chance</div>
                        </div>

                        <div className="text-center px-4 border-l">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">{lead.potencial_condominios}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Store className="w-4 h-4" />
                            <span className="font-medium">{lead.potencial_empresas}</span>
                          </div>
                        </div>

                        <div className="text-center px-4 border-l">
                          <Clock className="w-4 h-4 mx-auto mb-1" />
                          <span className="text-sm">{lead.melhor_horario}</span>
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
            {/* Generated Route Preview */}
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
                        {selectedRoute.total_visitas} paradas • {selectedRoute.tempo_estimado} • 
                        {selectedRoute.probabilidade_media.toFixed(1)}% média de conversão
                      </CardDescription>
                    </div>
                    <Button onClick={() => { setScheduleDialogOpen(true); }}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Agendar Visita
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
                        <div className="text-center">
                          <span className="text-green-600 font-bold">{parada.chance_fechamento}%</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {parada.horario_sugerido}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Saved Routes */}
            <Card className={selectedRoute ? "" : "lg:col-span-2"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Rotas Salvas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routes.length > 0 ? (
                  <div className="space-y-3">
                    {routes.map((route) => (
                      <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{route.id}</p>
                          <p className="text-sm text-gray-500">
                            {route.total_visitas} visitas • {new Date(route.data_criacao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={route.status === "concluido" ? "default" : "secondary"}>
                            {route.status}
                          </Badge>
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
                    <p className="text-gray-500">Nenhuma rota gerada ainda</p>
                    <p className="text-sm text-gray-400">Selecione um município e gere uma rota</p>
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
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Agenda de Prospecção
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schedules.length > 0 ? (
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {new Date(schedule.data_agendada).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </span>
                            <Badge variant={
                              schedule.status === "concluido" ? "default" :
                              schedule.status === "agendado" ? "secondary" :
                              "outline"
                            }>
                              {schedule.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {schedule.municipio} • {schedule.vendedor}
                          </p>
                          {schedule.contratos_fechados > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600 font-medium">
                                {schedule.contratos_fechados} contrato(s) • R$ {schedule.valor_total?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {schedule.status === "agendado" && (
                            <Button 
                              size="sm" 
                              onClick={() => { setSelectedSchedule(schedule); setResultDialogOpen(true); }}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Registrar
                            </Button>
                          )}
                        </div>
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

            {/* Success Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Métricas de Sucesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{dashboard?.metrics?.total_visitas || 0}</p>
                  <p className="text-sm text-gray-600">Total de Visitas</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{dashboard?.metrics?.visitas_sucesso || 0}</p>
                  <p className="text-sm text-gray-600">Visitas com Sucesso</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{dashboard?.metrics?.taxa_conversao || 0}%</p>
                  <p className="text-sm text-gray-600">Taxa de Conversão</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-3xl font-bold text-emerald-600">
                    R$ {(dashboard?.metrics?.receita_gerada || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Receita Gerada</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
                className="rounded-md border"
              />
            </div>
            <div>
              <Label>Município</Label>
              <Input value={selectedMunicipio} disabled />
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
            <DialogTitle>Registrar Resultado da Visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={resultData.status} onValueChange={(v) => setResultData({...resultData, status: v})}>
                <SelectTrigger>
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
              />
            </div>
            <div>
              <Label>Valor Total (R$)</Label>
              <Input 
                type="number"
                value={resultData.valor_total}
                onChange={(e) => setResultData({...resultData, valor_total: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={resultData.notas}
                onChange={(e) => setResultData({...resultData, notas: e.target.value})}
                placeholder="Anotações sobre a visita..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateResult}>Salvar Resultado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectingIntel;
