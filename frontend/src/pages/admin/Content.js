import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const Content = () => {
  const [content, setContent] = useState(null);
  const [formData, setFormData] = useState({
    logo_url: "",
    site_name: "",
    hero_title: "",
    hero_subtitle: "",
    about_text: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    whatsapp_number: "",
    social_facebook: "",
    social_instagram: "",
    social_linkedin: "",
    footer_text: ""
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API}/site-content`);
      setContent(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error("Erro ao carregar conteúdo");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, logo_url: response.data.url });
      toast.success("Logo enviado com sucesso");
    } catch (error) {
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${API}/admin/site-content`, formData);
      toast.success("Conteúdo atualizado com sucesso");
      fetchContent();
    } catch (error) {
      toast.error("Erro ao atualizar conteúdo");
    }
  };

  if (!content) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gerenciar Conteúdo do Site</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Logo</label>
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {formData.logo_url && (
                  <img src={formData.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nome do Site</label>
              <Input
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título Hero</label>
              <Input
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subtítulo Hero</label>
              <Textarea
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Texto Sobre</label>
              <Textarea
                rows={4}
                value={formData.about_text}
                onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Endereço</label>
              <Textarea
                value={formData.contact_address}
                onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp (com código do país)</label>
              <Input
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="5511999999999"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <Input
                value={formData.social_facebook}
                onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <Input
                value={formData.social_instagram}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn</label>
              <Input
                value={formData.social_linkedin}
                onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rodapé</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-2">Texto do Rodapé</label>
              <Textarea
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg">
          Salvar Alterações
        </Button>
      </form>
    </div>
  );
};

export default Content;