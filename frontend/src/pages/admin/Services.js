import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Pencil, Trash2, Eye, Save, Upload, Video, Image as ImageIcon, 
  Type, Move, Palette, ExternalLink, ChevronDown, Settings2, Copy
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

// Component for advanced Header/Banner editor
const HeaderBannerEditor = ({ value, onChange }) => {
  const [header, setHeader] = useState(value || {
    type: 'image', // 'image' | 'video' | 'gradient'
    mediaUrl: '',
    overlayColor: 'rgba(0,0,0,0.5)',
    overlayOpacity: 50,
    title: '',
    titleColor: '#FFFFFF',
    titleSize: '4xl',
    titleFont: 'Inter',
    titlePosition: 'center',
    subtitle: '',
    subtitleColor: '#FFFFFF',
    subtitleSize: 'xl',
    ctaText: '',
    ctaUrl: '',
    ctaColor: '#22C55E',
    ctaTextColor: '#FFFFFF',
    height: '70vh',
    textAlign: 'center',
    verticalAlign: 'center'
  });

  useEffect(() => {
    if (value) setHeader(value);
  }, [value]);

  const updateHeader = (key, val) => {
    const newHeader = { ...header, [key]: val };
    setHeader(newHeader);
    onChange && onChange(newHeader);
  };

  const fontSizes = [
    { value: '2xl', label: '2XL' },
    { value: '3xl', label: '3XL' },
    { value: '4xl', label: '4XL' },
    { value: '5xl', label: '5XL' },
    { value: '6xl', label: '6XL' },
  ];

  const fonts = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Playfair Display'];
  const positions = [
    { value: 'left', label: 'Esquerda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Direita' }
  ];

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div 
          className="relative flex items-center justify-center"
          style={{ 
            height: header.height,
            backgroundImage: header.type === 'image' && header.mediaUrl ? `url(${header.mediaUrl})` : 
                            header.type === 'gradient' ? 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: header.type === 'video' ? '#1F2937' : '#3B82F6'
          }}
        >
          {/* Video Background */}
          {header.type === 'video' && header.mediaUrl && (
            <video 
              className="absolute inset-0 w-full h-full object-cover"
              src={header.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          
          {/* Overlay */}
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: header.overlayColor, opacity: header.overlayOpacity / 100 }}
          />
          
          {/* Content */}
          <div 
            className={`relative z-10 p-8 w-full max-w-4xl mx-auto text-${header.textAlign}`}
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: header.textAlign === 'center' ? 'center' : header.textAlign === 'right' ? 'flex-end' : 'flex-start',
              justifyContent: header.verticalAlign === 'center' ? 'center' : header.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
              height: '100%'
            }}
          >
            {header.title && (
              <h1 
                className={`text-${header.titleSize} font-bold mb-4`}
                style={{ color: header.titleColor, fontFamily: header.titleFont }}
              >
                {header.title}
              </h1>
            )}
            {header.subtitle && (
              <p 
                className={`text-${header.subtitleSize} mb-6 max-w-2xl`}
                style={{ color: header.subtitleColor }}
              >
                {header.subtitle}
              </p>
            )}
            {header.ctaText && (
              <button 
                className="px-8 py-3 rounded-lg font-semibold text-lg transition-transform hover:scale-105"
                style={{ backgroundColor: header.ctaColor, color: header.ctaTextColor }}
              >
                {header.ctaText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="media" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="media">🖼️ Mídia</TabsTrigger>
          <TabsTrigger value="text">✏️ Texto</TabsTrigger>
          <TabsTrigger value="style">🎨 Estilo</TabsTrigger>
          <TabsTrigger value="cta">🔘 CTA</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-4 pt-4">
          <div>
            <Label>Tipo de Fundo</Label>
            <Select value={header.type} onValueChange={(v) => updateHeader('type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">🖼️ Imagem</SelectItem>
                <SelectItem value="video">🎬 Vídeo</SelectItem>
                <SelectItem value="gradient">🌈 Gradiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(header.type === 'image' || header.type === 'video') && (
            <div>
              <Label>{header.type === 'image' ? 'URL da Imagem' : 'URL do Vídeo'}</Label>
              <Input 
                placeholder={header.type === 'image' ? 'https://exemplo.com/imagem.jpg' : 'https://exemplo.com/video.mp4'}
                value={header.mediaUrl}
                onChange={(e) => updateHeader('mediaUrl', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {header.type === 'video' ? 'Formatos: MP4, WebM. Recomendado: 1920x1080' : 'Formatos: JPG, PNG, WebP'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor do Overlay</Label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={header.overlayColor.replace(/rgba?\([^)]+\)/, '#000000')}
                  onChange={(e) => updateHeader('overlayColor', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input 
                  value={header.overlayColor}
                  onChange={(e) => updateHeader('overlayColor', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Opacidade do Overlay ({header.overlayOpacity}%)</Label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={header.overlayOpacity}
                onChange={(e) => updateHeader('overlayOpacity', parseInt(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Altura do Banner</Label>
            <Select value={header.height} onValueChange={(v) => updateHeader('height', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50vh">Pequeno (50vh)</SelectItem>
                <SelectItem value="70vh">Médio (70vh)</SelectItem>
                <SelectItem value="100vh">Tela Cheia (100vh)</SelectItem>
                <SelectItem value="400px">Fixo 400px</SelectItem>
                <SelectItem value="500px">Fixo 500px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-4 pt-4">
          <div>
            <Label>Título</Label>
            <Input 
              placeholder="Título Principal"
              value={header.title}
              onChange={(e) => updateHeader('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cor do Título</Label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={header.titleColor}
                  onChange={(e) => updateHeader('titleColor', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
            <div>
              <Label>Tamanho</Label>
              <Select value={header.titleSize} onValueChange={(v) => updateHeader('titleSize', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fonte</Label>
              <Select value={header.titleFont} onValueChange={(v) => updateHeader('titleFont', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subtítulo</Label>
            <Textarea 
              placeholder="Descrição ou subtítulo"
              value={header.subtitle}
              onChange={(e) => updateHeader('subtitle', e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor do Subtítulo</Label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={header.subtitleColor}
                  onChange={(e) => updateHeader('subtitleColor', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
            <div>
              <Label>Tamanho do Subtítulo</Label>
              <Select value={header.subtitleSize} onValueChange={(v) => updateHeader('subtitleSize', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lg">Grande</SelectItem>
                  <SelectItem value="xl">Extra Grande</SelectItem>
                  <SelectItem value="2xl">2XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Alinhamento Horizontal</Label>
              <Select value={header.textAlign} onValueChange={(v) => updateHeader('textAlign', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Alinhamento Vertical</Label>
              <Select value={header.verticalAlign} onValueChange={(v) => updateHeader('verticalAlign', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Topo</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="bottom">Base</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4 pt-4">
          <div>
            <Label>Texto do Botão CTA</Label>
            <Input 
              placeholder="Saiba Mais"
              value={header.ctaText}
              onChange={(e) => updateHeader('ctaText', e.target.value)}
            />
          </div>
          
          <div>
            <Label>Link do Botão</Label>
            <Input 
              placeholder="/contato ou https://wa.me/..."
              value={header.ctaUrl}
              onChange={(e) => updateHeader('ctaUrl', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor do Botão</Label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={header.ctaColor}
                  onChange={(e) => updateHeader('ctaColor', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input 
                  value={header.ctaColor}
                  onChange={(e) => updateHeader('ctaColor', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Cor do Texto do Botão</Label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={header.ctaTextColor}
                  onChange={(e) => updateHeader('ctaTextColor', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main Services Page
const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    shortDescription: '',
    fullDescription: '',
    icon: '',
    published: true,
    headerBanner: null,
    features: [],
    gallery: [],
    ctaWhatsapp: ''
  });

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/admin/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      // If endpoint doesn't exist yet, use categories as services
      try {
        const catResponse = await axios.get(`${API}/categories`);
        const servicesFromCats = catResponse.data.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          shortDescription: cat.description,
          icon: cat.icon,
          published: true,
          categoryId: cat.id
        }));
        setServices(servicesFromCats);
      } catch (e) {
        console.error('Error fetching categories as services:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const openCreateDialog = () => {
    setEditingService(null);
    setFormData({
      name: '',
      slug: '',
      categoryId: '',
      shortDescription: '',
      fullDescription: '',
      icon: '',
      published: true,
      headerBanner: null,
      features: [],
      gallery: [],
      ctaWhatsapp: ''
    });
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      slug: service.slug || '',
      categoryId: service.categoryId || '',
      shortDescription: service.shortDescription || '',
      fullDescription: service.fullDescription || '',
      icon: service.icon || '',
      published: service.published !== false,
      headerBanner: service.headerBanner || null,
      features: service.features || [],
      gallery: service.gallery || [],
      ctaWhatsapp: service.ctaWhatsapp || ''
    });
    setActiveTab('basic');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    try {
      if (editingService) {
        await axios.put(`${API}/admin/services/${editingService.id}`, formData);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await axios.post(`${API}/admin/services`, formData);
        toast.success('Serviço criado com sucesso!');
      }
      setDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      await axios.delete(`${API}/admin/services/${id}`);
      toast.success('Serviço excluído com sucesso!');
      fetchServices();
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    }
  };

  const handleDuplicate = async (service) => {
    try {
      const response = await axios.post(`${API}/admin/services/${service.id}/duplicate`, {}, { withCredentials: true });
      toast.success('Serviço duplicado com sucesso!');
      fetchServices();
    } catch (error) {
      console.error('Error duplicating service:', error);
      toast.error('Erro ao duplicar serviço');
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { title: '', description: '', icon: '' }]
    }));
  };

  const updateFeature = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-gray-500 mt-1">Gerencie os serviços da VigiLoc</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {service.headerBanner?.mediaUrl && (
              <div 
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${service.headerBanner.mediaUrl})` }}
              />
            )}
            {!service.headerBanner?.mediaUrl && (
              <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <span className="text-6xl">{service.icon || '🛡️'}</span>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{service.shortDescription}</p>
                </div>
                <Badge variant={service.published ? "default" : "secondary"}>
                  {service.published ? "Publicado" : "Rascunho"}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => window.open(`/servico/${service.slug}`, '_blank')}>
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditDialog(service)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(service)} title="Duplicar">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(service.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-400">
            <Settings2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold mb-2">Nenhum serviço cadastrado</h3>
            <p className="mb-4">Comece adicionando seus serviços para exibi-los no site</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Serviço
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? `Editar: ${editingService.name}` : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">📝 Básico</TabsTrigger>
              <TabsTrigger value="header">🖼️ Header/Banner</TabsTrigger>
              <TabsTrigger value="features">✨ Recursos</TabsTrigger>
              <TabsTrigger value="content">📄 Conteúdo</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Serviço *</Label>
                  <Input
                    placeholder="Ex: Portaria Autônoma"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        name, 
                        slug: prev.slug || generateSlug(name) 
                      }));
                    }}
                  />
                </div>
                <div>
                  <Label>Slug (URL) *</Label>
                  <Input
                    placeholder="portaria-autonoma"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">URL: /servico/{formData.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ícone/Emoji</Label>
                  <Input
                    placeholder="🏢 ou nome-icone"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição Curta</Label>
                <Textarea
                  placeholder="Uma breve descrição que aparece nos cards..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label>WhatsApp para CTA</Label>
                <Input
                  placeholder="5511999999999"
                  value={formData.ctaWhatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaWhatsapp: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.published}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, published: v }))}
                />
                <Label>Publicado (visível no site)</Label>
              </div>
            </TabsContent>

            <TabsContent value="header" className="pt-4">
              <HeaderBannerEditor 
                value={formData.headerBanner}
                onChange={(val) => setFormData(prev => ({ ...prev, headerBanner: val }))}
              />
            </TabsContent>

            <TabsContent value="features" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Recursos/Benefícios</Label>
                <Button size="sm" variant="outline" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {formData.features.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <p>Nenhum recurso adicionado</p>
                  <p className="text-sm">Clique em "Adicionar" para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.features.map((feature, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Ícone (emoji)"
                              value={feature.icon}
                              onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                            />
                            <div className="col-span-2">
                              <Input
                                placeholder="Título do recurso"
                                value={feature.title}
                                onChange={(e) => updateFeature(index, 'title', e.target.value)}
                              />
                            </div>
                          </div>
                          <Textarea
                            placeholder="Descrição do recurso..."
                            value={feature.description}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-red-500"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div>
                <Label>Descrição Completa</Label>
                <Textarea
                  placeholder="Descrição detalhada do serviço..."
                  value={formData.fullDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullDescription: e.target.value }))}
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você também pode editar o conteúdo completo no Visual Page Builder
                </p>
              </div>

              <div>
                <Label>Galeria de Imagens (URLs, uma por linha)</Label>
                <Textarea
                  placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
                  value={formData.gallery.join('\n')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    gallery: e.target.value.split('\n').filter(url => url.trim()) 
                  }))}
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
