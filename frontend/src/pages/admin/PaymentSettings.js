import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Save, CreditCard } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    // Mercado Pago
    mercadopago_enabled: false,
    mercadopago_public_key: "",
    mercadopago_access_token: "",
    mercadopago_webhook_secret: "",
    mercadopago_sandbox_mode: true,
    
    // Stripe
    stripe_enabled: false,
    stripe_public_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    stripe_test_mode: true,
    
    // PagSeguro
    pagseguro_enabled: false,
    pagseguro_email: "",
    pagseguro_token_production: "",
    pagseguro_token_sandbox: "",
    pagseguro_sandbox_mode: true,
  });

  const [showKeys, setShowKeys] = useState({
    mercadopago_public_key: false,
    mercadopago_access_token: false,
    mercadopago_webhook_secret: false,
    stripe_public_key: false,
    stripe_secret_key: false,
    stripe_webhook_secret: false,
    pagseguro_token_production: false,
    pagseguro_token_sandbox: false,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/payment-settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/admin/payment-settings`, settings);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value, show) => {
    if (!value) return "";
    if (show) return value;
    return "•".repeat(Math.min(value.length, 20));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meios de Pagamento</h2>
          <p className="text-gray-600">Configure as chaves API dos meios de pagamento</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Mercado Pago */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-500" />
              <CardTitle>Mercado Pago</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="mercadopago_enabled">Ativo</Label>
              <Switch
                id="mercadopago_enabled"
                checked={settings.mercadopago_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, mercadopago_enabled: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="mercadopago_sandbox_mode">Modo Sandbox (Teste)</Label>
            <Switch
              id="mercadopago_sandbox_mode"
              checked={settings.mercadopago_sandbox_mode}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, mercadopago_sandbox_mode: checked }))
              }
            />
          </div>

          <div>
            <Label>Public Key</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.mercadopago_public_key ? "text" : "password"}
                value={maskValue(settings.mercadopago_public_key, showKeys.mercadopago_public_key)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  mercadopago_public_key: e.target.value 
                }))}
                placeholder="APP_USR-..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('mercadopago_public_key')}
              >
                {showKeys.mercadopago_public_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Access Token</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.mercadopago_access_token ? "text" : "password"}
                value={maskValue(settings.mercadopago_access_token, showKeys.mercadopago_access_token)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  mercadopago_access_token: e.target.value 
                }))}
                placeholder="APP_USR-..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('mercadopago_access_token')}
              >
                {showKeys.mercadopago_access_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Webhook Secret (Opcional)</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.mercadopago_webhook_secret ? "text" : "password"}
                value={maskValue(settings.mercadopago_webhook_secret, showKeys.mercadopago_webhook_secret)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  mercadopago_webhook_secret: e.target.value 
                }))}
                placeholder="webhook_secret_..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('mercadopago_webhook_secret')}
              >
                {showKeys.mercadopago_webhook_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-purple-500" />
              <CardTitle>Stripe</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="stripe_enabled">Ativo</Label>
              <Switch
                id="stripe_enabled"
                checked={settings.stripe_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, stripe_enabled: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="stripe_test_mode">Modo Teste</Label>
            <Switch
              id="stripe_test_mode"
              checked={settings.stripe_test_mode}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, stripe_test_mode: checked }))
              }
            />
          </div>

          <div>
            <Label>Publishable Key (Public Key)</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.stripe_public_key ? "text" : "password"}
                value={maskValue(settings.stripe_public_key, showKeys.stripe_public_key)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  stripe_public_key: e.target.value 
                }))}
                placeholder="pk_test_..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('stripe_public_key')}
              >
                {showKeys.stripe_public_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Secret Key</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.stripe_secret_key ? "text" : "password"}
                value={maskValue(settings.stripe_secret_key, showKeys.stripe_secret_key)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  stripe_secret_key: e.target.value 
                }))}
                placeholder="sk_test_..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('stripe_secret_key')}
              >
                {showKeys.stripe_secret_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Webhook Secret (Opcional)</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.stripe_webhook_secret ? "text" : "password"}
                value={maskValue(settings.stripe_webhook_secret, showKeys.stripe_webhook_secret)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  stripe_webhook_secret: e.target.value 
                }))}
                placeholder="whsec_..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('stripe_webhook_secret')}
              >
                {showKeys.stripe_webhook_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PagSeguro */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-green-500" />
              <CardTitle>PagSeguro</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="pagseguro_enabled">Ativo</Label>
              <Switch
                id="pagseguro_enabled"
                checked={settings.pagseguro_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, pagseguro_enabled: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="pagseguro_sandbox_mode">Modo Sandbox (Teste)</Label>
            <Switch
              id="pagseguro_sandbox_mode"
              checked={settings.pagseguro_sandbox_mode}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, pagseguro_sandbox_mode: checked }))
              }
            />
          </div>

          <div>
            <Label>Email da Conta PagSeguro</Label>
            <Input
              type="email"
              value={settings.pagseguro_email}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                pagseguro_email: e.target.value 
              }))}
              placeholder="vendedor@email.com"
            />
          </div>

          <div>
            <Label>Token de Produção</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.pagseguro_token_production ? "text" : "password"}
                value={maskValue(settings.pagseguro_token_production, showKeys.pagseguro_token_production)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  pagseguro_token_production: e.target.value 
                }))}
                placeholder="Token de produção..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('pagseguro_token_production')}
              >
                {showKeys.pagseguro_token_production ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Token Sandbox (Teste)</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys.pagseguro_token_sandbox ? "text" : "password"}
                value={maskValue(settings.pagseguro_token_sandbox, showKeys.pagseguro_token_sandbox)}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  pagseguro_token_sandbox: e.target.value 
                }))}
                placeholder="Token de sandbox..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleShowKey('pagseguro_token_sandbox')}
              >
                {showKeys.pagseguro_token_sandbox ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSettings;
