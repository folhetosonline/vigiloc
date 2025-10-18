import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Camera, KeyRound, Lock, CheckCircle, Users, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data.slice(0, 3));
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };
    fetchProducts();
  }, []);

  const features = [
    {
      icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
      title: "Segurança Garantida",
      description: "Soluções certificadas e testadas para máxima proteção"
    },
    {
      icon: <Users className="w-12 h-12 text-blue-600" />,
      title: "Suporte 24/7",
      description: "Atendimento especializado sempre que você precisar"
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
      title: "Instalação Profissional",
      description: "Equipe técnica qualificada para instalação completa"
    }
  ];

  const categories = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Câmeras de Vigilância",
      description: "Sistemas CCTV e IP de alta definição",
      link: "/produtos?category=cameras"
    },
    {
      icon: <KeyRound className="w-8 h-8" />,
      title: "Controle de Acesso",
      description: "Catracas, biometria e cartões de acesso",
      link: "/produtos?category=controle-acesso"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Fechaduras Inteligentes",
      description: "Fechaduras digitais e eletrônicas",
      link: "/produtos?category=fechaduras"
    },
    {
      icon: <Landmark className="w-8 h-8" />,
      title: "Totens de Monitoramento",
      description: "Postes inteligentes com câmeras e alertas",
      link: "/totens"
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-gradient relative py-24 lg:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Soluções Inteligentes em Segurança
              <br />
              <span className="text-blue-200">Para Condomínios e Empresas</span>
            </h1>
            <p className="text-lg sm:text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Sistemas de vigilância, controle de acesso, fechaduras inteligentes e totens de monitoramento para proteger o que é mais importante
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/produtos">
                <Button data-testid="ver-produtos-btn" size="lg" className="btn-primary text-lg px-8 py-6">
                  Ver Produtos
                </Button>
              </Link>
              <Link to="/totens">
                <Button data-testid="ver-totens-btn" size="lg" variant="outline" className="btn-secondary text-lg px-8 py-6 bg-white hover:bg-blue-700 hover:text-white">
                  Conheça os Totens
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nossas Soluções</h2>
            <p className="text-lg text-gray-600">Produtos de alta qualidade para cada necessidade</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Link to={category.link} key={index}>
                <Card className="card-hover h-full" data-testid={`category-card-${index}`}>
                  <CardContent className="p-8 text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{category.title}</h3>
                    <p className="text-gray-600">{category.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50" data-testid="featured-products-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Produtos em Destaque</h2>
            <p className="text-lg text-gray-600">Conheça nossos produtos mais populares</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <Link to={`/produto/${product.id}`} key={product.id}>
                <div className="product-card" data-testid={`featured-product-${index}`}>
                  <img src={product.image} alt={product.name} className="product-image" />
                  <div className="p-6">
                    <span className="category-badge">{product.category}</span>
                    <h3 className="text-xl font-semibold mt-3 mb-2 text-gray-900">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">R$ {product.price.toFixed(2)}</span>
                      <Button data-testid={`ver-detalhes-btn-${index}`} className="btn-primary">Ver Detalhes</Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Por Que Escolher a VigiLoc?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover" data-testid={`feature-card-${index}`}>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-blue-500" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Pronto para Proteger Seu Patrimônio?</h2>
          <p className="text-lg mb-8 opacity-90">
            Entre em contato conosco via WhatsApp e receba um orçamento personalizado
          </p>
          <Button data-testid="fale-conosco-btn" size="lg" className="bg-white text-blue-700 hover:bg-gray-100 text-lg px-8 py-6"
            onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
          >
            Fale Conosco Agora
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;