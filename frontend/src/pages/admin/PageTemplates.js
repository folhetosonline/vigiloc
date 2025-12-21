import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Gift, Calendar, ShoppingBag, Shield, Eye } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";

const PageTemplates = ({ onApplyTemplate }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    {
      id: 'black-friday',
      name: 'Black Friday 2025',
      icon: <ShoppingBag className="w-8 h-8" />,
      color: 'from-black to-gray-900',
      description: 'Template explosivo com ofertas imperdíveis',
      thumbnail: '🔥',
      components: [
        {
          id: 'hero-bf',
          type: 'hero',
          title: 'BLACK FRIDAY 2025',
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
          content: 'Ofertas válidas até 30/11/2025 - Não perca!',
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
          style: {
            textAlign: 'center'
          }
        },
        {
          id: 'cta-bf',
          type: 'cta',
          title: 'Garanta Sua Segurança com Desconto!',
          description: 'Não deixe para depois. Aproveite os preços promocionais e proteja o que é mais importante.',
          buttonText: 'Falar com Especialista',
          style: {
            background: '#ffd700',
            color: '#000'
          }
        }
      ]
    },
    {
      id: 'natal-2024',
      name: 'Natal 2024',
      icon: <Gift className="w-8 h-8" />,
      color: 'from-red-600 to-green-600',
      description: 'Especial de Natal com clima festivo',
      thumbnail: '🎄',
      components: [
        {
          id: 'hero-natal',
          type: 'hero',
          title: '🎄 Natal Seguro & Feliz',
          subtitle: 'Presentes que protegem: equipamentos de segurança com até 40% OFF',
          image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1200',
          buttonText: 'Ver Presentes',
          style: {
            background: 'linear-gradient(135deg, #c41e3a 0%, #0f5229 100%)',
            color: '#fff'
          }
        },
        {
          id: 'gift-natal',
          type: 'text',
          title: '🎁 PRESENTES QUE IMPORTAM',
          content: 'Dê segurança de presente! Câmeras, alarmes e sistemas completos com condições especiais.',
          style: {
            background: '#fff',
            textAlign: 'center',
            padding: '30px'
          }
        },
        {
          id: 'cta-natal',
          type: 'cta',
          title: 'Proteja Sua Família Neste Natal',
          description: 'Aproveite nossas condições especiais de fim de ano',
          buttonText: 'Solicitar Orçamento Natalino',
          style: {
            background: '#c41e3a',
            color: '#fff'
          }
        }
      ]
    },
    {
      id: 'ano-novo-2025',
      name: 'Ano Novo 2025',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-yellow-400 to-purple-600',
      description: 'Comece 2025 com segurança renovada',
      thumbnail: '🎆',
      components: [
        {
          id: 'hero-ano-novo',
          type: 'hero',
          title: '✨ 2025: Ano da Sua Segurança',
          subtitle: 'Comece o ano protegido! Planos anuais com desconto especial',
          image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1200',
          buttonText: 'Planos 2025',
          style: {
            background: 'linear-gradient(135deg, #ffd700 0%, #9333ea 100%)',
            color: '#fff'
          }
        },
        {
          id: 'resolution',
          type: 'text',
          title: '🎯 SUA META: SEGURANÇA TOTAL',
          content: 'Resolução de Ano Novo: proteger o que é importante. Comece agora com até 50% OFF!',
          style: {
            textAlign: 'center',
            background: '#f8f9fa',
            padding: '40px'
          }
        },
        {
          id: 'cta-ano-novo',
          type: 'cta',
          title: 'Inicie 2025 Protegido',
          description: 'Planos anuais com manutenção inclusa e desconto exclusivo',
          buttonText: 'Ver Planos Anuais',
          style: {
            background: '#9333ea',
            color: '#fff'
          }
        }
      ]
    },
    {
      id: 'temporada-2025',
      name: 'Temporada 2025',
      icon: <Calendar className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-400',
      description: 'Lançamentos e novidades da temporada',
      thumbnail: '🚀',
      components: [
        {
          id: 'hero-temporada',
          type: 'hero',
          title: 'Temporada 2025 - Novidades',
          subtitle: 'Última geração em tecnologia de segurança eletrônica',
          image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200',
          buttonText: 'Conhecer Novidades',
          style: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            color: '#fff'
          }
        },
        {
          id: 'tech-temporada',
          type: 'text',
          title: '🚀 TECNOLOGIA DE PONTA',
          content: 'IA integrada, reconhecimento facial, visão noturna 4K e muito mais!',
          style: {
            textAlign: 'center',
            padding: '30px'
          }
        },
        {
          id: 'cta-temporada',
          type: 'cta',
          title: 'Seja o Primeiro a Ter',
          description: 'Garanta já os lançamentos da temporada 2025',
          buttonText: 'Ver Lançamentos',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
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
      components: [
        {
          id: 'hero-litoral',
          type: 'hero',
          title: '🏖️ Segurança no Litoral',
          subtitle: 'Proteja sua casa de praia 24h, mesmo à distância. Monitoramento remoto e alertas em tempo real.',
          image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
          buttonText: 'Proteger Minha Casa',
          style: {
            background: 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)',
            color: '#fff'
          }
        },
        {
          id: 'benefits-litoral',
          type: 'text',
          title: '🛡️ PROTEÇÃO COMPLETA',
          content: 'Câmeras resistentes à maresia, alarmes conectados ao seu celular, sensores de movimento e muito mais. Ideal para casas de veraneio.',
          style: {
            textAlign: 'center',
            background: '#e0f2fe',
            padding: '40px'
          }
        },
        {
          id: 'monitoring-litoral',
          type: 'text',
          title: '📱 MONITORE DE QUALQUER LUGAR',
          content: 'Esteja na cidade ou viajando, acompanhe sua casa de praia pelo celular. Receba alertas instantâneos.',
          style: {
            textAlign: 'center',
            padding: '30px'
          }
        },
        {
          id: 'cta-litoral',
          type: 'cta',
          title: 'Durma Tranquilo Sabendo que Sua Casa Está Segura',
          description: 'Pacotes especiais para casas de praia com instalação e suporte técnico',
          buttonText: 'Solicitar Visita Técnica',
          style: {
            background: '#0891b2',
            color: '#fff'
          }
        }
      ]
    }
  ];

  const handlePreview = (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;
    
    try {
      if (onApplyTemplate) {
        onApplyTemplate(selectedTemplate.components);
        toast.success(`Template "${selectedTemplate.name}" aplicado!`);
        setPreviewOpen(false);
      }
    } catch (error) {
      toast.error('Erro ao aplicar template');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Templates Prontos</h2>
        <p className="text-gray-600">Escolha um template profissional e personalize como quiser</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-xl transition-shadow">
            <div className={`h-32 bg-gradient-to-r ${template.color} flex items-center justify-center text-6xl`}>
              {template.thumbnail}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {template.icon}
                <h3 className="font-bold text-lg">{template.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(template)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(template);
                    handleApply();
                  }}
                  className="flex-1"
                >
                  Usar Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.components.map((component, index) => (
                <div key={index} className="border rounded-lg p-4" style={component.style || {}}>
                  {component.type === 'hero' && (
                    <div className="text-center space-y-4">
                      <h1 className="text-4xl font-bold">{component.title}</h1>
                      <p className="text-xl">{component.subtitle}</p>
                      <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                        [Banner Image]
                      </div>
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
                    <div className="text-center space-y-3 p-6">
                      <h3 className="text-2xl font-bold">{component.title}</h3>
                      <p className="text-lg">{component.description}</p>
                      <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold">
                        {component.buttonText}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleApply}>
                  Aplicar Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageTemplates;
