import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Eye, Palette } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const ThemeCustomizer = () => {
  const [theme, setTheme] = useState({
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    accent_color: "#F59E0B",
    font_heading: "Inter",
    font_body: "Inter"
  });

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const response = await axios.get(`${API}/theme-settings`);
      setTheme(response.data);
    } catch (error) {
      console.error("Erro ao carregar tema");
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/admin/theme-settings`, theme);
      toast.success("Tema atualizado! Recarregue a página para ver as mudanças.");
    } catch (error) {
      toast.error("Erro ao salvar tema");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Theme Customizer</h1>
        <p className="text-gray-600">Personalize as cores e tipografia do seu site</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Cores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cor Primária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.primary_color}
                    onChange={(e) => setTheme({...theme, primary_color: e.target.value})}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={theme.primary_color}
                    onChange={(e) => setTheme({...theme, primary_color: e.target.value})}
                    placeholder="#3B82F6"
                  />
                </div>
                <div className="mt-2 h-12 rounded" style={{backgroundColor: theme.primary_color}} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor Secundária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.secondary_color}
                    onChange={(e) => setTheme({...theme, secondary_color: e.target.value})}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={theme.secondary_color}
                    onChange={(e) => setTheme({...theme, secondary_color: e.target.value})}
                    placeholder="#1E40AF"
                  />
                </div>
                <div className="mt-2 h-12 rounded" style={{backgroundColor: theme.secondary_color}} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor de Destaque</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.accent_color}
                    onChange={(e) => setTheme({...theme, accent_color: e.target.value})}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <Input
                    value={theme.accent_color}
                    onChange={(e) => setTheme({...theme, accent_color: e.target.value})}
                    placeholder="#F59E0B"
                  />
                </div>
                <div className="mt-2 h-12 rounded" style={{backgroundColor: theme.accent_color}} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipografia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fonte para Títulos</label>
                <select
                  className="w-full p-2 border rounded"
                  value={theme.font_heading}
                  onChange={(e) => setTheme({...theme, font_heading: e.target.value})}
                >
                  <option value="Inter">Inter</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fonte para Corpo</label>
                <select
                  className="w-full p-2 border rounded"
                  value={theme.font_body}
                  onChange={(e) => setTheme({...theme, font_body: e.target.value})}
                >
                  <option value="Inter">Inter</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Salvar Tema
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
                <div className="p-4 rounded" style={{backgroundColor: theme.primary_color}}>
                  <p className="text-white font-semibold" style={{fontFamily: theme.font_heading}}>
                    Botão Primário
                  </p>
                </div>
                <div className="p-4 rounded" style={{backgroundColor: theme.secondary_color}}>
                  <p className="text-white font-semibold" style={{fontFamily: theme.font_heading}}>
                    Botão Secundário
                  </p>
                </div>
                <div className="p-4 rounded" style={{backgroundColor: theme.accent_color}}>
                  <p className="text-white font-semibold" style={{fontFamily: theme.font_heading}}>
                    Botão de Destaque
                  </p>
                </div>
                <div className="p-4 border rounded">
                  <h3 className="text-xl font-bold mb-2" style={{fontFamily: theme.font_heading}}>
                    Título de Exemplo
                  </h3>
                  <p className="text-gray-600" style={{fontFamily: theme.font_body}}>
                    Este é um texto de exemplo usando a fonte do corpo. Veja como fica no seu site.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
