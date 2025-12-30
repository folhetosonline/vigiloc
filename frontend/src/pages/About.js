import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Users, Target, Award, MessageCircle } from "lucide-react";
import SEO from "@/components/SEO";
import ContentBlockRenderer from "@/components/ContentBlockRenderer";

const About = () => {
  const [siteSettings, setSiteSettings] = useState({});
  const [hasCustomContent, setHasCustomContent] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, blocksRes] = await Promise.all([
        axios.get(`${API}/site-settings`),
        axios.get(`${API}/content-blocks/sobre`).catch(() => ({ data: [] }))
      ]);
      setSiteSettings(settingsRes.data);
      setHasCustomContent(blocksRes.data && blocksRes.data.length > 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const whatsappNumber = siteSettings?.whatsapp_number || '5511999999999';
  
  const handleWhatsApp = () => {
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre a VigiLoc.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const values = [
    {
      icon: <Shield className="w-10 h-10 text-blue-600" />,
      title: "Segurança",
      description: "Compromisso com a proteção do seu patrimônio e família"
    },
    {
      icon: <Users className="w-10 h-10 text-blue-600" />,
      title: "Atendimento",
      description: "Suporte técnico especializado 24 horas por dia"
    },
    {
      icon: <Target className="w-10 h-10 text-blue-600" />,
      title: "Inovação",
      description: "Tecnologia de ponta para soluções inteligentes"
    },
    {
      icon: <Award className="w-10 h-10 text-blue-600" />,
      title: "Qualidade",
      description: "Equipamentos certificados com garantia estendida"
    }
  ];

  return (
    <div className="about-page">
      <SEO 
        title="Sobre - VigiLoc"
        description="Conheça a VigiLoc, líder em soluções de automação e segurança eletrônica para condomínios e empresas."
        keywords="sobre vigiloc, empresa segurança, automação comercial"
      />

      {/* Custom Content Blocks from Page Builder */}
      <ContentBlockRenderer pageId="sobre" />

      {/* Default Content - shown if no custom blocks */}
      {!hasCustomContent && (
        <>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-5xl font-bold mb-6">Sobre a VigiLoc</h1>
              <p className="text-xl mb-8 max-w-3xl mx-auto">
                Há mais de 10 anos transformando espaços em ambientes inteligentes e seguros
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-gray-900">Nossa História</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    A VigiLoc nasceu da visão de tornar a segurança eletrônica acessível e 
                    eficiente para todos. Desde nossa fundação, nos dedicamos a desenvolver 
                    soluções inovadoras que combinam tecnologia de ponta com facilidade de uso.
                  </p>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Com uma equipe de profissionais altamente qualificados, oferecemos desde 
                    portaria autônoma até sistemas completos de automação comercial, sempre 
                    focados na excelência do atendimento e na satisfação dos nossos clientes.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Hoje, atendemos mais de 500 clientes em todo o Brasil, incluindo 
                    condomínios residenciais, empresas e comércios de todos os portes.
                  </p>
                </div>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600"
                    alt="Equipe VigiLoc"
                    className="rounded-lg shadow-xl"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="text-4xl font-bold">+500</div>
                    <div className="text-sm">Clientes Satisfeitos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Nossos Valores</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <Card key={index} className="text-center hover:shadow-lg transition">
                    <CardContent className="pt-8 pb-6">
                      <div className="flex justify-center mb-4">{value.icon}</div>
                      <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-blue-600 text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">Pronto para conhecer nossas soluções?</h2>
              <p className="text-xl mb-8">Entre em contato e descubra como podemos ajudar você.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" onClick={handleWhatsApp}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Falar pelo WhatsApp
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
                  <Link to="/contato">Outras formas de contato</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* If there are custom blocks, show CTA section after */}
      {hasCustomContent && (
        <div className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Pronto para conhecer nossas soluções?</h2>
            <p className="text-xl mb-8">Entre em contato e descubra como podemos ajudar você.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={handleWhatsApp}>
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar pelo WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
                <Link to="/contato">Outras formas de contato</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
