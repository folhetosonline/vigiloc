import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Save, Truck, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import { API } from "@/App";

const ShippingIntegration = () => {
  const [settings, setSettings] = useState({
    melhor_envio_enabled: false,
    melhor_envio_token: "",
    melhor_envio_sandbox: false,
    origin_cep: ""
  });

  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/shipping-settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching shipping settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/admin/shipping-settings`, settings);
      toast.success("Configurações de frete salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const maskToken = (token) => {
    if (!token) return "";
    if (showToken) return token;
    return "•".repeat(Math.min(token.length, 40));
  };

  const formatCep = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integração de Frete</h2>
          <p className="text-gray-600">Configure o cálculo automático de frete com Melhor Envio</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Melhor Envio Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-green-500" />
              <div>
                <CardTitle>Melhor Envio</CardTitle>
                <p className="text-sm text-gray-600">Cotação automática de frete por CEP</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="melhor_envio_enabled">Ativo</Label>
              <Switch
                id="melhor_envio_enabled"
                checked={settings.melhor_envio_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, melhor_envio_enabled: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Como obter seu token:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Crie uma conta gratuita em <a href="https://melhorenvio.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">melhorenvio.com.br <ExternalLink className="w-3 h-3" /></a></li>
                  <li>Acesse: Configurações → Tokens para Desenvolvedores</li>
                  <li>Clique em "Criar novo token"</li>
                  <li>Copie o token e cole abaixo</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="melhor_envio_sandbox">Modo Sandbox (Teste)</Label>
            <Switch
              id="melhor_envio_sandbox"
              checked={settings.melhor_envio_sandbox}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, melhor_envio_sandbox: checked }))
              }
            />
            {settings.melhor_envio_sandbox && (
              <span className="text-xs text-orange-600 font-medium">
                ⚠️ Modo de teste ativo
              </span>
            )}
          </div>

          <div>
            <Label>Token da API Melhor Envio</Label>
            <div className="flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={maskToken(settings.melhor_envio_token)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  melhor_envio_token: e.target.value 
                }))}
                placeholder="Cole seu token aqui..."
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              O token será armazenado de forma segura
            </p>
          </div>

          <div>
            <Label>CEP de Origem</Label>
            <Input
              value={settings.origin_cep}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                origin_cep: formatCep(e.target.value)
              }))}
              placeholder="01310-100"
              maxLength={9}
            />
            <p className="text-xs text-gray-500 mt-1">
              CEP do local de onde os produtos serão enviados
            </p>
          </div>

          {settings.melhor_envio_enabled && settings.melhor_envio_token && (
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✓ Integração configurada!</strong> O checkout agora calculará fretes automaticamente via Melhor Envio.
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Recursos da Integração:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Cálculo automático de frete por CEP
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Múltiplas transportadoras (Correios PAC/SEDEX, Jadlog, Azul Cargo, etc.)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Preços reais em tempo real
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Prazo de entrega estimado
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default ShippingIntegration;
