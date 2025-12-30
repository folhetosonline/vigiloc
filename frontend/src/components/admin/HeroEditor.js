import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Video, Image as ImageIcon, Layers, Type, Palette, 
  Upload, Plus, Trash2, ChevronUp, ChevronDown, Eye
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

// Advanced Hero/Banner Editor Component
const HeroEditor = ({ value, onChange, showCarouselOption = true }) => {
  const [hero, setHero] = useState(value || {
    type: 'carousel', // 'carousel' | 'video' | 'image' | 'gradient'
    // Carousel settings
    carousel_items: [],
    carousel_autoplay: true,
    carousel_interval: 5000,
    carousel_show_dots: true,
    carousel_show_arrows: true,
    // Video settings
    video_url: '',
    video_poster: '',
    video_loop: true,
    video_muted: true,
    // Image settings
    image_url: '',
    // Common settings
    overlay_color: 'rgba(0,0,0,0.4)',
    overlay_opacity: 40,
    height: '70vh',
    title: '',
    title_color: '#FFFFFF',
    title_size: '5xl',
    subtitle: '',
    subtitle_color: '#FFFFFF',
    subtitle_size: 'xl',
    text_align: 'center',
    vertical_align: 'center',
    cta_text: '',
    cta_url: '',
    cta_color: '#22C55E',
    cta_text_color: '#FFFFFF'
  });

  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(false);

  useEffect(() => {
    if (value) setHero(value);
  }, [value]);

  useEffect(() => {
    if (showCarouselOption) {
      fetchBanners();
    }
  }, [showCarouselOption]);

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const response = await axios.get(`${API}/admin/banners`);
      setBanners(response.data.filter(b => b.active && b.published));
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const updateHero = (key, val) => {
    const newHero = { ...hero, [key]: val };
    setHero(newHero);
    onChange && onChange(newHero);
  };

  const addCarouselItem = () => {
    const newItem = {
      id: Date.now().toString(),
      title: '',
      subtitle: '',
      media_type: 'image',
      media_url: '',
      cta_text: '',
      cta_url: ''
    };
    updateHero('carousel_items', [...(hero.carousel_items || []), newItem]);
  };

  const updateCarouselItem = (index, field, value) => {
    const items = [...(hero.carousel_items || [])];
    items[index] = { ...items[index], [field]: value };
    updateHero('carousel_items', items);
  };

  const removeCarouselItem = (index) => {
    const items = [...(hero.carousel_items || [])];
    items.splice(index, 1);
    updateHero('carousel_items', items);
  };

  const moveCarouselItem = (index, direction) => {
    const items = [...(hero.carousel_items || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    updateHero('carousel_items', items);
  };

  const loadBannersToCarousel = () => {
    const carouselItems = banners.map(banner => ({
      id: banner.id,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      media_type: banner.media_type || 'image',
      media_url: banner.media_url || '',
      cta_text: banner.cta_text || '',
      cta_url: banner.link_url || ''
    }));
    updateHero('carousel_items', carouselItems);
    toast.success(`${carouselItems.length} banners carregados para o carrossel!`);
  };

  const fontSizes = [
    { value: '2xl', label: 'Pequeno' },
    { value: '3xl', label: 'Médio' },
    { value: '4xl', label: 'Grande' },
    { value: '5xl', label: 'Extra Grande' },
    { value: '6xl', label: 'Gigante' },
  ];

  // Preview Component
  const renderPreview = () => {
    const backgroundStyle = {
      height: hero.height,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#1F2937'
    };

    if (hero.type === 'image' && hero.image_url) {
      backgroundStyle.backgroundImage = `url(${hero.image_url})`;
    } else if (hero.type === 'gradient') {
      backgroundStyle.backgroundImage = 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)';
    } else if (hero.type === 'carousel' && hero.carousel_items?.length > 0) {
      const firstItem = hero.carousel_items[0];
      if (firstItem.media_type === 'image' && firstItem.media_url) {
        backgroundStyle.backgroundImage = `url(${firstItem.media_url})`;
      }
    }

    return (
      <div className="relative rounded-lg overflow-hidden" style={backgroundStyle}>
        {/* Video Background Preview */}
        {hero.type === 'video' && hero.video_url && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={hero.video_url}
            poster={hero.video_poster}
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {/* Overlay */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: hero.overlay_color, 
            opacity: hero.overlay_opacity / 100 
          }}
        />

        {/* Content */}
        <div 
          className="relative z-10 h-full flex flex-col p-8"
          style={{
            alignItems: hero.text_align === 'center' ? 'center' : hero.text_align === 'right' ? 'flex-end' : 'flex-start',
            justifyContent: hero.vertical_align === 'center' ? 'center' : hero.vertical_align === 'bottom' ? 'flex-end' : 'flex-start',
            textAlign: hero.text_align
          }}
        >
          {hero.title && (
            <h1 
              className={`text-${hero.title_size} font-bold mb-4`}
              style={{ color: hero.title_color }}
            >
              {hero.title}
            </h1>
          )}
          {hero.subtitle && (
            <p 
              className={`text-${hero.subtitle_size} mb-6 max-w-2xl`}
              style={{ color: hero.subtitle_color }}
            >
              {hero.subtitle}
            </p>
          )}
          {hero.cta_text && (
            <button 
              className="px-8 py-3 rounded-lg font-semibold text-lg"
              style={{ backgroundColor: hero.cta_color, color: hero.cta_text_color }}
            >
              {hero.cta_text}
            </button>
          )}
        </div>

        {/* Carousel indicator */}
        {hero.type === 'carousel' && hero.carousel_items?.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {hero.carousel_items.map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {hero.type === 'carousel' && '🎠 Carrossel'}
          {hero.type === 'video' && '🎬 Vídeo'}
          {hero.type === 'image' && '🖼️ Imagem'}
          {hero.type === 'gradient' && '🌈 Gradiente'}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-2 bg-gray-100 border-b flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" /> Prévia do Hero
          </span>
        </div>
        {renderPreview()}
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="type" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="type">📱 Tipo</TabsTrigger>
          <TabsTrigger value="media">🖼️ Mídia</TabsTrigger>
          <TabsTrigger value="text">✏️ Texto</TabsTrigger>
          <TabsTrigger value="style">🎨 Estilo</TabsTrigger>
          <TabsTrigger value="cta">🔘 CTA</TabsTrigger>
        </TabsList>

        {/* Type Tab */}
        <TabsContent value="type" className="space-y-4 pt-4">
          <div>
            <Label className="text-base font-semibold">Tipo de Hero/Banner</Label>
            <p className="text-sm text-gray-500 mb-3">Escolha como o hero será exibido</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {showCarouselOption && (
                <Card 
                  className={`cursor-pointer transition ${hero.type === 'carousel' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => updateHero('type', 'carousel')}
                >
                  <CardContent className="p-4 text-center">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium">Carrossel</p>
                    <p className="text-xs text-gray-500">Múltiplos slides</p>
                  </CardContent>
                </Card>
              )}
              <Card 
                className={`cursor-pointer transition ${hero.type === 'video' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => updateHero('type', 'video')}
              >
                <CardContent className="p-4 text-center">
                  <Video className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Vídeo</p>
                  <p className="text-xs text-gray-500">Background animado</p>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition ${hero.type === 'image' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => updateHero('type', 'image')}
              >
                <CardContent className="p-4 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Imagem</p>
                  <p className="text-xs text-gray-500">Imagem estática</p>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition ${hero.type === 'gradient' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => updateHero('type', 'gradient')}
              >
                <CardContent className="p-4 text-center">
                  <Palette className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-medium">Gradiente</p>
                  <p className="text-xs text-gray-500">Cores suaves</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 pt-4">
          {/* Carousel Settings */}
          {hero.type === 'carousel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Slides do Carrossel</Label>
                  <p className="text-sm text-gray-500">Adicione ou importe slides</p>
                </div>
                <div className="flex gap-2">
                  {banners.length > 0 && (
                    <Button variant="outline" size="sm" onClick={loadBannersToCarousel}>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Banners ({banners.length})
                    </Button>
                  )}
                  <Button size="sm" onClick={addCarouselItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Slide
                  </Button>
                </div>
              </div>

              {/* Carousel Items */}
              <div className="space-y-3">
                {(hero.carousel_items || []).map((item, index) => (
                  <Card key={item.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Preview thumbnail */}
                        <div className="w-32 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {item.media_type === 'image' && item.media_url && (
                            <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                          )}
                          {item.media_type === 'video' && item.media_url && (
                            <video src={item.media_url} className="w-full h-full object-cover" muted />
                          )}
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Título do slide"
                              value={item.title}
                              onChange={(e) => updateCarouselItem(index, 'title', e.target.value)}
                            />
                            <Select 
                              value={item.media_type} 
                              onValueChange={(v) => updateCarouselItem(index, 'media_type', v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">Imagem</SelectItem>
                                <SelectItem value="video">Vídeo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            placeholder="URL da mídia"
                            value={item.media_url}
                            onChange={(e) => updateCarouselItem(index, 'media_url', e.target.value)}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => moveCarouselItem(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => moveCarouselItem(index, 'down')}
                            disabled={index === (hero.carousel_items?.length || 0) - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-600"
                            onClick={() => removeCarouselItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!hero.carousel_items || hero.carousel_items.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Layers className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Nenhum slide adicionado</p>
                    <p className="text-sm text-gray-400">Adicione slides ou importe banners existentes</p>
                  </div>
                )}
              </div>

              {/* Carousel options */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Autoplay</Label>
                  <Switch
                    checked={hero.carousel_autoplay}
                    onCheckedChange={(v) => updateHero('carousel_autoplay', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mostrar pontos</Label>
                  <Switch
                    checked={hero.carousel_show_dots}
                    onCheckedChange={(v) => updateHero('carousel_show_dots', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mostrar setas</Label>
                  <Switch
                    checked={hero.carousel_show_arrows}
                    onCheckedChange={(v) => updateHero('carousel_show_arrows', v)}
                  />
                </div>
                <div>
                  <Label>Intervalo (ms)</Label>
                  <Input
                    type="number"
                    value={hero.carousel_interval}
                    onChange={(e) => updateHero('carousel_interval', parseInt(e.target.value))}
                    min={1000}
                    step={500}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Video Settings */}
          {hero.type === 'video' && (
            <div className="space-y-4">
              <div>
                <Label>URL do Vídeo</Label>
                <Input
                  placeholder="https://exemplo.com/video.mp4"
                  value={hero.video_url}
                  onChange={(e) => updateHero('video_url', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Formatos: MP4, WebM. Recomendado: 1920x1080</p>
              </div>
              <div>
                <Label>Imagem de Poster (opcional)</Label>
                <Input
                  placeholder="https://exemplo.com/poster.jpg"
                  value={hero.video_poster}
                  onChange={(e) => updateHero('video_poster', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Exibida enquanto o vídeo carrega</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Loop</Label>
                  <Switch
                    checked={hero.video_loop}
                    onCheckedChange={(v) => updateHero('video_loop', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mudo</Label>
                  <Switch
                    checked={hero.video_muted}
                    onCheckedChange={(v) => updateHero('video_muted', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Image Settings */}
          {hero.type === 'image' && (
            <div className="space-y-4">
              <div>
                <Label>URL da Imagem</Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={hero.image_url}
                  onChange={(e) => updateHero('image_url', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, WebP. Recomendado: 1920x1080</p>
              </div>
            </div>
          )}

          {/* Gradient - no media settings needed */}
          {hero.type === 'gradient' && (
            <div className="text-center py-8 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white">
              <Palette className="w-12 h-12 mx-auto mb-2" />
              <p>Gradiente selecionado</p>
              <p className="text-sm opacity-80">Configure cores no tab "Estilo"</p>
            </div>
          )}
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Título</Label>
              <Input
                placeholder="Título principal"
                value={hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
              />
            </div>
            <div>
              <Label>Tamanho do Título</Label>
              <Select value={hero.title_size} onValueChange={(v) => updateHero('title_size', v)}>
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
              <Label>Cor do Título</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={hero.title_color}
                  onChange={(e) => updateHero('title_color', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={hero.title_color}
                  onChange={(e) => updateHero('title_color', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Subtítulo</Label>
              <Textarea
                placeholder="Subtítulo ou descrição"
                value={hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <Label>Tamanho do Subtítulo</Label>
              <Select value={hero.subtitle_size} onValueChange={(v) => updateHero('subtitle_size', v)}>
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
              <Label>Cor do Subtítulo</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={hero.subtitle_color}
                  onChange={(e) => updateHero('subtitle_color', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={hero.subtitle_color}
                  onChange={(e) => updateHero('subtitle_color', e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Altura do Hero</Label>
              <Select value={hero.height} onValueChange={(v) => updateHero('height', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50vh">Pequeno (50%)</SelectItem>
                  <SelectItem value="70vh">Médio (70%)</SelectItem>
                  <SelectItem value="100vh">Tela Cheia</SelectItem>
                  <SelectItem value="400px">Fixo 400px</SelectItem>
                  <SelectItem value="600px">Fixo 600px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Alinhamento do Texto</Label>
              <Select value={hero.text_align} onValueChange={(v) => updateHero('text_align', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor do Overlay</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={(hero.overlay_color || '').includes('rgba') ? '#000000' : (hero.overlay_color || '#000000')}
                  onChange={(e) => updateHero('overlay_color', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={hero.overlay_color || 'rgba(0,0,0,0.4)'}
                  onChange={(e) => updateHero('overlay_color', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Opacidade do Overlay ({hero.overlay_opacity}%)</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={hero.overlay_opacity}
                onChange={(e) => updateHero('overlay_opacity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </TabsContent>

        {/* CTA Tab */}
        <TabsContent value="cta" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Texto do Botão</Label>
              <Input
                placeholder="Saiba Mais"
                value={hero.cta_text}
                onChange={(e) => updateHero('cta_text', e.target.value)}
              />
            </div>
            <div>
              <Label>Link do Botão</Label>
              <Input
                placeholder="/contato"
                value={hero.cta_url}
                onChange={(e) => updateHero('cta_url', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cor do Botão</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={hero.cta_color}
                  onChange={(e) => updateHero('cta_color', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={hero.cta_color}
                  onChange={(e) => updateHero('cta_color', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Cor do Texto do Botão</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={hero.cta_text_color}
                  onChange={(e) => updateHero('cta_text_color', e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={hero.cta_text_color}
                  onChange={(e) => updateHero('cta_text_color', e.target.value)}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeroEditor;
