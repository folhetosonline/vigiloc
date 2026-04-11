import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { API } from "@/App";

// Renderizador de Hero Section
const HeroRenderer = ({ component, whatsappNumber }) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(component.whatsappMessage || `Olá! Tenho interesse em ${component.title}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div 
      className="relative min-h-[60vh] flex items-center justify-center bg-cover bg-center"
      style={{ 
        backgroundImage: component.image ? `url(${component.image})` : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {component.title || 'Título do Hero'}
        </h1>
        {component.subtitle && (
          <p className="text-lg md:text-xl mb-8 opacity-90">
            {component.subtitle}
          </p>
        )}
        {component.buttonText && (
          <Button 
            size="lg" 
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            {component.buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};

// Renderizador de Produto
const ProductRenderer = ({ component, whatsappNumber }) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      component.whatsappText || `Olá! Tenho interesse no produto: ${component.title}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {component.image && (
        <div className="aspect-video relative">
          <img 
            src={component.image} 
            alt={component.title || 'Produto'} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2">{component.title || 'Nome do Produto'}</h3>
        {component.description && (
          <p className="text-gray-600 mb-4 line-clamp-3">{component.description}</p>
        )}
        {component.price && (
          <p className="text-2xl font-bold text-blue-600 mb-4">
            {formatPrice(component.price)}
          </p>
        )}
        <Button 
          onClick={handleWhatsApp}
          className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {component.whatsappText || 'Solicitar Orçamento'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Renderizador de Texto
const TextRenderer = ({ component }) => {
  return (
    <div className="prose max-w-none">
      {component.title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{component.title}</h2>
      )}
      {component.content && (
        <div 
          className="text-gray-700 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: component.content.replace(/\n/g, '<br/>') }}
        />
      )}
    </div>
  );
};

// Renderizador de CTA (Call to Action)
const CTARenderer = ({ component, whatsappNumber }) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(component.whatsappMessage || `Olá! Vi a página e gostaria de mais informações.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 md:p-12 text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">
        {component.title || 'Entre em Contato'}
      </h2>
      {component.description && (
        <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
          {component.description}
        </p>
      )}
      <Button 
        size="lg" 
        onClick={handleWhatsApp}
        className="bg-green-500 hover:bg-green-600 text-white gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        {component.buttonText || 'Fale Conosco no WhatsApp'}
      </Button>
    </div>
  );
};

// Renderizador de Banner
const BannerRenderer = ({ component, whatsappNumber }) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(component.whatsappMessage || `Olá! Vi a promoção e gostaria de saber mais.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const styleClasses = {
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
    dark: 'bg-gray-900',
    light: 'bg-gray-100 text-gray-900',
    image: ''
  };

  return (
    <div className={`relative overflow-hidden rounded-lg ${component.image ? '' : styleClasses[component.style] || styleClasses.gradient}`}>
      {component.image && (
        <img 
          src={component.image} 
          alt={component.title || 'Banner'} 
          className="w-full h-auto absolute inset-0 object-cover"
        />
      )}
      <div className={`relative z-10 py-16 px-8 text-center ${component.image ? 'bg-black/50' : ''} ${component.style === 'light' ? 'text-gray-900' : 'text-white'}`}>
        {component.title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{component.title}</h2>}
        {component.subtitle && <p className="text-lg md:text-xl mb-6 opacity-90">{component.subtitle}</p>}
        {component.buttonText && (
          <Button onClick={handleWhatsApp} size="lg" className="bg-green-500 hover:bg-green-600 text-white gap-2">
            <MessageCircle className="w-5 h-5" />
            {component.buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};

// Renderizador de Galeria
const GalleryRenderer = ({ component }) => {
  return (
    <div className="py-8">
      {component.title && (
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{component.title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(component.images || []).map((url, index) => (
          <div key={index} className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <img 
              src={url} 
              alt={`Galeria ${index + 1}`} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Renderizador de Vídeo
const VideoRenderer = ({ component }) => {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(component.videoUrl);

  return (
    <div className="py-8">
      {component.title && (
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">{component.title}</h2>
      )}
      {component.description && (
        <p className="text-gray-600 text-center mb-6 max-w-2xl mx-auto">{component.description}</p>
      )}
      {embedUrl && (
        <div className="aspect-video max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={embedUrl}
            title={component.title || 'Video'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};

// Renderizador de FAQ
const FAQRenderer = ({ component }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="py-8 max-w-3xl mx-auto">
      {component.title && (
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{component.title}</h2>
      )}
      <div className="space-y-4">
        {(component.items || []).map((item, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <button
              className="w-full p-4 text-left flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="font-semibold">{item.question}</span>
              <span className="text-xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="p-4 bg-white border-t">
                <p className="text-gray-700 whitespace-pre-wrap">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Renderizador de Estatísticas
const StatsRenderer = ({ component }) => {
  return (
    <div className="py-12 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl">
      {component.title && (
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{component.title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto px-4">
        {(component.stats || []).filter(s => s.value).map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
            <div className="text-sm md:text-base opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Renderizador de Características
const FeaturesRenderer = ({ component }) => {
  return (
    <div className="py-8">
      {component.title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{component.title}</h2>
      )}
      {component.description && (
        <p className="text-gray-600 mb-6">{component.description}</p>
      )}
      <ul className="space-y-3">
        {(component.features || []).map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-green-500 mt-1">✓</span>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Componente principal da página dinâmica
const DynamicPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteSettings, setSiteSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar página e configurações do site em paralelo
        const [pageResponse, settingsResponse] = await Promise.all([
          axios.get(`${API}/pages/${slug}`),
          axios.get(`${API}/site-settings`)
        ]);
        
        setPage(pageResponse.data);
        setSiteSettings(settingsResponse.data);
      } catch (err) {
        console.error('Error fetching page:', err);
        if (err.response?.status === 404) {
          setError('Página não encontrada');
        } else {
          setError('Erro ao carregar a página');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  // Renderiza componente baseado no tipo
  const renderComponent = (component, index) => {
    const whatsappNumber = siteSettings.whatsapp_number || '5511999999999';
    
    const componentMap = {
      'hero': <HeroRenderer key={index} component={component} whatsappNumber={whatsappNumber} />,
      'product': <ProductRenderer key={index} component={component} whatsappNumber={whatsappNumber} />,
      'text': <TextRenderer key={index} component={component} />,
      'cta': <CTARenderer key={index} component={component} whatsappNumber={whatsappNumber} />,
      'banner': <BannerRenderer key={index} component={component} whatsappNumber={whatsappNumber} />,
      'gallery': <GalleryRenderer key={index} component={component} />,
      'video': <VideoRenderer key={index} component={component} />,
      'faq': <FAQRenderer key={index} component={component} />,
      'stats': <StatsRenderer key={index} component={component} />,
      'features': <FeaturesRenderer key={index} component={component} />,
    };

    return componentMap[component.type] || (
      <div key={index} className="p-4 bg-gray-100 rounded">
        <p className="text-gray-500">Componente desconhecido: {component.type}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">⚠️ {error}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              {error === 'Página não encontrada' 
                ? 'A página que você está procurando não existe ou foi removida.'
                : 'Ocorreu um erro ao carregar a página. Tente novamente mais tarde.'}
            </p>
            <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  // Obtém os componentes da página (pode estar em 'components' ou 'content')
  const components = page.components || page.content || [];

  return (
    <div className="dynamic-page">
      {/* Meta tags via Helmet poderiam ser adicionadas aqui */}
      
      {/* Renderiza cada componente */}
      <div className="space-y-8">
        {components.length > 0 ? (
          components.map((component, index) => (
            <div key={component.id || index}>
              {/* Componentes hero e banner são full-width */}
              {component.type === 'hero' || component.type === 'banner' ? (
                renderComponent(component, index)
              ) : (
                <div className="container mx-auto px-4">
                  {component.type === 'product' ? (
                    <div className="max-w-md mx-auto">
                      {renderComponent(component, index)}
                    </div>
                  ) : (
                    renderComponent(component, index)
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-gray-500">Esta página ainda não tem conteúdo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicPage;
