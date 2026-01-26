import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Loader2, Phone, Check, ChevronRight } from "lucide-react";
import axios from "axios";
import { API } from "@/App";

// Hero/Banner Renderer with video support
const ServiceHero = ({ banner, service, whatsappNumber }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef(null);

  // Try to play video on load
  useEffect(() => {
    if (videoRef.current && videoLoaded) {
      videoRef.current.play().catch(() => {
        setShowPlayButton(true);
      });
    }
  }, [videoLoaded]);

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setShowPlayButton(false);
      }).catch(() => {
        // Open video in new tab if still can't play
        window.open(banner.mediaUrl, '_blank');
      });
    }
  };

  if (!banner) {
    // Default hero without banner config
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {service.name}
          </h1>
          {service.shortDescription && (
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {service.shortDescription}
            </p>
          )}
          <Button 
            size="lg" 
            onClick={() => window.open(`https://wa.me/${whatsappNumber}?text=Olá! Tenho interesse no serviço: ${service.name}`, '_blank')}
            className="bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Solicitar Orçamento
          </Button>
        </div>
      </div>
    );
  }

  const handleCTA = () => {
    if (banner.ctaUrl) {
      if (banner.ctaUrl.startsWith('http')) {
        window.open(banner.ctaUrl, '_blank');
      } else {
        window.location.href = banner.ctaUrl;
      }
    } else {
      window.open(`https://wa.me/${whatsappNumber}?text=Olá! Tenho interesse no serviço: ${service.name}`, '_blank');
    }
  };

  // Determine background style - use poster for video backgrounds
  const getBackgroundStyle = () => {
    if (banner.type === 'video') {
      const posterUrl = banner.posterUrl || banner.poster || banner.image;
      if (posterUrl) {
        return `url(${posterUrl})`;
      }
      return 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)';
    }
    if (banner.type === 'image' && banner.mediaUrl) {
      return `url(${banner.mediaUrl})`;
    }
    if (banner.type === 'gradient') {
      return 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)';
    }
    return 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)';
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ 
        minHeight: banner.height || '70vh',
        backgroundImage: getBackgroundStyle(),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1F2937'
      }}
    >
      {/* Video Background */}
      {banner.type === 'video' && banner.mediaUrl && !videoError && (
        <>
          <video 
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="auto"
            poster={banner.posterUrl || banner.poster || banner.image}
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlayThrough={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => setShowPlayButton(true));
              }
            }}
            onError={(e) => {
              console.warn('Video failed to load:', banner.mediaUrl);
              setVideoError(true);
            }}
          >
            <source src={banner.mediaUrl} type="video/mp4" />
            <source src={banner.mediaUrl} type="video/webm" />
          </video>
          
          {/* Play button overlay for blocked autoplay */}
          {showPlayButton && (
            <button 
              onClick={handlePlayClick}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </>
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundColor: banner.overlayColor || 'rgba(0,0,0,0.5)', 
          opacity: (banner.overlayOpacity || 50) / 100 
        }}
      />
      
      {/* Content */}
      <div 
        className="relative z-10 p-8 w-full max-w-4xl mx-auto"
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: banner.textAlign === 'center' ? 'center' : banner.textAlign === 'right' ? 'flex-end' : 'flex-start',
          justifyContent: banner.verticalAlign === 'center' ? 'center' : banner.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
          textAlign: banner.textAlign || 'center',
          minHeight: '50vh'
        }}
      >
        {(banner.title || service.name) && (
          <h1 
            className={`text-${banner.titleSize || '5xl'} font-bold mb-4`}
            style={{ 
              color: banner.titleColor || '#FFFFFF', 
              fontFamily: banner.titleFont || 'Inter' 
            }}
          >
            {banner.title || service.name}
          </h1>
        )}
        {(banner.subtitle || service.shortDescription) && (
          <p 
            className={`text-${banner.subtitleSize || 'xl'} mb-6 max-w-2xl`}
            style={{ color: banner.subtitleColor || '#FFFFFF' }}
          >
            {banner.subtitle || service.shortDescription}
          </p>
        )}
        {(banner.ctaText || true) && (
          <Button 
            size="lg"
            onClick={handleCTA}
            className="transition-transform hover:scale-105"
            style={{ 
              backgroundColor: banner.ctaColor || '#22C55E', 
              color: banner.ctaTextColor || '#FFFFFF' 
            }}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {banner.ctaText || 'Solicitar Orçamento'}
          </Button>
        )}
      </div>
    </div>
  );
};

// Features Section
const ServiceFeatures = ({ features }) => {
  if (!features || features.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Por que escolher este serviço?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">{feature.icon || '✓'}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Gallery Section
const ServiceGallery = ({ gallery, serviceName }) => {
  if (!gallery || gallery.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Galeria</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((url, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all">
              <img 
                src={url} 
                alt={`${serviceName} - ${index + 1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const ServiceCTA = ({ service, whatsappNumber }) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Tenho interesse no serviço: ${service.name}. Gostaria de mais informações.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Interessado em {service.name}?
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Entre em contato conosco e solicite um orçamento personalizado sem compromisso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </Button>
          <Link to="/contato">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
              <Phone className="w-5 h-5" />
              Outras formas de contato
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// Main Service Page Component
const ServicePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [siteSettings, setSiteSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [serviceRes, settingsRes] = await Promise.all([
          axios.get(`${API}/services/${slug}`),
          axios.get(`${API}/site-settings`)
        ]);
        
        setService(serviceRes.data);
        setSiteSettings(settingsRes.data);
      } catch (err) {
        console.error('Error fetching service:', err);
        if (err.response?.status === 404) {
          setError('Serviço não encontrado');
        } else {
          setError('Erro ao carregar o serviço');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  const whatsappNumber = service?.ctaWhatsapp || siteSettings.whatsapp_number || '5511999999999';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando serviço...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ {error}</h2>
          <p className="text-gray-600 mb-6">
            O serviço que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/servicos')} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Ver todos os serviços
          </Button>
        </Card>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="service-page">
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Início</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/servicos" className="hover:text-blue-600">Serviços</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{service.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Banner */}
      <ServiceHero 
        banner={service.headerBanner} 
        service={service} 
        whatsappNumber={whatsappNumber} 
      />

      {/* Features */}
      <ServiceFeatures features={service.features} />

      {/* Description */}
      {service.fullDescription && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="prose max-w-none">
              <h2 className="text-3xl font-bold mb-6">Sobre {service.name}</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {service.fullDescription}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      <ServiceGallery gallery={service.gallery} serviceName={service.name} />

      {/* CTA */}
      <ServiceCTA service={service} whatsappNumber={whatsappNumber} />
    </div>
  );
};

export default ServicePage;
