import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Code, TrendingUp, Facebook, ShoppingBag } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const TrackingManager = () => {
  const [settings, setSettings] = useState({
    gtm_id: "",
    gtm_enabled: false,
    ga4_measurement_id: "",
    ga4_enabled: false,
    ga4_ecommerce_enabled: true,
    meta_pixel_id: "",
    meta_pixel_enabled: false,
    amazon_tag_id: "",
    amazon_enabled: false,
    custom_head_scripts: "",
    custom_body_scripts: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/tracking-settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Erro ao carregar configurações");
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/admin/tracking-settings`, settings);
      toast.success("Configurações salvas! Recarregue o site para ativar.");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tracking & Analytics</h1>
        <p className="text-gray-600">Configure tags de rastreamento e analytics</p>
      </div>

      <Tabs defaultValue="gtm" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gtm">
            <Code className="w-4 h-4 mr-2" />
            Tag Manager
          </TabsTrigger>
          <TabsTrigger value="ga4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics 4
          </TabsTrigger>
          <TabsTrigger value="meta">
            <Facebook className="w-4 h-4 mr-2" />
            Meta Pixel
          </TabsTrigger>
          <TabsTrigger value="amazon">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Amazon
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Code className="w-4 h-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* Google Tag Manager */}
        <TabsContent value="gtm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Tag Manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.gtm_enabled}
                  onChange={(e) => setSettings({...settings, gtm_enabled: e.target.checked})}
                  id="gtm_enabled"
                />
                <label htmlFor="gtm_enabled" className="font-medium">Ativar Google Tag Manager</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Container ID</label>
                <Input
                  value={settings.gtm_id}
                  onChange={(e) => setSettings({...settings, gtm_id: e.target.value})}
                  placeholder="GTM-XXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">Encontre em: Google Tag Manager → Admin → Container ID</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">📘 Como configurar:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Acesse <a href="https://tagmanager.google.com" target="_blank" className="text-blue-600 underline">tagmanager.google.com</a></li>
                  <li>Crie uma conta e container</li>
                  <li>Copie o Container ID (GTM-XXXXXXX)</li>
                  <li>Cole acima e ative</li>
                  <li>Configure tags dentro do GTM</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Analytics 4 */}
        <TabsContent value="ga4" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics 4</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.ga4_enabled}
                  onChange={(e) => setSettings({...settings, ga4_enabled: e.target.checked})}
                  id="ga4_enabled"
                />
                <label htmlFor="ga4_enabled" className="font-medium">Ativar Google Analytics 4</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Measurement ID</label>
                <Input
                  value={settings.ga4_measurement_id}
                  onChange={(e) => setSettings({...settings, ga4_measurement_id: e.target.value})}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">Encontre em: Google Analytics → Admin → Data Streams</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.ga4_ecommerce_enabled}
                  onChange={(e) => setSettings({...settings, ga4_ecommerce_enabled: e.target.checked})}
                  id="ga4_ecommerce"
                />
                <label htmlFor="ga4_ecommerce" className="text-sm">Ativar rastreamento de E-commerce</label>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">🛒 E-commerce Tracking:</h4>
                <p className="text-sm mb-2">Quando ativado, rastreia automaticamente:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>view_item (visualização de produto)</li>
                  <li>add_to_cart (adicionar ao carrinho)</li>
                  <li>begin_checkout (iniciar checkout)</li>
                  <li>purchase (compra finalizada)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Pixel */}
        <TabsContent value="meta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Pixel (Facebook)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.meta_pixel_enabled}
                  onChange={(e) => setSettings({...settings, meta_pixel_enabled: e.target.checked})}
                  id="meta_enabled"
                />
                <label htmlFor="meta_enabled" className="font-medium">Ativar Meta Pixel</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Pixel ID</label>
                <Input
                  value={settings.meta_pixel_id}
                  onChange={(e) => setSettings({...settings, meta_pixel_id: e.target.value})}
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-500 mt-1">Encontre em: Meta Events Manager → Data Sources → Pixel</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">📊 Eventos rastreados:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>PageView (todas as páginas)</li>
                  <li>ViewContent (produto)</li>
                  <li>AddToCart (carrinho)</li>
                  <li>InitiateCheckout (checkout)</li>
                  <li>Purchase (compra)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amazon */}
        <TabsContent value="amazon" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Amazon Associates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.amazon_enabled}
                  onChange={(e) => setSettings({...settings, amazon_enabled: e.target.checked})}
                  id="amazon_enabled"
                />
                <label htmlFor="amazon_enabled" className="font-medium">Ativar Amazon Tag</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tag ID</label>
                <Input
                  value={settings.amazon_tag_id}
                  onChange={(e) => setSettings({...settings, amazon_tag_id: e.target.value})}
                  placeholder="seu-id-20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Scripts */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scripts Customizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scripts no &lt;head&gt;</label>
                <textarea
                  className="w-full p-3 border rounded min-h-[150px] font-mono text-xs"
                  value={settings.custom_head_scripts}
                  onChange={(e) => setSettings({...settings, custom_head_scripts: e.target.value})}
                  placeholder="<script>\n  // Seu código aqui\n</script>"
                />
                <p className="text-xs text-gray-500 mt-1">Será injetado no &lt;head&gt; de todas as páginas</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Scripts antes do &lt;/body&gt;</label>
                <textarea
                  className="w-full p-3 border rounded min-h-[150px] font-mono text-xs"
                  value={settings.custom_body_scripts}
                  onChange={(e) => setSettings({...settings, custom_body_scripts: e.target.value})}
                  placeholder="<script>\n  // Seu código aqui\n</script>"
                />
                <p className="text-xs text-gray-500 mt-1">Será injetado antes do &lt;/body&gt;</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button onClick={handleSave} className="w-full" size="lg">
          <Save className="mr-2 h-5 w-5" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  );
};

export default TrackingManager;