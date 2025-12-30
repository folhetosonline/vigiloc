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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import ContentBlockRenderer from "@/components/ContentBlockRenderer";

// Hero Section with Video Background
const HeroSection = ({ siteSettings }) => {
  const whatsappNumber = siteSettings?.whatsapp_number || '5511999999999';
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de conhecer as soluções da VigiLoc.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video 
        className="absolute inset-0 w-full h-full object-cover"
        src="https://customer-assets.emergentagent.com/job_smart-security-12/artifacts/2cbdrd0e_vigiloc.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-blue-600/30 backdrop-blur-sm rounded-full text-sm font-medium border border-blue-400/30">
            🛡️ Líder em Automação e Segurança Eletrônica
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          Transformando <span className="text-blue-400">Espaços</span>
          <br />
          em Ambientes <span className="text-blue-400">Inteligentes</span>
        </h1>
        
        <p className="text-base md:text-lg lg:text-xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
          Soluções completas em portaria autônoma, automação comercial e segurança eletrônica 
          para condomínios e empresas. Tecnologia de ponta para o seu negócio.
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
          <Link to="/servicos">
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 gap-2 text-lg px-8 py-6 w-full sm:w-auto"
            >
              Conheça Nossos Serviços
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">+500</div>
            <div className="text-sm opacity-80 mt-1">Clientes Atendidos</div>
          </div>
          <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">24/7</div>
            <div className="text-sm opacity-80 mt-1">Monitoramento</div>
          </div>
          <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">10+</div>
            <div className="text-sm opacity-80 mt-1">Anos de Experiência</div>
          </div>
          <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="text-3xl md:text-4xl font-bold text-blue-400">99%</div>
            <div className="text-sm opacity-80 mt-1">Satisfação</div>
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
        className="group overflow-hidden h-full cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image/Banner Section */}
        <div 
          className="relative h-48 md:h-56 overflow-hidden"
          style={getBackgroundStyle()}
        >
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-70'}`} />
          
          {/* Icon Badge */}
          <div className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl border border-white/30">
            {service.icon || '🛡️'}
          </div>
          
          {/* Title on Image */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
              {service.name}
            </h3>
          </div>
        </div>
        
        {/* Content Section */}
        <CardContent className="p-5">
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {service.shortDescription}
          </p>
          
          {/* Features Preview */}
          {service.features && service.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {service.features.slice(0, 2).map((feature, idx) => (
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
          <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700">
            <span>Saiba mais</span>
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Services Grid Section
const ServicesSection = ({ services, loading }) => {
  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Carregando serviços...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="servicos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Nossas Soluções
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-gray-900">
            Serviços <span className="text-blue-600">VigiLoc</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Conheça todas as soluções que oferecemos para transformar a segurança e gestão do seu espaço
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Ver Todos Button */}
        <div className="text-center mt-12">
          <Link to="/servicos">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              Ver Todos os Serviços
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// Why Choose Us Section
const WhyChooseUsSection = () => {
  const benefits = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Segurança Total",
      description: "Sistemas integrados com monitoramento 24 horas e resposta imediata a incidentes"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Suporte 24/7",
      description: "Atendimento especializado sempre que você precisar, a qualquer hora do dia"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Equipe Especializada",
      description: "Profissionais certificados para instalação e manutenção de todos os sistemas"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Qualidade Garantida",
      description: "Equipamentos de última geração com garantia estendida e suporte técnico"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Diferenciais
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-gray-900">
            Por que escolher a <span className="text-blue-600">VigiLoc</span>?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="text-center p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection = ({ siteSettings }) => {
  const whatsappNumber = siteSettings?.whatsapp_number || '5511999999999';
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de solicitar um orçamento para as soluções VigiLoc.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pronto para transformar seu espaço?
        </h2>
        <p className="text-base md:text-lg opacity-90 mb-8 max-w-2xl mx-auto">
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
              className="border-white text-white hover:bg-white/10 gap-2 text-lg px-8 py-6 w-full sm:w-auto"
            >
              Outras formas de contato
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// Source icons configuration
const SOURCE_ICONS = {
  google: { icon: "🔴", name: "Google", color: "text-red-500" },
  facebook: { icon: "🔵", name: "Facebook", color: "text-blue-600" },
  instagram: { icon: "📸", name: "Instagram", color: "text-pink-500" },
  whatsapp: { icon: "💬", name: "WhatsApp", color: "text-green-500" },
  manual: { icon: "✍️", name: "Cliente", color: "text-gray-500" }
};

// Star Display Component
const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// Reviews Section
const ReviewsSection = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotate reviews
  useEffect(() => {
    if (reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  if (!reviews || reviews.length === 0) return null;

  const getSourceConfig = (source) => SOURCE_ICONS[source] || SOURCE_ICONS.manual;

  // For mobile: show one at a time with dots
  // For desktop: show grid of 3
  const visibleReviews = reviews.slice(0, 6);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-gray-900">
            O que nossos <span className="text-blue-600">clientes</span> dizem
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Veja as avaliações de quem já confia na VigiLoc
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleReviews.map((review, index) => {
            const sourceConfig = getSourceConfig(review.source);
            return (
              <Card key={review.id || index} className="bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {review.author_avatar ? (
                        <img 
                          src={review.author_avatar} 
                          alt={review.author_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {review.author_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{review.author_name}</p>
                        <StarDisplay rating={review.rating} />
                      </div>
                    </div>
                    <span className="text-xl" title={sourceConfig.name}>
                      {sourceConfig.icon}
                    </span>
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                    "{review.text}"
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div className="relative">
            {reviews.length > 0 && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {reviews[currentIndex].author_avatar ? (
                        <img 
                          src={reviews[currentIndex].author_avatar} 
                          alt={reviews[currentIndex].author_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {reviews[currentIndex].author_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{reviews[currentIndex].author_name}</p>
                        <StarDisplay rating={reviews[currentIndex].rating} />
                      </div>
                    </div>
                    <span className="text-xl">
                      {getSourceConfig(reviews[currentIndex].source).icon}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    "{reviews[currentIndex].text}"
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Dots */}
            {reviews.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {reviews.slice(0, 6).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Home Component
const Home = () => {
  const [services, setServices] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCustomBlocks, setHasCustomBlocks] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, settingsRes, reviewsRes, blocksRes] = await Promise.all([
          axios.get(`${API}/services`),
          axios.get(`${API}/site-settings`),
          axios.get(`${API}/social-reviews/featured`).catch(() => ({ data: [] })),
          axios.get(`${API}/content-blocks/home`).catch(() => ({ data: [] }))
        ]);
        
        setServices(servicesRes.data);
        setSiteSettings(settingsRes.data);
        setReviews(reviewsRes.data);
        setHasCustomBlocks(blocksRes.data && blocksRes.data.length > 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home-page">
      <SEO 
        title="VigiLoc - Soluções em Automação e Segurança Eletrônica"
        description="Líder em portaria autônoma, automação comercial e segurança eletrônica para condomínios e empresas. Armários inteligentes, mini mercados autônomos, lavanderia autônoma e muito mais."
        keywords="portaria autônoma, armários inteligentes, mini mercados autônomos, lavanderia autônoma, segurança eletrônica, automação comercial, condomínios inteligentes, totens de monitoramento"
      />
      
      {/* Custom Content Blocks from Page Builder - shown at top if available */}
      <ContentBlockRenderer pageId="home" />

      {/* Default Content - shown if no custom blocks or as fallback */}
      {!hasCustomBlocks && (
        <>
          {/* Hero with Video */}
          <HeroSection siteSettings={siteSettings} />

          {/* Services Grid */}
          <ServicesSection services={services} loading={loading} />

          {/* Why Choose Us */}
          <WhyChooseUsSection />

          {/* Customer Reviews */}
          <ReviewsSection reviews={reviews} />

          {/* CTA */}
          <CTASection siteSettings={siteSettings} />
        </>
      )}
      
      {/* If there are custom blocks, still show services section after custom content */}
      {hasCustomBlocks && (
        <>
          {/* Services Grid */}
          <ServicesSection services={services} loading={loading} />

          {/* Customer Reviews */}
          <ReviewsSection reviews={reviews} />

          {/* CTA */}
          <CTASection siteSettings={siteSettings} />
        </>
      )}
    </div>
  );
};

export default Home;
