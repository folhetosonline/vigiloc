import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, EyeOff, Pencil, Trash2, Save, Layout } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PageBuilder = () => {
  const [pages, setPages] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    meta_title: "",
    meta_description: "",
    blocks: [],
    published: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await axios.get(`${API}/admin/pages`);
      setPages(response.data);
    } catch (error) {
      toast.error("Erro ao carregar p\u00e1ginas");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/pages`, formData);
      toast.success("P\u00e1gina criada!");
      setOpen(false);
      resetForm();
      fetchPages();
    } catch (error) {
      toast.error("Erro ao criar p\u00e1gina");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deletar esta p\u00e1gina?")) return;
    try {
      await axios.delete(`${API}/admin/pages/${id}`);
      toast.success("P\u00e1gina deletada");
      fetchPages();
    } catch (error) {
      toast.error("Erro ao deletar");
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      meta_title: "",
      meta_description: "",
      blocks: [],
      published: false
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Page Builder</h1>
          <p className="text-gray-600">Crie p\u00e1ginas customizadas para seu site</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova P\u00e1gina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova P\u00e1gina</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">T\u00edtulo</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Sobre N\u00f3s"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug (URL)</label>
                <Input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\\s+/g, '-')})}
                  placeholder="sobre-nos"
                />
                <p className="text-xs text-gray-500 mt-1">URL: /{formData.slug}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Meta T\u00edtulo (SEO)</label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                  placeholder="Deixe vazio para usar o t\u00edtulo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Meta Descri\u00e7\u00e3o (SEO)</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                  placeholder="Descri\u00e7\u00e3o para motores de busca"
                />
              </div>
              <Button type="submit" className="w-full">Criar P\u00e1gina</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (\n          <Card key={page.id} className={!page.published ? \"border-orange-200 bg-orange-50\" : \"\"}>\n            <CardHeader>\n              <div className=\"flex justify-between items-start\">\n                <div>\n                  <CardTitle className=\"text-lg\">{page.title}</CardTitle>\n                  <p className=\"text-sm text-gray-500 mt-1\">/{page.slug}</p>\n                </div>\n                <Badge className={page.published ? \"bg-green-100 text-green-800\" : \"bg-orange-100 text-orange-800\"}>\n                  {page.published ? \"\ud83d\udfe2 Live\" : \"\u26a0\ufe0f Draft\"}\n                </Badge>\n              </div>\n            </CardHeader>\n            <CardContent>\n              <div className=\"flex gap-2\">\n                <Button size=\"sm\" variant=\"outline\" onClick={() => navigate(`/admin/page-editor/${page.id}`)}>\n                  <Pencil className=\"h-4 w-4 mr-1\" />\n                  Editar\n                </Button>\n                <Button size=\"sm\" variant=\"outline\" onClick={() => window.open(`/pages/${page.slug}`, '_blank')}>\n                  <Eye className=\"h-4 w-4 mr-1\" />\n                  Preview\n                </Button>\n                <Button size=\"sm\" variant=\"destructive\" onClick={() => handleDelete(page.id)}>\n                  <Trash2 className=\"h-4 w-4\" />\n                </Button>\n              </div>\n            </CardContent>\n          </Card>\n        ))}\n      </div>\n\n      {pages.length === 0 && (\n        <Card className=\"mt-8\">\n          <CardContent className=\"flex flex-col items-center justify-center py-16\">\n            <Layout className=\"h-16 w-16 text-gray-400 mb-4\" />\n            <h3 className=\"text-xl font-semibold mb-2\">Nenhuma p\u00e1gina ainda</h3>\n            <p className=\"text-gray-600 mb-4\">Crie sua primeira p\u00e1gina customizada</p>\n            <Button onClick={() => setOpen(true)}>\n              <Plus className=\"mr-2 h-4 w-4\" />\n              Criar P\u00e1gina\n            </Button>\n          </CardContent>\n        </Card>\n      )}\n    </div>\n  );\n};\n\nexport default PageBuilder;
