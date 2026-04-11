import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import { 
  Image as ImageIcon, 
  Save, 
  RefreshCw, 
  Loader2,
  Eye,
  Upload,
  Palette,
  Sparkles
} from "lucide-react";
import VigiLocLogo from "@/components/VigiLocLogo";

const LogoManager = () => {
  const [settings, setSettings] = useState({
    logo_url: "",
    logo_url_dark: "",
    use_animated_logo: true,
    site_name: "VigiLoc"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewVariant, setPreviewVariant] = useState("header");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSettings({
        logo_url: response.data.logo_url || "",
        logo_url_dark: response.data.logo_url_dark || "",
        use_animated_logo: response.data.use_animated_logo ?? true,
        site_name: response.data.site_name || "VigiLoc"
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/site-settings`, settings);
      toast.success("Configurações de logo salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎨 Gerenciador de Logo</h1>
          <p className="text-gray-600 mt-1">
            Configure o logo animado ou faça upload de um logo personalizado
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview Card */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview do Logo
            </CardTitle>
            <CardDescription>
              Veja como o logo aparecerá no site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview Tabs */}
            <Tabs defaultValue="header" onValueChange={setPreviewVariant}>
              <TabsList className="w-full">
                <TabsTrigger value="header" className="flex-1">Header (Fundo Claro)</TabsTrigger>
                <TabsTrigger value="footer" className="flex-1">Footer (Fundo Escuro)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="header">
                <div className="bg-white border rounded-xl p-8 flex items-center justify-center min-h-[200px]">
                  {settings.use_animated_logo || !settings.logo_url ? (
                    <VigiLocLogo size={80} variant="header" showText={true} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <img 
                        src={settings.logo_url} 
                        alt="Logo" 
                        className="h-20 w-auto object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <span className="text-3xl font-bold text-gray-900">{settings.site_name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Navbar com fundo branco - Logo usa cores do footer (gray-900)
                </p>
              </TabsContent>
              
              <TabsContent value="footer">
                <div className="bg-gray-900 rounded-xl p-8 flex items-center justify-center min-h-[200px]">
                  {settings.use_animated_logo || !settings.logo_url_dark ? (
                    <VigiLocLogo size={80} variant="footer" showText={true} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <img 
                        src={settings.logo_url_dark} 
                        alt="Logo" 
                        className="h-20 w-auto object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <span className="text-3xl font-bold text-white">{settings.site_name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Footer com fundo escuro - Logo usa cores vibrantes
                </p>
              </TabsContent>
            </Tabs>

            {/* Animation Demo */}
            {settings.use_animated_logo && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Animação do Olho</span>
                </div>
                <p className="text-sm text-blue-700">
                  O olho pisca automaticamente a cada 3 segundos. A íris é vermelha para destacar a vigilância.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Animated Logo Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <Label htmlFor="animated" className="font-medium">Usar Logo Animado</Label>
                  <p className="text-xs text-gray-500">Logo com olho piscando e íris vermelha</p>
                </div>
              </div>
              <Switch 
                id="animated"
                checked={settings.use_animated_logo}
                onCheckedChange={(checked) => setSettings({...settings, use_animated_logo: checked})}
              />
            </div>

            {/* Custom Logo URL */}
            {!settings.use_animated_logo && (
              <>
                <div className="space-y-2">
                  <Label>Logo para Fundo Claro (Header)</Label>
                  <Input
                    value={settings.logo_url}
                    onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                    placeholder="https://exemplo.com/logo-claro.png"
                  />
                  <p className="text-xs text-gray-500">
                    Use uma imagem com cores escuras para fundo branco
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Logo para Fundo Escuro (Footer)</Label>
                  <Input
                    value={settings.logo_url_dark}
                    onChange={(e) => setSettings({...settings, logo_url_dark: e.target.value})}
                    placeholder="https://exemplo.com/logo-escuro.png"
                  />
                  <p className="text-xs text-gray-500">
                    Use uma imagem com cores claras para fundo escuro
                  </p>
                </div>
              </>
            )}

            {/* Site Name */}
            <div className="space-y-2">
              <Label>Nome do Site</Label>
              <Input
                value={settings.site_name}
                onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                placeholder="VigiLoc"
              />
            </div>
          </CardContent>
        </Card>

        {/* Color Reference Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Referência de Cores
            </CardTitle>
            <CardDescription>
              Cores usadas no logo animado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-900" />
                  <div>
                    <p className="font-medium text-sm">Header Logo</p>
                    <p className="text-xs text-gray-500">gray-900 (#111827)</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">Fundo claro</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Footer Logo</p>
                    <p className="text-xs text-gray-500">blue-500 (#3b82f6)</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">Fundo escuro</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-red-600" />
                  <div>
                    <p className="font-medium text-sm">Íris do Olho</p>
                    <p className="text-xs text-gray-500">red-600 (#dc2626)</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">Vigilância</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogoManager;
