import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Save, Search, RefreshCw, FileText, AlertCircle, 
  CheckCircle, TrendingUp, Globe, Zap 
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const SEOManager = () => {
  const [settings, setSettings] = useState({
    site_url: "",
    default_meta_title: "",
    default_meta_description: "",
    default_keywords: "",
    robots_txt_content: "",
    auto_index_enabled: true,
    auto_index_frequency: "daily"
  });
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [urlToAnalyze, setUrlToAnalyze] = useState("");

  useEffect(() => {
    fetchSettings();
    setUrlToAnalyze(window.location.origin);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/seo-settings`);
      setSettings(response.data);
    } catch (error) {
      console.error("Erro ao carregar configurações");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/admin/seo-settings`, settings);
      toast.success("Configurações de SEO salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const analyzePage = async () => {
    if (!urlToAnalyze) {
      toast.error("Digite uma URL para analisar");
      return;
    }
    
    setAnalyzing(true);
    try {
      const response = await axios.post(
        `${API}/admin/seo/analyze?url=${encodeURIComponent(urlToAnalyze)}`
      );
      setAnalysis(response.data);
      toast.success("Análise concluída!");
    } catch (error) {
      toast.error("Erro ao analisar página");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateSitemap = async () => {
    try {
      const response = await axios.post(`${API}/admin/seo/generate-sitemap`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error("Erro ao gerar sitemap");
    }
  };

  const updateRobotsTxt = async () => {
    try {
      await axios.post(`${API}/admin/seo/update-robots?content=${encodeURIComponent(settings.robots_txt_content)}`);
      toast.success("robots.txt atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar robots.txt");
    }
  };

  const submitForIndexing = async () => {
    setIndexing(true);
    try {
      const urls = [settings.site_url];
      const response = await axios.post(`${API}/admin/seo/submit-indexing`, urls);
      toast.success("Solicitação de indexação enviada!");
    } catch (error) {
      toast.error("Erro ao solicitar indexação");
    } finally {
      setIndexing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Bom</Badge>;
    if (score >= 60) return <Badge className="bg-orange-100 text-orange-800">OK</Badge>;
    return <Badge className="bg-red-100 text-red-800">Precisa Melhorar</Badge>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SEO Manager</h1>
        <p className="text-gray-600">Otimização e automação de SEO (estilo Yoast Premium)</p>
      </div>

      <Tabs defaultValue="analyzer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analyzer">
            <Search className="w-4 h-4 mr-2" />
            Analisador
          </TabsTrigger>
          <TabsTrigger value="settings">
            <FileText className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="indexing">
            <Globe className="w-4 h-4 mr-2" />
            Indexação
          </TabsTrigger>
        </TabsList>

        {/* ANALYZER TAB */}
        <TabsContent value="analyzer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Página</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={urlToAnalyze}
                  onChange={(e) => setUrlToAnalyze(e.target.value)}
                  placeholder="https://seu-site.com/pagina"
                  className="flex-1"
                />
                <Button onClick={analyzePage} disabled={analyzing}>
                  {analyzing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Analisar
                </Button>
              </div>

              {analysis && (
                <div className="mt-6 space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(analysis.score)}`}>
                      {analysis.score}
                    </div>
                    <div className="text-xl font-medium mb-2">Score de SEO</div>
                    {getScoreBadge(analysis.score)}
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.title_score)}`}>
                        {analysis.title_score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Título</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.description_score)}`}>
                        {analysis.description_score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Descrição</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.headings_score)}`}>
                        {analysis.headings_score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Headings</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.content_score)}`}>
                        {analysis.content_score}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Conteúdo</div>
                    </div>
                  </div>

                  {/* Issues */}
                  {analysis.issues && analysis.issues.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-red-800">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Problemas Críticos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-red-700">{issue}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Warnings */}
                  {analysis.warnings && analysis.warnings.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-orange-800">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Avisos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-orange-700">{warning}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center text-blue-800">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Sugestões de Melhoria
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-blue-700">{suggestion}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL do Site</label>
                <Input
                  value={settings.site_url}
                  onChange={(e) => setSettings({...settings, site_url: e.target.value})}
                  placeholder="https://seu-site.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meta Title Padrão</label>
                <Input
                  value={settings.default_meta_title}
                  onChange={(e) => setSettings({...settings, default_meta_title: e.target.value})}
                  placeholder="Seu Site - Descrição"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meta Description Padrão</label>
                <textarea
                  className="w-full p-3 border rounded min-h-[80px]"
                  value={settings.default_meta_description}
                  onChange={(e) => setSettings({...settings, default_meta_description: e.target.value})}
                  placeholder="Descrição do seu site..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Keywords Padrão</label>
                <Input
                  value={settings.default_keywords}
                  onChange={(e) => setSettings({...settings, default_keywords: e.target.value})}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>robots.txt</span>
                <Button size="sm" onClick={updateRobotsTxt}>
                  <Save className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full p-3 border rounded min-h-[200px] font-mono text-sm"
                value={settings.robots_txt_content}
                onChange={(e) => setSettings({...settings, robots_txt_content: e.target.value})}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>sitemap.xml</span>
                <Button size="sm" onClick={generateSitemap}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Gera automaticamente sitemap.xml com todas as páginas, produtos e conteúdos publicados.
              </p>
              <div className="bg-gray-50 p-4 rounded">
                <code className="text-sm">{settings.site_url}/sitemap.xml</code>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveSettings} className="w-full" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Salvar Configurações
          </Button>
        </TabsContent>

        {/* INDEXING TAB */}
        <TabsContent value="indexing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Indexação Automática</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.auto_index_enabled}
                  onChange={(e) => setSettings({...settings, auto_index_enabled: e.target.checked})}
                  id="auto_index"
                />
                <label htmlFor="auto_index">Ativar indexação automática diária</label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Como funciona:</h4>
                <p className="text-sm mb-2">
                  Quando ativado, o sistema submete automaticamente suas páginas para indexação:
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>✅ Google (via Search Console API)</li>
                  <li>✅ Bing (via Webmaster Tools API)</li>
                  <li>✅ ChatGPT, Gemini, Claude, Perplexity, Deepseek (via sitemap)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitar Indexação Manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Clique no botão abaixo para submeter seu site para indexação em todos os buscadores e LLMs.
              </p>
              
              <Button 
                onClick={submitForIndexing} 
                disabled={indexing}
                className="w-full"
                size="lg"
              >
                {indexing ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 mr-2" />
                )}
                Solicitar Indexação Agora
              </Button>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 border rounded">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Google</div>
                  <div className="text-xs text-gray-500">Search Console</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-sm font-medium">Bing</div>
                  <div className="text-xs text-gray-500">Webmaster</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-sm font-medium">ChatGPT</div>
                  <div className="text-xs text-gray-500">OpenAI</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium">Gemini</div>
                  <div className="text-xs text-gray-500">Google</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                  <div className="text-sm font-medium">Claude</div>
                  <div className="text-xs text-gray-500">Anthropic</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                  <div className="text-sm font-medium">Perplexity</div>
                  <div className="text-xs text-gray-500">+ Deepseek</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEOManager;