import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Camera, Bell, Users, DollarSign, Shield, Clock, MapPin } from "lucide-react";

const Totens = () => {
  const features = [
    {
      icon: <DollarSign className="w-10 h-10 text-blue-600" />,
      title: "Instalação Gratuita",
      description: "Poste instalado no endereço após vistoria técnica, sem custos iniciais"
    },
    {
      icon: <Users className="w-10 h-10 text-blue-600" />,
      title: "Assinatura pelos Moradores",
      description: "Adesão por residência ou comércio da rua, modelo comunitário"
    },
    {
      icon: <Camera className="w-10 h-10 text-blue-600" />,
      title: "Acesso às Imagens",
      description: "Visualização da rua em tempo real 24h por dia pelo aplicativo"
    },
    {
      icon: <Bell className="w-10 h-10 text-blue-600" />,
      title: "Alertas Automáticos",
      description: "Detecção de movimentos suspeitos com notificação imediata"
    }
  ];

  const plans = [
    {
      name: "Mensal",
      price: "12,99",
      period: "/ mês",
      features: [
        "Acesso total às câmeras 24h",
        "Alertas em tempo real",
        "Sem fidelidade"
      ],
      featured: false
    },
    {
      name: "Trimestral",
      price: "10,99",
      period: "/ mês (cobrança a cada 3 meses)",
      features: [
        "Economia vs. mensal",
        "Suporte prioritário",
        "Alertas em tempo real"
      ],
      featured: false
    },
    {
      name: "Semestral",
      price: "9,99",
      period: "/ mês (cobrança semestral)",
      features: [
        "Melhor custo-benefício",
        "Suporte prioritário +",
        "Alertas em tempo real"
      ],
      featured: true
    },
    {
      name: "Anual",
      price: "7,99",
      period: "/ mês (cobrança anual)",
      features: [
        "Maior economia",
        "Cashback dobrado",
        "Alertas em tempo real"
      ],
      featured: false
    }
  ];

  return (
    <div className="totens-page" data-testid="totens-page">
      {/* Hero Section */}
      <section className="hero-gradient relative py-24 lg:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Segurança Inteligente
              <br />
              <span className="text-blue-200">Na Sua Rua</span>
            </h1>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Postes de monitoramento com câmeras de alta tecnologia, instalados gratuitamente no seu prédio, casa ou comércio. Moradores da rua assinam um plano e têm acesso às imagens da via e alertas em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contato">
                <Button data-testid="quero-poste-btn" size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-6">
                  Quero um Poste VigiLoc
                </Button>
              </Link>
              <Button data-testid="saiba-mais-btn" size="lg" variant="outline" className="btn-secondary text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-blue-700">
                Saiba Mais
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">*Instalação sujeita à avaliação técnica do local</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Como Funciona</h2>
            <p className="text-lg text-gray-600">Segurança colaborativa para sua comunidade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover" data-testid={`feature-card-${index}`}>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Escolha seu Plano de Segurança</h2>
            <p className="text-lg text-gray-600">Planos flexíveis para cada necessidade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`pricing-card ${plan.featured ? 'featured' : ''}`}
                data-testid={`pricing-card-${index}`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  <span className={`text-sm ${plan.featured ? 'text-blue-100' : 'text-gray-600'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start" data-testid={`plan-${index}-feature-${fIndex}`}>
                      <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${plan.featured ? 'text-white' : 'text-green-500'}`} />
                      <span className={plan.featured ? 'text-white' : 'text-gray-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  data-testid={`assinar-btn-${index}`}
                  className={`w-full ${plan.featured ? 'bg-white text-blue-700 hover:bg-gray-100' : 'btn-primary'}`}
                >
                  Assinar {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cashback Section */}
      <section className="py-16 bg-white" data-testid="cashback-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-white">
            <h2 className="text-4xl font-bold mb-4">💸 Cashback VigiLoc</h2>
            <h3 className="text-2xl font-semibold mb-4">Dinheiro de volta para o ponto de instalação</h3>
            <p className="text-lg mb-6 opacity-90">
              O local onde o poste VigiLoc é instalado <strong>recebe parte do valor das assinaturas</strong> de volta todos os meses. 
              Transforme sua fachada em um ponto de segurança e ainda seja recompensado por isso.
            </p>
            <Link to="/contato">
              <Button data-testid="instalar-fachada-btn" size="lg" className="bg-white text-green-700 hover:bg-gray-100 text-lg px-8 py-6">
                Quero instalar na minha fachada
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50" data-testid="benefits-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Vantagens dos Totens VigiLoc</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Segurança 24/7</h3>
                <p className="text-gray-600">Monitoramento contínuo com câmeras de alta definição e visão noturna</p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Resposta Rápida</h3>
                <p className="text-gray-600">Alertas instantâneos no seu celular para movimentos suspeitos</p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Cobertura Total</h3>
                <p className="text-gray-600">Visão completa da sua rua com múltiplos ângulos de câmera</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-500" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Proteja Sua Rua com VigiLoc</h2>
          <p className="text-lg mb-8 opacity-90">
            Entre em contato conosco via WhatsApp e receba uma avaliação técnica gratuita
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              data-testid="whatsapp-cta-btn"
              onClick={() => window.open("https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre os Totens VigiLoc", "_blank")}
              size="lg"
              className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-6"
            >
              Fale Conosco no WhatsApp
            </Button>
            <Link to="/contato">
              <Button
                data-testid="contato-cta-btn"
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-blue-700 text-lg px-8 py-6"
              >
                Solicitar Avaliação
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Totens;