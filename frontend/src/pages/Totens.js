import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Camera, Bell, Users, DollarSign, Shield } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import SEO from "@/components/SEO";
import ProductFilter from "@/components/ProductFilter";
import ContentBlockRenderer from "@/components/ContentBlockRenderer";

const Totens = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  const badgeConfig = {
    "novidade": { label: "🆕 Novidade", color: "bg-green-100 text-green-800" },
    "lancamento": { label: "🚀 Lançamento", color: "bg-blue-100 text-blue-800" },
    "custo-beneficio": { label: "💰 Ótimo Custo-Benefício", color: "bg-yellow-100 text-yellow-800" },
    "top-linha": { label: "⭐ Top de Linha", color: "bg-purple-100 text-purple-800" },
    "oferta": { label: "🔥 Oferta", color: "bg-red-100 text-red-800" },
    "destaque": { label: "🎯 Destaque", color: "bg-indigo-100 text-indigo-800" }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      let url = `${API}/products`;
      const params = new URLSearchParams();
      
      if (filters.category) {
        params.append('category', filters.category);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      let response = await axios.get(url);
      let filteredProducts = response.data;
      
      // Filter by badge on frontend if needed
      if (filters.badge) {
        filteredProducts = filteredProducts.filter(p => 
          p.badges && p.badges.includes(filters.badge)
        );
      }
      
      setProducts(filteredProducts);
    } catch (error) {
      console.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <SEO 
        title="Totens de Monitoramento - VigiLoc"
        description="Totem inteligente com câmeras 360° para segurança de ruas e bairros. Assinatura comunitária com alertas em tempo real."
        keywords="totem vigilância, câmera 360, segurança rua, monitoramento bairro"
      />
      
      {/* Custom Content Blocks from Page Builder */}
      <ContentBlockRenderer pageId="totens" />
      
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">Totens de Monitoramento Inteligente</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Proteja sua rua com tecnologia de ponta. Sistema colaborativo de vigilância 24h com câmeras 360°.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contato">Solicitar Vistoria Grátis</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition">
                <CardContent className="pt-8 pb-6">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Nossos Produtos</h2>
            
            {/* New Visual Filter */}
            <ProductFilter 
              onFilterChange={setFilters}
              activeFilters={filters}
            />

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Carregando produtos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Nenhum produto disponível no momento.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-xl transition">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-64 object-cover rounded-t-lg"
                        />
                        {product.badges && product.badges.length > 0 && (
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {product.badges.map((badge) => (
                              <Badge 
                                key={badge} 
                                className={badgeConfig[badge]?.color || "bg-gray-100"}
                              >
                                {badgeConfig[badge]?.label || badge}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-blue-600">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <Button asChild>
                            <Link to={`/produto/${product.id}`}>Ver Detalhes</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Interessado em um Totem para sua Rua?</h2>
            <p className="text-xl mb-8">Entre em contato para uma vistoria gratuita e saiba mais sobre nossos planos.</p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contato">Solicitar Vistoria</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Totens;
