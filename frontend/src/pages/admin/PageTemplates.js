import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Gift, Calendar, ShoppingBag, Shield, Eye, Rocket, Upload, Video, Copy, Wand2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";

const PageTemplates = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [targetPage, setTargetPage] = useState("");
  const [applying, setApplying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState("gemini");
  const [generatedTemplate, setGeneratedTemplate] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);

  const templates = [
    {
      id: 'black-friday',
      name: 'Black Friday 2026',
      icon: <ShoppingBag className="w-8 h-8" />,
      color: 'from-black to-gray-900',
      description: 'Template explosivo com ofertas imperdíveis',
      thumbnail: '🔥',
      videoBackground: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-city-12681-large.mp4',
      components: [
        {
          id: 'hero-bf',
          type: 'hero',
          title: 'BLACK FRIDAY 2026',
          subtitle: 'Até 70% OFF em toda linha de segurança eletrônica! Ofertas por tempo limitado.',
          image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
          buttonText: 'Ver Ofertas Agora',
          style: {
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            color: '#fff',
            animation: 'pulse'
          }
        },
        {
          id: 'countdown-bf',
          type: 'text',
          title: '⏰ CONTAGEM REGRESSIVA',
          content: 'Ofertas válidas até 30/11/2026 - Não perca!',
          style: {
            background: '#ff0000',
            color: '#fff',
            textAlign: 'center',
            padding: '20px',
            fontSize: '24px',
            fontWeight: 'bold'
          }
        },
        {
          id: 'products-bf',
          type: 'text',
          title: '🎯 DESTAQUES BLACK FRIDAY',
          content: 'Câmeras de segurança, alarmes, controle de acesso e muito mais com descontos imperdíveis!',
          style: { textAlign: 'center' }
        },
        {
          id: 'cta-bf',
          type: 'cta',
          title: 'Garanta Sua Segurança com Desconto!',
          description: 'Não deixe para depois. Aproveite os preços promocionais e proteja o que é mais importante.',
          buttonText: 'Falar com Especialista',
          style: { background: '#ffd700', color: '#000' }
        }
      ]
    },
    {
      id: 'natal-2025',
      name: 'Natal 2025',
      icon: <Gift className="w-8 h-8" />,
      color: 'from-red-600 to-green-600',
      description: 'Especial de Natal com clima festivo',
      thumbnail: '🎄',
      videoBackground: 'https://assets.mixkit.co/videos/preview/mixkit-snow-falling-over-a-forest-1244-large.mp4',
      components: [
        {
          id: 'hero-natal',
          type: 'hero',
          title: '🎄 Natal Seguro & Feliz 2025',
          subtitle: 'Presentes que protegem: equipamentos de segurança com até 40% OFF',
          image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200',
          buttonText: 'Ver Presentes',
          style: { background: 'linear-gradient(135deg, #c41e3a 0%, #0f5229 100%)', color: '#fff' }
        },
        {
          id: 'gift-natal',
          type: 'text',
          title: '🎁 PRESENTES QUE IMPORTAM',
          content: 'Dê segurança de presente! Câmeras, alarmes e sistemas completos com condições especiais.',
          style: { background: '#fff', textAlign: 'center', padding: '30px' }
        },
        {
          id: 'cta-natal',
          type: 'cta',
          title: 'Proteja Sua Família Neste Natal',
          description: 'Aproveite nossas condições especiais de fim de ano',
          buttonText: 'Solicitar Orçamento Natalino',
          style: { background: '#c41e3a', color: '#fff' }
        }
      ]
    },
    {
      id: 'ano-novo-2026',
      name: 'Ano Novo 2026',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-yellow-400 to-purple-600',
      description: 'Comece 2026 com segurança renovada',
      thumbnail: '🎆',
      videoBackground: 'https://assets.mixkit.co/videos/preview/mixkit-fireworks-exploding-in-the-sky-4249-large.mp4',
      components: [
        {
          id: 'hero-ano-novo',
          type: 'hero',
          title: '✨ 2026: Ano da Sua Segurança',
          subtitle: 'Comece o ano protegido! Planos anuais com desconto especial',
          image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1200',
          buttonText: 'Planos 2026',
          style: { background: 'linear-gradient(135deg, #ffd700 0%, #9333ea 100%)', color: '#fff' }
        },
        {
          id: 'resolution',
          type: 'text',
          title: '🎯 SUA META: SEGURANÇA TOTAL',
          content: 'Resolução de Ano Novo: proteger o que é importante. Comece agora com até 50% OFF!',
          style: { textAlign: 'center', background: '#f8f9fa', padding: '40px' }
        },
        {
          id: 'cta-ano-novo',
          type: 'cta',
          title: 'Inicie 2026 Protegido',
          description: 'Planos anuais com manutenção inclusa e desconto exclusivo',
          buttonText: 'Ver Planos Anuais',
          style: { background: '#9333ea', color: '#fff' }
        }
      ]
    },
    {
      id: 'temporada-2026',
      name: 'Temporada 2026',
      icon: <Calendar className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-400',
      description: 'Lançamentos e novidades da temporada',
      thumbnail: '🚀',
      videoBackground: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-background-12681-large.mp4',
      components: [
        {
          id: 'hero-temporada',
          type: 'hero',
          title: 'Temporada 2026 - Novidades',
          subtitle: 'Última geração em tecnologia de segurança eletrônica',
          image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200',
          buttonText: 'Conhecer Novidades',
          style: { background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', color: '#fff' }
        },
        {
          id: 'tech-temporada',
          type: 'text',
          title: '🚀 TECNOLOGIA DE PONTA',
          content: 'IA integrada, reconhecimento facial, visão noturna 4K e muito mais!',
          style: { textAlign: 'center', padding: '30px' }
        },
        {
          id: 'cta-temporada',
          type: 'cta',
          title: 'Seja o Primeiro a Ter',
          description: 'Garanta já os lançamentos da temporada 2026',
          buttonText: 'Ver Lançamentos',
          style: { background: '#3b82f6', color: '#fff' }
        }
      ]
    },
    {
      id: 'seguranca-litoral',
      name: 'Segurança no Litoral',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-blue-600 to-teal-400',
      description: 'Proteção especial para casas de praia',
      thumbnail: '🏖️',
      videoBackground: 'https://assets.mixkit.co/videos/preview/mixkit-waves-crashing-on-the-beach-1166-large.mp4',
      components: [
        {
          id: 'hero-litoral',
          type: 'hero',
          title: '🏖️ Segurança no Litoral',
          subtitle: 'Proteja sua casa de praia 24h, mesmo à distância. Monitoramento remoto e alertas em tempo real.',
          image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
          buttonText: 'Proteger Minha Casa',
          style: { background: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)', color: '#fff' }
        },
        {
          id: 'benefits-litoral',
          type: 'text',
          title: '🛡️ PROTEÇÃO COMPLETA',
          content: 'Câmeras resistentes à maresia, alarmes conectados ao seu celular, sensores de movimento e muito mais.',
          style: { textAlign: 'center', background: '#e0f2fe', padding: '40px' }
        },
        {
          id: 'cta-litoral',
          type: 'cta',
          title: 'Durma Tranquilo',
          description: 'Pacotes especiais para casas de praia',
          buttonText: 'Solicitar Visita Técnica',
          style: { background: '#0891b2', color: '#fff' }
        }
      ]
    },
    {
      id: 'promocao-geral',
      name: 'Promoção Especial',
      icon: <Rocket className="w-8 h-8" />,
      color: 'from-orange-500 to-pink-500',
      description: 'Template genérico para promoções',
      thumbnail: '💥',
      videoBackground: '',
      components: [
        {
          id: 'hero-promo',
          type: 'hero',
          title: '💥 MEGA PROMOÇÃO',
          subtitle: 'Condições imperdíveis por tempo limitado!',
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200',
          buttonText: 'Aproveitar Agora',
          style: { background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)', color: '#fff' }
        },
        {
          id: 'cta-promo',
          type: 'cta',
          title: 'Não Perca Esta Oportunidade',
          description: 'Ofertas válidas enquanto durarem os estoques',
          buttonText: 'Ver Ofertas',
          style: { background: '#ec4899', color: '#fff' }
        }
      ]
    }
  ];

  const pages = [
    { value: 'home', label: 'Home' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'servicos', label: 'Serviços' },
    { value: 'contato', label: 'Contato' },
    { value: 'sobre', label: 'Sobre' },
    { value: 'totens', label: 'Totens' },
  ];

  const allTemplates = [...templates, ...customTemplates];

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleApplyClick = (template) => {
    setSelectedTemplate(template);
    setApplyOpen(true);
  };

  const handleDuplicate = (template) => {
    const duplicated = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Cópia)`,
      components: template.components.map(c => ({ ...c, id: `${c.id}-${Date.now()}` }))
    };
    setCustomTemplates(prev => [...prev, duplicated]);
    toast.success(`Template "${template.name}" duplicado com sucesso!`);
  };

  const handleApply = async () => {
    if (!selectedTemplate || !targetPage) {
      toast.error("Selecione uma página de destino");
      return;
    }
    
    setApplying(true);
    try {
      for (let i = 0; i < selectedTemplate.components.length; i++) {
        const component = selectedTemplate.components[i];
        await axios.post(`${API}/admin/content-blocks`, {
          page_id: targetPage,
          type: component.type === 'cta' ? 'banner' : component.type,
          content: {
            title: component.title,
            subtitle: component.subtitle || component.description || component.content,
            background_url: component.image,
            button_text: component.buttonText,
            button_link: component.buttonUrl || '#',
            style: component.style
          },
          settings: component.style || {},
          published: true,
          order: i
        });
      }
      
      toast.success(`Template "${selectedTemplate.name}" aplicado à página "${targetPage}"!`);
      setApplyOpen(false);
      setTargetPage("");
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error('Erro ao aplicar template');
    } finally {
      setApplying(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma descrição para o template");
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(`${API}/admin/generate-template`, {
        prompt: aiPrompt,
        business_type: "segurança eletrônica"
      });

      if (response.data) {
        const newTemplate = {
          id: `ai-generated-${Date.now()}`,
          name: response.data.name || `Template IA - ${aiPrompt.substring(0, 30)}`,
          icon: <Wand2 className="w-8 h-8" />,
          color: response.data.color || 'from-violet-500 to-fuchsia-500',
          description: response.data.description || `Gerado por IA: ${aiPrompt}`,
          thumbnail: response.data.emoji || '🤖',
          videoBackground: '',
          components: response.data.components || [
            {
              id: 'ai-hero',
              type: 'hero',
              title: response.data.hero_title || 'Título Gerado por IA',
              subtitle: response.data.hero_subtitle || 'Subtítulo gerado automaticamente',
              image: response.data.hero_image || 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200',
              buttonText: response.data.cta_text || 'Saiba Mais',
              style: { background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', color: '#fff' }
            },
            {
              id: 'ai-text',
              type: 'text',
              title: response.data.section_title || '✨ Conteúdo Especial',
              content: response.data.section_content || 'Conteúdo gerado por inteligência artificial.',
              style: { textAlign: 'center', padding: '40px' }
            },
            {
              id: 'ai-cta',
              type: 'cta',
              title: response.data.cta_title || 'Entre em Contato',
              description: response.data.cta_description || 'Estamos prontos para ajudar você.',
              buttonText: response.data.cta_button || 'Falar Conosco',
              style: { background: '#8b5cf6', color: '#fff' }
            }
          ]
        };

        setCustomTemplates(prev => [...prev, newTemplate]);
        setGeneratedTemplate(newTemplate);
        toast.success("Template gerado com sucesso!");
        setAiPrompt("");
      }
    } catch (error) {
      console.error("Error generating template:", error);
      // Fallback - criar template básico mesmo sem API
      const fallbackTemplate = {
        id: `ai-generated-${Date.now()}`,
        name: `${aiPrompt.substring(0, 40)}`,
        icon: <Wand2 className="w-8 h-8" />,
        color: 'from-violet-500 to-fuchsia-500',
        description: `Template personalizado: ${aiPrompt}`,
        thumbnail: '🤖',
        videoBackground: '',
        components: [
          {
            id: 'ai-hero',
            type: 'hero',
            title: aiPrompt.toUpperCase().substring(0, 50),
            subtitle: 'Template criado especialmente para sua campanha',
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200',
            buttonText: 'Saiba Mais',
            style: { background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', color: '#fff' }
          },
          {
            id: 'ai-cta',
            type: 'cta',
            title: 'Aproveite Esta Oportunidade',
            description: 'Entre em contato conosco para mais informações',
            buttonText: 'Falar com Especialista',
            style: { background: '#8b5cf6', color: '#fff' }
          }
        ]
      };
      setCustomTemplates(prev => [...prev, fallbackTemplate]);
      toast.success("Template criado! (Modo offline)");
      setAiPrompt("");
    } finally {
      setGenerating(false);
      setAiGenerateOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gift className="w-8 h-8 text-red-500" />
            Templates de Sazonalidade
          </h1>
          <p className="text-gray-600 mt-1">
            Templates prontos para datas comemorativas e promoções especiais
          </p>
        </div>
        <Button onClick={() => setAiGenerateOpen(true)} className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
          <Wand2 className="w-4 h-4 mr-2" />
          Gerar com IA
        </Button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-xl transition-all group">
            <div className={`h-40 bg-gradient-to-r ${template.color} flex items-center justify-center relative overflow-hidden`}>
              {template.videoBackground ? (
                <video 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                  src={template.videoBackground}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : null}
              <span className="text-7xl relative z-10">{template.thumbnail}</span>
              {template.videoBackground && (
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Video className="w-3 h-3" /> Vídeo
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {template.icon}
                </div>
                <h3 className="font-bold text-lg">{template.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <p className="text-xs text-gray-400 mb-4">{template.components.length} componentes</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePreview(template)} className="flex-1">
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => handleApplyClick(template)} className="flex-1">
                  <Upload className="w-4 h-4 mr-1" /> Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Generate Dialog */}
      <Dialog open={aiGenerateOpen} onOpenChange={setAiGenerateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-500" />
              Gerar Template com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descreva o template que você deseja criar</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Promoção de Dia das Mães com foco em segurança residencial, cores rosa e branco, mensagem emocional sobre proteção da família..."
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Seja específico: mencione cores, tema, público-alvo, ofertas, datas...
              </p>
            </div>
            
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <p className="text-sm text-violet-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                A IA irá gerar um template personalizado baseado na sua descrição
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiGenerateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateAI} disabled={generating || !aiPrompt.trim()} className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> Gerar Template</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedTemplate?.thumbnail}</span>
              Preview: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.videoBackground && (
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <video 
                    className="absolute inset-0 w-full h-full object-cover"
                    src={selectedTemplate.videoBackground}
                    autoPlay muted loop playsInline
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">Vídeo de Background Incluído</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedTemplate.components.map((component, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg overflow-hidden"
                  style={component.style ? {
                    background: component.style.background,
                    color: component.style.color,
                    textAlign: component.style.textAlign,
                    padding: component.style.padding
                  } : {}}
                >
                  <div className="p-4">
                    {component.type === 'hero' && (
                      <div className="text-center space-y-4">
                        <h1 className="text-3xl font-bold">{component.title}</h1>
                        <p className="text-lg opacity-90">{component.subtitle}</p>
                        {component.image && (
                          <img src={component.image} alt="" className="w-full h-48 object-cover rounded-lg" />
                        )}
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
                          {component.buttonText}
                        </button>
                      </div>
                    )}
                    {component.type === 'text' && (
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold">{component.title}</h3>
                        <p className="text-lg">{component.content}</p>
                      </div>
                    )}
                    {component.type === 'cta' && (
                      <div className="text-center space-y-3 py-4">
                        <h3 className="text-2xl font-bold">{component.title}</h3>
                        <p className="text-lg opacity-90">{component.description}</p>
                        <button className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold">
                          {component.buttonText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
                <Button variant="outline" onClick={() => handleDuplicate(selectedTemplate)}>
                  <Copy className="w-4 h-4 mr-2" /> Duplicar
                </Button>
                <Button onClick={() => { setPreviewOpen(false); handleApplyClick(selectedTemplate); }}>
                  <Upload className="w-4 h-4 mr-2" /> Aplicar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedTemplate?.thumbnail}</span>
              Aplicar: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Selecione a página onde deseja aplicar este template.
            </p>
            <div className="space-y-2">
              <Label>Página de Destino</Label>
              <Select value={targetPage} onValueChange={setTargetPage}>
                <SelectTrigger><SelectValue placeholder="Selecione uma página..." /></SelectTrigger>
                <SelectContent>
                  {pages.map(page => (
                    <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Isso adicionará {selectedTemplate?.components.length} novos blocos de conteúdo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancelar</Button>
            <Button onClick={handleApply} disabled={!targetPage || applying}>
              {applying ? "Aplicando..." : "Aplicar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageTemplates;
