import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import ContentBlockRenderer from "@/components/ContentBlockRenderer";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState({});
  const [hasCustomContent, setHasCustomContent] = useState(false);

  useEffect(() => {
    fetchSiteSettings();
    checkCustomContent();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    }
  };

  const checkCustomContent = async () => {
    try {
      const response = await axios.get(`${API}/content-blocks/contato`);
      setHasCustomContent(response.data && response.data.length > 0);
    } catch (error) {
      setHasCustomContent(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Render custom content blocks if available
  return (
    <div className="contact-page" data-testid="contact-page">
      {/* Custom Content Blocks from Page Builder */}
      <ContentBlockRenderer pageId="contato" />
      
      {/* Default Contact Page Content */}
      <div className="py-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasCustomContent && (
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Entre em Contato</h1>
              <p className="text-lg text-gray-600">Estamos aqui para ajudar você com suas necessidades de segurança</p>
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card data-testid="contact-form-card">
            <CardHeader>
              <CardTitle className="text-2xl">Envie sua Mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <Input
                    data-testid="name-input"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <Input
                    data-testid="email-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                  <Input
                    data-testid="phone-input"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem *</label>
                  <Textarea
                    data-testid="message-input"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Como podemos ajudá-lo?"
                  />
                </div>
                <Button
                  data-testid="submit-contact-form-btn"
                  type="submit"
                  className="w-full btn-primary"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Mensagem"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card data-testid="contact-info-card">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start" data-testid="address-info">
                    <MapPin className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                      <p className="text-gray-600">Av. Paulista, 1000<br />São Paulo, SP - Brasil</p>
                    </div>
                  </div>
                  <div className="flex items-start" data-testid="phone-info">
                    <Phone className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Telefone</h3>
                      <p className="text-gray-600">(11) 9999-9999</p>
                    </div>
                  </div>
                  <div className="flex items-start" data-testid="email-info">
                    <Mail className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                      <p className="text-gray-600">contato@securetech.com.br</p>
                    </div>
                  </div>
                  <div className="flex items-start" data-testid="hours-info">
                    <Clock className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Horário de Atendimento</h3>
                      <p className="text-gray-600">
                        Segunda a Sexta: 8h às 18h<br />
                        Sábado: 9h às 13h
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-700 to-blue-500 text-white" data-testid="whatsapp-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">Atendimento via WhatsApp</h3>
                <p className="mb-4 opacity-90">Para um atendimento mais rápido, entre em contato pelo WhatsApp</p>
                <Button
                  data-testid="whatsapp-contact-btn"
                  onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
                  className="bg-white text-blue-700 hover:bg-gray-100 w-full"
                >
                  Iniciar Conversa
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Contact;