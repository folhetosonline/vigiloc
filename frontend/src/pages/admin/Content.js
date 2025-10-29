import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Save, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Content = () => {
  const [contactContent, setContactContent] = useState(null);
  const [totensContent, setTotensContent] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      const [contact, totens] = await Promise.all([
        axios.get(`${API}/admin/page-content/contato`),
        axios.get(`${API}/admin/page-content/totens`)
      ]);
      
      setContactContent(contact.data);
      setTotensContent(totens.data);
    } catch (error) {
      toast.error("Erro ao carregar conteúdo");
    }
  };

  const handleSave = async (page, content) => {
    try {
      await axios.put(`${API}/admin/page-content/${page}`, content);
      toast.success("Conteúdo salvo!");
      fetchAllContent();
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const handleTogglePublish = async (page, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await axios.patch(`${API}/admin/page-content/${page}/publish?published=${newStatus}`);
      toast.success(newStatus ? "Publicado!" : "Despublicado!");
      fetchAllContent();
    } catch (error) {
      toast.error("Erro");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gerenciar Conteúdo</h1>

      <Tabs defaultValue="contato" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contato">Página Contato</TabsTrigger>
          <TabsTrigger value="totens">Página Totens</TabsTrigger>
        </TabsList>

        <TabsContent value="contato">
          {contactContent && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Contato</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={contactContent.published ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {contactContent.published ? "🟢 PUBLICADO" : "⚠️ RASCUNHO"}
                    </Badge>
                    <Button size="sm" onClick={() => handleTogglePublish('contato', contactContent.published)}>
                      {contactContent.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título</label>
                  <Input
                    value={contactContent.sections?.hero_title || ""}
                    onChange={(e) => setContactContent({
                      ...contactContent,
                      sections: { ...contactContent.sections, hero_title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtítulo</label>
                  <Input
                    value={contactContent.sections?.hero_subtitle || ""}
                    onChange={(e) => setContactContent({
                      ...contactContent,
                      sections: { ...contactContent.sections, hero_subtitle: e.target.value }
                    })}
                  />
                </div>
                <Button onClick={() => handleSave('contato', contactContent)} className="w-full">
                  <Save className="mr-2 h-4 w-4" />Salvar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="totens">
          {totensContent && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Totens</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={totensContent.published ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {totensContent.published ? "🟢 PUBLICADO" : "⚠️ RASCUNHO"}
                    </Badge>
                    <Button size="sm" onClick={() => handleTogglePublish('totens', totensContent.published)}>
                      {totensContent.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título</label>
                  <Input
                    value={totensContent.sections?.hero_title || ""}
                    onChange={(e) => setTotensContent({
                      ...totensContent,
                      sections: { ...totensContent.sections, hero_title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="4"
                    value={totensContent.sections?.description || ""}
                    onChange={(e) => setTotensContent({
                      ...totensContent,
                      sections: { ...totensContent.sections, description: e.target.value }
                    })}
                  />
                </div>
                <Button onClick={() => handleSave('totens', totensContent)} className="w-full">
                  <Save className="mr-2 h-4 w-4" />Salvar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Content;