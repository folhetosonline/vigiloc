import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import { 
  Phone, Mail, MapPin, Clock, MessageCircle, Save, 
  Facebook, Instagram, Youtube, Linkedin, Globe, Eye
} from "lucide-react";

const ContactPageManager = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contactSettings, setContactSettings] = useState({
    // Hero Section
    hero_title: "Entre em Contato",
    hero_subtitle: "Estamos prontos para ajudar você",
    hero_background_image: "",
    
    // Contact Info
    phone: "",
    phone_secondary: "",
    email: "",
    email_secondary: "",
    
    // WhatsApp
    whatsapp_number: "",
    whatsapp_message: "Olá! Gostaria de mais informações sobre os serviços da VigiLoc.",
    whatsapp_button_text: "Falar pelo WhatsApp",
    show_whatsapp_button: true,
    
    // Address
    address_street: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "Brasil",
    
    // Working Hours
    working_hours_weekdays: "Segunda a Sexta: 08:00 - 18:00",
    working_hours_saturday: "Sábado: 08:00 - 12:00",
    working_hours_sunday: "Domingo: Fechado",
    
    // Google Maps
    google_maps_embed: "",
    show_map: true,
    
    // Social Media
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    linkedin_url: "",
    website_url: "",
    
    // Form Settings
    form_title: "Envie sua Mensagem",
    form_subtitle: "Preencha o formulário abaixo e entraremos em contato",
    form_success_message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
    show_contact_form: true,
    required_fields: ["name", "email", "message"],
    
    // Additional Sections
    show_faq_section: false,
    show_team_section: false
  });

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/contact-page-settings`);
      if (response.data) {
        setContactSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Error fetching contact settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/contact-page-settings`, contactSettings);
      toast.success("Configurações da página de contato salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setContactSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    window.open("/contato", "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Página de Contato</h1>
          <p className="text-gray-600">Configure os campos e informações da página de contato</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="social">Redes Sociais</TabsTrigger>
          <TabsTrigger value="form">Formulário</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Seção Hero</CardTitle>
              <CardDescription>Configure o título e imagem de fundo da página</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título Principal</Label>
                  <Input
                    value={contactSettings.hero_title}
                    onChange={(e) => handleChange("hero_title", e.target.value)}
                    placeholder="Entre em Contato"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    value={contactSettings.hero_subtitle}
                    onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                    placeholder="Estamos prontos para ajudar você"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL da Imagem de Fundo</Label>
                <Input
                  value={contactSettings.hero_background_image}
                  onChange={(e) => handleChange("hero_background_image", e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              {contactSettings.hero_background_image && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <img 
                    src={contactSettings.hero_background_image} 
                    alt="Hero background" 
                    className="mt-2 w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Informações de Contato
              </CardTitle>
              <CardDescription>Telefones, email e WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phones */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Telefone Principal
                  </Label>
                  <Input
                    value={contactSettings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone Secundário</Label>
                  <Input
                    value={contactSettings.phone_secondary}
                    onChange={(e) => handleChange("phone_secondary", e.target.value)}
                    placeholder="(11) 3333-3333"
                  />
                </div>
              </div>

              {/* Emails */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email Principal
                  </Label>
                  <Input
                    type="email"
                    value={contactSettings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Secundário</Label>
                  <Input
                    type="email"
                    value={contactSettings.email_secondary}
                    onChange={(e) => handleChange("email_secondary", e.target.value)}
                    placeholder="suporte@empresa.com"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-600">
                  <MessageCircle className="w-5 h-5" /> Configurações do WhatsApp
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número do WhatsApp (com DDD)</Label>
                    <Input
                      value={contactSettings.whatsapp_number}
                      onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                      placeholder="5511999999999"
                    />
                    <p className="text-xs text-gray-500">Formato: 55 + DDD + número (sem espaços ou traços)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={contactSettings.whatsapp_button_text}
                      onChange={(e) => handleChange("whatsapp_button_text", e.target.value)}
                      placeholder="Falar pelo WhatsApp"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Mensagem Padrão do WhatsApp</Label>
                  <Textarea
                    value={contactSettings.whatsapp_message}
                    onChange={(e) => handleChange("whatsapp_message", e.target.value)}
                    placeholder="Olá! Gostaria de mais informações..."
                    rows={2}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Label>Mostrar Botão do WhatsApp</Label>
                  <Switch
                    checked={contactSettings.show_whatsapp_button}
                    onCheckedChange={(checked) => handleChange("show_whatsapp_button", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </CardTitle>
              <CardDescription>Localização física da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rua / Avenida</Label>
                <Input
                  value={contactSettings.address_street}
                  onChange={(e) => handleChange("address_street", e.target.value)}
                  placeholder="Av. Paulista, 1000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={contactSettings.address_neighborhood}
                    onChange={(e) => handleChange("address_neighborhood", e.target.value)}
                    placeholder="Bela Vista"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={contactSettings.address_zip}
                    onChange={(e) => handleChange("address_zip", e.target.value)}
                    placeholder="01310-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={contactSettings.address_city}
                    onChange={(e) => handleChange("address_city", e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={contactSettings.address_state}
                    onChange={(e) => handleChange("address_state", e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Google Maps */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-4">Google Maps</h3>
                <div className="space-y-2">
                  <Label>Código Embed do Google Maps</Label>
                  <Textarea
                    value={contactSettings.google_maps_embed}
                    onChange={(e) => handleChange("google_maps_embed", e.target.value)}
                    placeholder='<iframe src="https://www.google.com/maps/embed?..." ...'
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Cole o código iframe do Google Maps aqui</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Label>Exibir Mapa na Página</Label>
                  <Switch
                    checked={contactSettings.show_map}
                    onCheckedChange={(checked) => handleChange("show_map", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>Configure os horários de atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Segunda a Sexta</Label>
                <Input
                  value={contactSettings.working_hours_weekdays}
                  onChange={(e) => handleChange("working_hours_weekdays", e.target.value)}
                  placeholder="Segunda a Sexta: 08:00 - 18:00"
                />
              </div>
              <div className="space-y-2">
                <Label>Sábado</Label>
                <Input
                  value={contactSettings.working_hours_saturday}
                  onChange={(e) => handleChange("working_hours_saturday", e.target.value)}
                  placeholder="Sábado: 08:00 - 12:00"
                />
              </div>
              <div className="space-y-2">
                <Label>Domingo / Feriados</Label>
                <Input
                  value={contactSettings.working_hours_sunday}
                  onChange={(e) => handleChange("working_hours_sunday", e.target.value)}
                  placeholder="Domingo: Fechado"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Redes Sociais
              </CardTitle>
              <CardDescription>Links para as redes sociais da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                  </Label>
                  <Input
                    value={contactSettings.facebook_url}
                    onChange={(e) => handleChange("facebook_url", e.target.value)}
                    placeholder="https://facebook.com/suaempresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" /> Instagram
                  </Label>
                  <Input
                    value={contactSettings.instagram_url}
                    onChange={(e) => handleChange("instagram_url", e.target.value)}
                    placeholder="https://instagram.com/suaempresa"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" /> YouTube
                  </Label>
                  <Input
                    value={contactSettings.youtube_url}
                    onChange={(e) => handleChange("youtube_url", e.target.value)}
                    placeholder="https://youtube.com/@suaempresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn
                  </Label>
                  <Input
                    value={contactSettings.linkedin_url}
                    onChange={(e) => handleChange("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/company/suaempresa"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Website
                </Label>
                <Input
                  value={contactSettings.website_url}
                  onChange={(e) => handleChange("website_url", e.target.value)}
                  placeholder="https://www.suaempresa.com.br"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Settings */}
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Formulário</CardTitle>
              <CardDescription>Personalize o formulário de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título do Formulário</Label>
                  <Input
                    value={contactSettings.form_title}
                    onChange={(e) => handleChange("form_title", e.target.value)}
                    placeholder="Envie sua Mensagem"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    value={contactSettings.form_subtitle}
                    onChange={(e) => handleChange("form_subtitle", e.target.value)}
                    placeholder="Preencha o formulário..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem de Sucesso</Label>
                <Textarea
                  value={contactSettings.form_success_message}
                  onChange={(e) => handleChange("form_success_message", e.target.value)}
                  placeholder="Mensagem enviada com sucesso!"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Exibir Formulário de Contato</Label>
                <Switch
                  checked={contactSettings.show_contact_form}
                  onCheckedChange={(checked) => handleChange("show_contact_form", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactPageManager;
