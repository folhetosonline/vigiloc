import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Eye, Menu } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const NavbarCustomizer = () => {
  const [settings, setSettings] = useState({
    background_color: "#FFFFFF",
    text_color: "#1F2937",
    hover_color: "#3B82F6",
    font_family: "Inter",
    font_size: "base",
    height: "16",
    logo_size: "10",
    show_logo: true,
    show_site_name: true,
    sticky: true,
    shadow: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/navbar-settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Erro ao carregar configurações");
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/admin/navbar-settings`, settings);
      toast.success("Configurações salvas! Recarregue a página para ver as mudanças.");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Personalizar Navbar</h1>
        <p className="text-gray-600">Customize a aparência do menu de navegação</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Menu className="mr-2 h-5 w-5" />
                Cores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cor de Fundo</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => setSettings({...settings, background_color: e.target.value})}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.background_color}
                    onChange={(e) => setSettings({...settings, background_color: e.target.value})}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor do Texto</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.text_color}
                    onChange={(e) => setSettings({...settings, text_color: e.target.value})}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.text_color}
                    onChange={(e) => setSettings({...settings, text_color: e.target.value})}
                    placeholder="#1F2937"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor ao Passar o Mouse</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.hover_color}
                    onChange={(e) => setSettings({...settings, hover_color: e.target.value})}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings.hover_color}
                    onChange={(e) => setSettings({...settings, hover_color: e.target.value})}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipografia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fonte</label>
                <Select
                  value={settings.font_family}
                  onValueChange={(value) => setSettings({...settings, font_family: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tamanho do Texto</label>
                <Select
                  value={settings.font_size}
                  onValueChange={(value) => setSettings({...settings, font_size: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Pequeno</SelectItem>
                    <SelectItem value="base">Médio</SelectItem>
                    <SelectItem value="lg">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dimensões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Altura da Navbar (px)</label>
                <Input
                  type="number"
                  value={settings.height}
                  onChange={(e) => setSettings({...settings, height: e.target.value})}
                  min="12"
                  max="24"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">12-24 (48px-96px)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tamanho do Logo</label>
                <Input
                  type="number"
                  value={settings.logo_size}
                  onChange={(e) => setSettings({...settings, logo_size: e.target.value})}
                  min="6"
                  max="16"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">6-16 (24px-64px)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.show_logo}
                  onChange={(e) => setSettings({...settings, show_logo: e.target.checked})}
                  id="show_logo"
                />
                <label htmlFor="show_logo">Mostrar Logo</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.show_site_name}
                  onChange={(e) => setSettings({...settings, show_site_name: e.target.checked})}
                  id="show_site_name"
                />
                <label htmlFor="show_site_name">Mostrar Nome do Site</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.sticky}
                  onChange={(e) => setSettings({...settings, sticky: e.target.checked})}
                  id="sticky"
                />
                <label htmlFor="sticky">Navbar Fixa (Sticky)</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.shadow}
                  onChange={(e) => setSettings({...settings, shadow: e.target.checked})}
                  id="shadow"
                />
                <label htmlFor="shadow">Sombra</label>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Salvar Configurações
          </Button>
        </div>

        {/* Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="rounded overflow-hidden border"
                  style={{
                    backgroundColor: settings.background_color,
                    color: settings.text_color,
                    fontFamily: settings.font_family,
                    height: `${parseInt(settings.height) * 4}px`,
                    boxShadow: settings.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <div className="flex items-center justify-between h-full px-6">
                    <div className="flex items-center gap-3">
                      {settings.show_logo && (
                        <div 
                          className="bg-blue-500 rounded"
                          style={{
                            width: `${parseInt(settings.logo_size) * 4}px`,
                            height: `${parseInt(settings.logo_size) * 4}px`
                          }}
                        />
                      )}
                      {settings.show_site_name && (
                        <span 
                          className="font-bold"
                          style={{fontSize: settings.font_size === 'sm' ? '14px' : settings.font_size === 'lg' ? '18px' : '16px'}}
                        >
                          VigiLoc
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <span 
                        className="cursor-pointer"
                        style={{
                          fontSize: settings.font_size === 'sm' ? '14px' : settings.font_size === 'lg' ? '18px' : '16px'
                        }}
                        onMouseEnter={(e) => e.target.style.color = settings.hover_color}
                        onMouseLeave={(e) => e.target.style.color = settings.text_color}
                      >
                        Home
                      </span>
                      <span 
                        className="cursor-pointer"
                        style={{
                          fontSize: settings.font_size === 'sm' ? '14px' : settings.font_size === 'lg' ? '18px' : '16px'
                        }}
                        onMouseEnter={(e) => e.target.style.color = settings.hover_color}
                        onMouseLeave={(e) => e.target.style.color = settings.text_color}
                      >
                        Produtos
                      </span>
                      <span 
                        className="cursor-pointer"
                        style={{
                          fontSize: settings.font_size === 'sm' ? '14px' : settings.font_size === 'lg' ? '18px' : '16px'
                        }}
                        onMouseEnter={(e) => e.target.style.color = settings.hover_color}
                        onMouseLeave={(e) => e.target.style.color = settings.text_color}
                      >
                        Contato
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Altura:</strong> {parseInt(settings.height) * 4}px</p>
                  <p><strong>Logo:</strong> {parseInt(settings.logo_size) * 4}px</p>
                  <p><strong>Fonte:</strong> {settings.font_family}</p>
                  <p><strong>Sticky:</strong> {settings.sticky ? "Sim" : "Não"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NavbarCustomizer;
