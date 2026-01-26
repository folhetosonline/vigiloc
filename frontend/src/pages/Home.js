import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { 
  MessageCircle, 
  ArrowRight, 
  Shield, 
  Clock, 
  Users, 
  Award,
  ChevronRight,
  Play,
  Loader2,
  Zap,
  CheckCircle,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";

// Icon mapping for dynamic icons
const IconMap = {
  Shield, Clock, Users, Award, Zap, CheckCircle, Star
};

// Hero Section with Video Background - Now uses admin settings
const HeroSection = ({ siteSettings, homepageSettings }) => {
  const whatsappNumber = siteSettings?.whatsapp_number || '5511999999999';
  const hero = homepageSettings?.hero || {};
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de conhecer as soluções da VigiLoc.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleCTA = (url) => {
    if (!url) {
      handleWhatsApp();
    } else if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  // Default values
  const videoUrl = hero.video_url || "https://customer-assets.emergentagent.com/job_smart-security-12/artifacts/2cbdrd0e_vigiloc.mp4";
  const badgeText = hero.badge_text || "🛡️ Líder em Automação e Segurança Eletrônica";
  const title = hero.title || "Transformando <span class='text-blue-400'>Espaços</span><br />em Ambientes <span class='text-blue-400'>Inteligentes</span>";
  const subtitle = hero.subtitle || "Soluções completas em portaria autônoma, automação comercial e segurança eletrônica para condomínios e empresas. Tecnologia de ponta para o seu negócio.";
  const ctaPrimaryText = hero.cta_primary_text || "Fale com um Consultor";
  const ctaSecondaryText = hero.cta_secondary_text || "Conheça Nossos Serviços";
  const ctaSecondaryUrl = hero.cta_secondary_url || "/servicos";
  const showStats = hero.show_stats !== false;
  const stats = hero.stats || [
    { value: "+500", label: "Clientes Atendidos" },
    { value: "24/7", label: "Monitoramento" },
    { value: "10+", label: "Anos de Experiência" },
    { value: "99%", label: "Satisfação" }
  ];

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video 
        className="absolute inset-0 w-full h-full object-cover"
        src={videoUrl}
        poster={hero.poster_url}
        autoPlay
        muted
        loop
        playsInline
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        {badgeText && (
          <div className="mb-6 animate-fade-in">
            <span className="inline-block px-4 py-2 bg-blue-600/30 backdrop-blur-sm rounded-full text-sm font-medium border border-blue-400/30">
              {badgeText}
            </span>
          </div>
        )}
        
        <h1 
          className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        
        <p className="text-base md:text-lg lg:text-xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => handleCTA(hero.cta_primary_url)}
            className="bg-green-500 hover:bg-green-600 text-white gap-2 text-lg px-8 py-6 cursor-default"
          >
            <MessageCircle className="w-5 h-5" />
            {ctaPrimaryText}
          </Button>
          {ctaSecondaryText && (
            <Link to={ctaSecondaryUrl}>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10 gap-2 text-lg px-8 py-6 w-full sm:w-auto cursor-default"
              >
                {ctaSecondaryText}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
        
        {/* Stats - Controlled by Admin */}
        {showStats && stats.length > 0 && (
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-sm opacity-80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-white/80 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ service, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getBackgroundStyle = () => {
    if (service.headerBanner?.mediaUrl) {
      return {
        backgroundImage: `url(${service.headerBanner.mediaUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {
      background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
    };
  };

  return (
    <Link to={`/servico/${service.slug}`}>
      <Card 
        className="group h-full overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500"
        style={{ animationDelay: `${index * 100}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 overflow-hidden" style={getBackgroundStyle()}>
          {/* Video preview for video banners */}
          {service.headerBanner?.type === 'video' && service.headerBanner?.mediaUrl && (
            <video 
              className="absolute inset-0 w-full h-full object-cover"
              src={service.headerBanner.mediaUrl}
              muted
              loop
              playsInline
              autoPlay={isHovered}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{service.icon || '🛡️'}</span>
              <h3 className="text-xl font-bold text-white">{service.name}</h3>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {service.shortDescription || service.description?.substring(0, 100)}
          </p>
          <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all cursor-default">
            Saiba mais
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Features Section - Controlled by Admin
const FeaturesSection = ({ homepageSettings }) => {
  const features = homepageSettings?.features || {};
  
  if (features.enabled === false) return null;
  
  const title = features.title || "Por que escolher a VigiLoc?";
  const items = features.items || [
    { icon: "Shield", title: "Segurança Garantida", description: "Sistemas certificados e testados para máxima proteção" },
    { icon: "Clock", title: "Suporte 24/7", description: "Equipe técnica disponível a qualquer momento" },
    { icon: "Users", title: "Atendimento Personalizado", description: "Soluções sob medida para cada cliente" },
    { icon: "Award", title: "Experiência Comprovada", description: "Mais de 10 anos no mercado de segurança" }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((feature, index) => {
            const IconComponent = IconMap[feature.icon] || Shield;
            return (
              <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// CTA Section - Controlled by Admin
const CTASection = ({ homepageSettings, siteSettings }) => {
  const cta = homepageSettings?.cta_section || {};
  const whatsappNumber = siteSettings?.whatsapp_number || '5511999999999';
  
  if (cta.enabled === false) return null;
  
  const title = cta.title || "Pronto para Transformar seu Espaço?";
  const subtitle = cta.subtitle || "Entre em contato conosco e descubra como podemos ajudar";
  const buttonText = cta.button_text || "Solicitar Orçamento";
  const buttonUrl = cta.button_url || "/contato";

  const handleClick = () => {
    if (buttonUrl === "/contato" || !buttonUrl) {
      window.location.href = "/contato";
    } else if (buttonUrl.startsWith('http')) {
      window.open(buttonUrl, '_blank');
    } else {
      window.location.href = buttonUrl;
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {title}
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          {subtitle}
        </p>
        <Button 
          size="lg" 
          onClick={handleClick}
          className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 cursor-default"
        >
          {buttonText}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </section>
  );
};

// Main Home Component
const Home = () => {
  const [services, setServices] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [homepageSettings, setHomepageSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, siteRes, homepageRes] = await Promise.all([
          axios.get(`${API}/services`),
          axios.get(`${API}/site-settings`),
          axios.get(`${API}/homepage-settings`)
        ]);
        setServices(servicesRes.data.filter(s => s.published) || []);
        setSiteSettings(siteRes.data || {});
        setHomepageSettings(homepageRes.data || {});
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter services based on homepage settings
  const getDisplayServices = () => {
    const featuredIds = homepageSettings?.services?.featured_ids || [];
    if (featuredIds.length > 0) {
      return services.filter(s => featuredIds.includes(s.id));
    }
    return services;
  };

  const displayServices = getDisplayServices();
  const servicesConfig = homepageSettings?.services || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEO 
        title="VigiLoc - Soluções em Segurança Eletrônica"
        description="Soluções completas em portaria autônoma, automação comercial e segurança eletrônica para condomínios e empresas."
      />
      
      {/* Hero Section */}
      <HeroSection siteSettings={siteSettings} homepageSettings={homepageSettings} />

      {/* Services Section */}
      {servicesConfig.enabled !== false && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {servicesConfig.title || "Nossas Soluções"}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {servicesConfig.subtitle || "Tecnologia de ponta para transformar seu espaço em um ambiente inteligente e seguro"}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="ml-3 text-gray-500">Carregando serviços...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayServices.slice(0, 6).map((service, index) => (
                    <ServiceCard key={service.id} service={service} index={index} />
                  ))}
                </div>
                
                {servicesConfig.show_all_button !== false && services.length > 6 && (
                  <div className="text-center mt-12">
                    <Link to="/servicos">
                      <Button size="lg" variant="outline" className="cursor-default">
                        Ver Todos os Serviços
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <FeaturesSection homepageSettings={homepageSettings} />

      {/* CTA Section */}
      <CTASection homepageSettings={homepageSettings} siteSettings={siteSettings} />
    </div>
  );
};

export default Home;
