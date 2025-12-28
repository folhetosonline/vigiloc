import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowRight, Loader2, Play, ChevronRight } from "lucide-react";
import axios from "axios";
import { API } from "@/App";

// Hero Section with Video Background
const ServicesHero = ({ siteSettings }) => {
  const whatsappNumber = siteSettings.whatsapp_number || '5511999999999';
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de conhecer os serviços da VigiLoc.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video 
        className="absolute inset-0 w-full h-full object-cover"
        src="https://customer-assets.emergentagent.com/job_smart-security-12/artifacts/2cbdrd0e_vigiloc.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-blue-600/30 backdrop-blur-sm rounded-full text-sm font-medium border border-blue-400/30">
            🛡️ Soluções em Segurança e Automação
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          Nossos <span className="text-blue-400">Serviços</span>
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
          Tecnologia de ponta para transformar a segurança e gestão do seu condomínio ou empresa. 
          Conheça nossas soluções inteligentes.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white gap-2 text-lg px-8 py-6"
          >
            <MessageCircle className="w-5 h-5" />
            Fale com um Consultor
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-white text-white hover:bg-white/10 gap-2 text-lg px-8 py-6"
            onClick={() => document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver Serviços
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">+500</div>
            <div className="text-sm opacity-80">Clientes Atendidos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">24/7</div>
            <div className="text-sm opacity-80">Monitoramento</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">10+</div>
            <div className="text-sm opacity-80">Anos de Experiência</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">99%</div>
            <div className="text-sm opacity-80">Satisfação</div>
          </div>
        </div>
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
        className="group overflow-hidden h-full cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image/Banner Section */}
        <div 
          className="relative h-56 md:h-64 overflow-hidden"
          style={getBackgroundStyle()}
        >
          {/* Video Background for specific services */}
          {service.headerBanner?.type === 'video' && service.headerBanner?.mediaUrl && (
            <video 
              className="absolute inset-0 w-full h-full object-cover"
              src={service.headerBanner.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-70'}`} />
          
          {/* Icon Badge */}
          <div className="absolute top-4 left-4 w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-3xl border border-white/30">
            {service.icon || '🛡️'}
          </div>
          
          {/* Title on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              {service.name}
            </h3>
          </div>
        </div>
        
        {/* Content Section */}
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4 line-clamp-2">
            {service.shortDescription}
          </p>
          
          {/* Features Preview */}
          {service.features && service.features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {service.features.slice(0, 3).map((feature, idx) => (
                <span 
                  key={idx} 
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {feature.icon} {feature.title}
                </span>
              ))}
            </div>
          )}
          
          {/* CTA */}
          <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
            <span>Saiba mais</span>
            <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Services Grid Section
const ServicesGrid = ({ services }) => {
  return (
    <section id="services-grid" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Nossas Soluções
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Serviços <span className="text-blue-600">VigiLoc</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Conheça todas as soluções que oferecemos para transformar a segurança e gestão do seu espaço
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Why Choose Us Section
const WhyChooseUs = () => {
  const benefits = [
    {
      icon: "🔒",
      title: "Segurança Total",
      description: "Sistemas integrados com monitoramento 24 horas e resposta imediata a incidentes"
    },
    {
      icon: "💡",
      title: "Tecnologia de Ponta",
      description: "Equipamentos de última geração com inteligência artificial e machine learning"
    },
    {
      icon: "📱",
      title: "Acesso Remoto",
      description: "Controle tudo pelo smartphone, de qualquer lugar do mundo"
    },
    {
      icon: "💰",
      title: "Economia Real",
      description: "Reduza custos operacionais em até 70% com automação inteligente"
    },
    {
      icon: "🛠️",
      title: "Suporte Especializado",
      description: "Equipe técnica certificada disponível para instalação e manutenção"
    },
    {
      icon: "🤝",
      title: "Parceria Duradoura",
      description: "Mais de 10 anos de experiência e centenas de clientes satisfeitos"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Diferenciais
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Por que escolher a <span className="text-blue-600">VigiLoc</span>?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = ({ siteSettings }) => {
  const whatsappNumber = siteSettings.whatsapp_number || '5511999999999';
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de solicitar um orçamento para os serviços da VigiLoc.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Pronto para transformar seu espaço?
        </h2>
        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
          Entre em contato agora e receba um orçamento personalizado sem compromisso. 
          Nossa equipe está pronta para atendê-lo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white gap-2 text-lg px-8 py-6"
          >
            <MessageCircle className="w-5 h-5" />
            Falar pelo WhatsApp
          </Button>
          <Link to="/contato">
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 gap-2 text-lg px-8 py-6"
            >
              Outras formas de contato
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// Main Services Page Component
const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, settingsRes] = await Promise.all([
          axios.get(`${API}/services`),
          axios.get(`${API}/site-settings`)
        ]);
        
        setServices(servicesRes.data);
        setSiteSettings(settingsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      <ServicesHero siteSettings={siteSettings} />
      <ServicesGrid services={services} />
      <WhyChooseUs />
      <CTASection siteSettings={siteSettings} />
    </div>
  );
};

export default ServicesPage;
