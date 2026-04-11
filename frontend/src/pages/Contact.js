import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, MessageCircle, Facebook, Instagram, Youtube, Linkedin, Globe } from "lucide-react";
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
  const [contactSettings, setContactSettings] = useState(null);
  const [hasCustomContent, setHasCustomContent] = useState(false);

  useEffect(() => {
    fetchContactSettings();
    checkCustomContent();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const response = await axios.get(`${API}/contact-page-settings`);
      setContactSettings(response.data);
    } catch (error) {
      console.error("Error fetching contact settings:", error);
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
      toast.success(contactSettings?.form_success_message || "Mensagem enviada com sucesso!");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const number = contactSettings?.whatsapp_number || '5511999999999';
    const message = encodeURIComponent(contactSettings?.whatsapp_message || 'Olá! Gostaria de mais informações.');
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  // Format address
  const getFullAddress = () => {
    if (!contactSettings) return "Av. Paulista, 1000 - São Paulo, SP";
    const parts = [
      contactSettings.address_street,
      contactSettings.address_neighborhood,
      contactSettings.address_city,
      contactSettings.address_state,
      contactSettings.address_zip
    ].filter(Boolean);
    return parts.join(", ") || "Endereço não configurado";
  };

  return (
    <div className="contact-page" data-testid="contact-page">
      {/* Hero Section */}
      {!hasCustomContent && (
        <div 
          className="relative py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700"
          style={{
            backgroundImage: contactSettings?.hero_background_image ? `url(${contactSettings.hero_background_image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {contactSettings?.hero_background_image && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {contactSettings?.hero_title || "Entre em Contato"}
            </h1>
            <p className="text-xl opacity-90">
              {contactSettings?.hero_subtitle || "Estamos aqui para ajudar você"}
            </p>
          </div>
        </div>
      )}

      {/* Custom Content Blocks from Page Builder */}
      <ContentBlockRenderer pageId="contato" />
      
      {/* Main Content */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            {(contactSettings?.show_contact_form !== false) && (
              <Card data-testid="contact-form-card">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {contactSettings?.form_title || "Envie sua Mensagem"}
                  </CardTitle>
                  {contactSettings?.form_subtitle && (
                    <p className="text-gray-600">{contactSettings.form_subtitle}</p>
                  )}
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
            )}

            {/* Contact Info */}
            <div className="space-y-6">
              <Card data-testid="contact-info-card">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Address */}
                    <div className="flex items-start" data-testid="address-info">
                      <MapPin className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Endereço</h3>
                        <p className="text-gray-600">{getFullAddress()}</p>
                      </div>
                    </div>
                    
                    {/* Phone */}
                    <div className="flex items-start" data-testid="phone-info">
                      <Phone className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Telefone</h3>
                        <p className="text-gray-600">
                          {contactSettings?.phone || "(11) 9999-9999"}
                          {contactSettings?.phone_secondary && (
                            <><br />{contactSettings.phone_secondary}</>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="flex items-start" data-testid="email-info">
                      <Mail className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <p className="text-gray-600">
                          {contactSettings?.email || "contato@vigiloc.com.br"}
                          {contactSettings?.email_secondary && (
                            <><br />{contactSettings.email_secondary}</>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Working Hours */}
                    <div className="flex items-start" data-testid="hours-info">
                      <Clock className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Horário de Atendimento</h3>
                        <p className="text-gray-600">
                          {contactSettings?.working_hours_weekdays || "Segunda a Sexta: 8h às 18h"}<br />
                          {contactSettings?.working_hours_saturday || "Sábado: 9h às 13h"}<br />
                          {contactSettings?.working_hours_sunday && contactSettings.working_hours_sunday}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Card */}
              {(contactSettings?.show_whatsapp_button !== false) && (
                <Card className="bg-gradient-to-r from-green-600 to-green-500 text-white" data-testid="whatsapp-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageCircle className="w-8 h-8" />
                      <h3 className="text-xl font-semibold">Atendimento via WhatsApp</h3>
                    </div>
                    <p className="mb-4 opacity-90">Para um atendimento mais rápido, entre em contato pelo WhatsApp</p>
                    <Button
                      data-testid="whatsapp-contact-btn"
                      onClick={handleWhatsApp}
                      className="bg-white text-green-700 hover:bg-gray-100 w-full"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {contactSettings?.whatsapp_button_text || "Iniciar Conversa"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Social Media Links */}
              {(contactSettings?.facebook_url || contactSettings?.instagram_url || contactSettings?.youtube_url || contactSettings?.linkedin_url) && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Siga-nos nas Redes Sociais</h3>
                    <div className="flex gap-4">
                      {contactSettings?.facebook_url && (
                        <a href={contactSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                          <Facebook className="w-8 h-8" />
                        </a>
                      )}
                      {contactSettings?.instagram_url && (
                        <a href={contactSettings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                          <Instagram className="w-8 h-8" />
                        </a>
                      )}
                      {contactSettings?.youtube_url && (
                        <a href={contactSettings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700">
                          <Youtube className="w-8 h-8" />
                        </a>
                      )}
                      {contactSettings?.linkedin_url && (
                        <a href={contactSettings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
                          <Linkedin className="w-8 h-8" />
                        </a>
                      )}
                      {contactSettings?.website_url && (
                        <a href={contactSettings.website_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-700">
                          <Globe className="w-8 h-8" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Google Maps */}
          {contactSettings?.show_map && contactSettings?.google_maps_embed && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Nossa Localização</h2>
              <div 
                className="rounded-lg overflow-hidden shadow-lg"
                dangerouslySetInnerHTML={{ __html: contactSettings.google_maps_embed }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
