import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Save, Eye, Video, Image as ImageIcon, Type, BarChart3, 
  Plus, Trash2, GripVertical, MoveUp, MoveDown, Loader2,
  Shield, Clock, Users, Award, Zap, CheckCircle, Star,
  Home, Sparkles, Play, RefreshCw
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const HomepageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [services, setServices] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const videoRef = useRef(null);

  // Fetch settings and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, servicesRes] = await Promise.all([
          axios.get(`${API}/admin/homepage-settings`, { withCredentials: true }),
          axios.get(`${API}/services`)
        ]);
        setSettings(settingsRes.data);
        setServices(servicesRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/homepage-settings`, settings, { withCredentials: true });
      toast.success("Homepage atualizada com sucesso!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (field, value) => {
    setSettings(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateStat = (index, field, value) => {
    setSettings(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.map((stat, i) => 
          i === index ? { ...stat, [field]: value } : stat
        )
      }
    }));
  };

  const addStat = () => {
    setSettings(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: [...prev.hero.stats, { value: "0", label: "Nova Estatística" }]
      }
    }));
  };

  const removeStat = (index) => {
    setSettings(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.filter((_, i) => i !== index)
      }
    }));
  };

  const moveStat = (index, direction) => {
    const stats = [...settings.hero.stats];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= stats.length) return;
    [stats[index], stats[newIndex]] = [stats[newIndex], stats[index]];
    setSettings(prev => ({
      ...prev,
      hero: { ...prev.hero, stats }
    }));
  };

  const updateServices = (field, value) => {
    setSettings(prev => ({
      ...prev,
      services: { ...prev.services, [field]: value }
    }));
  };

  const updateFeatures = (field, value) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [field]: value }
    }));
  };

  const updateFeatureItem = (index, field, value) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const addFeatureItem = () => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: [...prev.features.items, { icon: "Star", title: "Novo Diferencial", description: "Descrição do diferencial" }]
      }
    }));
  };

  const removeFeatureItem = (index) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCTA = (field, value) => {
    setSettings(prev => ({
      ...prev,
      cta_section: { ...prev.cta_section, [field]: value }
    }));
  };

  const iconOptions = [
    { value: "Shield", label: "🛡️ Escudo", icon: <Shield className="w-4 h-4" /> },
    { value: "Clock", label: "⏰ Relógio", icon: <Clock className="w-4 h-4" /> },
    { value: "Users", label: "👥 Usuários", icon: <Users className="w-4 h-4" /> },
    { value: "Award", label: "🏆 Prêmio", icon: <Award className="w-4 h-4" /> },
    { value: "Zap", label: "⚡ Energia", icon: <Zap className="w-4 h-4" /> },
    { value: "CheckCircle", label: "✅ Check", icon: <CheckCircle className="w-4 h-4" /> },
    { value: "Star", label: "⭐ Estrela", icon: <Star className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Home className="w-8 h-8 text-blue-500" />
            Editor da Homepage
          </h1>
          <p className="text-gray-600 mt-1">
            Personalize completamente a página inicial do seu site
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.open("/", "_blank")}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar Site
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            Hero/Banner
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Diferenciais
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Editor */}
        <TabsContent value="hero">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Vídeo/Imagem de Fundo
                  </CardTitle>
                  <CardDescription>
                    Configure o background do hero principal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>URL do Vídeo (MP4)</Label>
                    <Input
                      value={settings.hero.video_url || ""}
                      onChange={(e) => updateHero("video_url", e.target.value)}
                      placeholder="https://exemplo.com/video.mp4"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use vídeos hospedados em CDN para melhor performance
                    </p>
                  </div>
                  <div>
                    <Label>Imagem de Poster (fallback)</Label>
                    <Input
                      value={settings.hero.poster_url || ""}
                      onChange={(e) => updateHero("poster_url", e.target.value)}
                      placeholder="https://exemplo.com/poster.jpg"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Textos do Hero
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Badge/Destaque</Label>
                    <Input
                      value={settings.hero.badge_text || ""}
                      onChange={(e) => updateHero("badge_text", e.target.value)}
                      placeholder="🛡️ Líder em Segurança Eletrônica"
                    />
                  </div>
                  <div>
                    <Label>Título Principal (suporta HTML)</Label>
                    <Textarea
                      value={settings.hero.title || ""}
                      onChange={(e) => updateHero("title", e.target.value)}
                      placeholder="Seu título aqui..."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use &lt;span class='text-blue-400'&gt;texto&lt;/span&gt; para destaque
                    </p>
                  </div>
                  <div>
                    <Label>Subtítulo</Label>
                    <Textarea
                      value={settings.hero.subtitle || ""}
                      onChange={(e) => updateHero("subtitle", e.target.value)}
                      placeholder="Descrição do seu negócio..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Botões de Ação (CTA)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Texto Botão Principal</Label>
                      <Input
                        value={settings.hero.cta_primary_text || ""}
                        onChange={(e) => updateHero("cta_primary_text", e.target.value)}
                        placeholder="Fale Conosco"
                      />
                    </div>
                    <div>
                      <Label>URL (deixe vazio para WhatsApp)</Label>
                      <Input
                        value={settings.hero.cta_primary_url || ""}
                        onChange={(e) => updateHero("cta_primary_url", e.target.value)}
                        placeholder="/contato"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Texto Botão Secundário</Label>
                      <Input
                        value={settings.hero.cta_secondary_text || ""}
                        onChange={(e) => updateHero("cta_secondary_text", e.target.value)}
                        placeholder="Conheça Nossos Serviços"
                      />
                    </div>
                    <div>
                      <Label>URL Botão Secundário</Label>
                      <Input
                        value={settings.hero.cta_secondary_url || ""}
                        onChange={(e) => updateHero("cta_secondary_url", e.target.value)}
                        placeholder="/servicos"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview do Hero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                    {settings.hero.video_url && (
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        src={settings.hero.video_url}
                        poster={settings.hero.poster_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                      {settings.hero.badge_text && (
                        <span className="text-xs bg-blue-600/30 px-2 py-1 rounded-full mb-2">
                          {settings.hero.badge_text}
                        </span>
                      )}
                      <h2 
                        className="text-lg font-bold mb-2 leading-tight"
                        dangerouslySetInnerHTML={{ __html: settings.hero.title }}
                      />
                      <p className="text-xs opacity-90 mb-3 line-clamp-2">
                        {settings.hero.subtitle}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-500 text-xs h-7">
                          {settings.hero.cta_primary_text || "CTA"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 border-white text-white">
                          {settings.hero.cta_secondary_text || "Secundário"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Stats Editor */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Estatísticas em Destaque
                  </CardTitle>
                  <CardDescription>
                    Números que aparecem no hero da homepage
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.hero.show_stats}
                      onCheckedChange={(v) => updateHero("show_stats", v)}
                    />
                    <Label>Exibir estatísticas</Label>
                  </div>
                  <Button onClick={addStat} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.hero.stats?.map((stat, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Valor</Label>
                        <Input
                          value={stat.value}
                          onChange={(e) => updateStat(index, "value", e.target.value)}
                          placeholder="+500"
                          className="font-bold text-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={stat.label}
                          onChange={(e) => updateStat(index, "label", e.target.value)}
                          placeholder="Clientes Atendidos"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => moveStat(index, -1)} disabled={index === 0}>
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => moveStat(index, 1)} disabled={index === settings.hero.stats.length - 1}>
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeStat(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Preview */}
              <div className="mt-6 p-6 bg-gray-900 rounded-lg">
                <p className="text-white text-sm mb-4 opacity-70">Preview das estatísticas:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {settings.hero.stats?.map((stat, index) => (
                    <div key={index} className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                      <div className="text-xs text-white/80">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Section Editor */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Seção de Serviços
                  </CardTitle>
                  <CardDescription>
                    Configure como os serviços são exibidos na homepage
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.services?.enabled}
                    onCheckedChange={(v) => updateServices("enabled", v)}
                  />
                  <Label>Exibir seção</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título da Seção</Label>
                  <Input
                    value={settings.services?.title || ""}
                    onChange={(e) => updateServices("title", e.target.value)}
                    placeholder="Nossas Soluções"
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={settings.services?.subtitle || ""}
                    onChange={(e) => updateServices("subtitle", e.target.value)}
                    placeholder="Tecnologia de ponta..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.services?.show_all_button}
                  onCheckedChange={(v) => updateServices("show_all_button", v)}
                />
                <Label>Mostrar botão "Ver Todos os Serviços"</Label>
              </div>

              <div>
                <Label className="mb-2 block">Serviços em Destaque (selecione para exibir apenas estes)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        settings.services?.featured_ids?.includes(service.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        const currentIds = settings.services?.featured_ids || [];
                        const newIds = currentIds.includes(service.id)
                          ? currentIds.filter(id => id !== service.id)
                          : [...currentIds, service.id];
                        updateServices("featured_ids", newIds);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{service.icon || '🛡️'}</span>
                        <span className="font-medium text-sm">{service.name}</span>
                      </div>
                      {settings.services?.featured_ids?.includes(service.id) && (
                        <Badge className="mt-2 bg-blue-500">Selecionado</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {settings.services?.featured_ids?.length > 0 
                    ? `${settings.services.featured_ids.length} serviço(s) selecionado(s)` 
                    : "Nenhum selecionado - todos os serviços publicados serão exibidos"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features/Differentials Editor */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Diferenciais da Empresa
                  </CardTitle>
                  <CardDescription>
                    Destaque os pontos fortes do seu negócio
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.features?.enabled}
                      onCheckedChange={(v) => updateFeatures("enabled", v)}
                    />
                    <Label>Exibir seção</Label>
                  </div>
                  <Button onClick={addFeatureItem} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Título da Seção</Label>
                <Input
                  value={settings.features?.title || ""}
                  onChange={(e) => updateFeatures("title", e.target.value)}
                  placeholder="Por que escolher a VigiLoc?"
                />
              </div>

              <div className="space-y-4">
                {settings.features?.items?.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Ícone</Label>
                        <Select value={item.icon} onValueChange={(v) => updateFeatureItem(index, "icon", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  {opt.icon} {opt.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Título</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateFeatureItem(index, "title", e.target.value)}
                          placeholder="Segurança Garantida"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateFeatureItem(index, "description", e.target.value)}
                          placeholder="Sistemas certificados..."
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeFeatureItem(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Features Preview */}
              <div className="mt-6 p-6 bg-gray-100 rounded-lg">
                <p className="text-gray-600 text-sm mb-4">Preview dos diferenciais:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {settings.features?.items?.map((item, index) => {
                    const IconComponent = { Shield, Clock, Users, Award, Zap, CheckCircle, Star }[item.icon] || Shield;
                    return (
                      <div key={index} className="text-center p-4 bg-white rounded-xl shadow-sm">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Seção Final de CTA</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.cta_section?.enabled}
                    onCheckedChange={(v) => updateCTA("enabled", v)}
                  />
                  <Label>Exibir seção</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={settings.cta_section?.title || ""}
                    onChange={(e) => updateCTA("title", e.target.value)}
                    placeholder="Pronto para Transformar seu Espaço?"
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={settings.cta_section?.subtitle || ""}
                    onChange={(e) => updateCTA("subtitle", e.target.value)}
                    placeholder="Entre em contato conosco..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Texto do Botão</Label>
                  <Input
                    value={settings.cta_section?.button_text || ""}
                    onChange={(e) => updateCTA("button_text", e.target.value)}
                    placeholder="Solicitar Orçamento"
                  />
                </div>
                <div>
                  <Label>URL do Botão</Label>
                  <Input
                    value={settings.cta_section?.button_url || ""}
                    onChange={(e) => updateCTA("button_url", e.target.value)}
                    placeholder="/contato"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          onClick={handleSave} 
          disabled={saving}
          className="shadow-lg"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Salvar Alterações</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default HomepageEditor;
