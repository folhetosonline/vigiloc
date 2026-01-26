import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, EyeOff, Pencil, Trash2, Save, Layout, Copy, Video, Image as ImageIcon, FileText } from "lucide-react";
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
      const response = await axios.get(`${API}/admin/all-pages`);
      // Combine system and custom pages
      const allPages = [
        ...response.data.system.map(p => ({...p, isSystem: true})),
        ...response.data.custom.map(p => ({...p, isSystem: false}))
      ];
      setPages(allPages);
    } catch (error) {
      toast.error("Erro ao carregar páginas");
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

  const handleDuplicate = async (page) => {
    try {
      const response = await axios.post(`${API}/admin/pages/${page.id}/duplicate`, {}, { withCredentials: true });
      toast.success("Página duplicada com sucesso!");
      fetchPages();
    } catch (error) {
      console.error("Error duplicating page:", error);
      toast.error("Erro ao duplicar página");
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

  // Video Thumbnail Component with error handling
  const VideoThumbnail = ({ src, poster, className }) => {
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
      setHasError(false);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, [src]);

    if (hasError || !src) {
      return (
        <div className={`${className} bg-gray-800 flex items-center justify-center`}>
          <Video className="w-6 h-6 text-white opacity-50" />
        </div>
      );
    }

    return (
      <video 
        ref={videoRef}
        className={className}
        muted
        loop
        playsInline
        autoPlay
        poster={poster}
        onError={() => setHasError(true)}
      >
        <source src={src} type="video/mp4" />
      </video>
    );
  };

  // Get thumbnail info from page blocks
  const getPageThumbnail = (page) => {
    const blocks = page.blocks || [];
    // Look for hero block first
    const heroBlock = blocks.find(b => b.type === 'hero');
    if (heroBlock) {
      if (heroBlock.backgroundType === 'video' && heroBlock.video) {
        return { type: 'video', src: heroBlock.video, poster: heroBlock.image };
      }
      if (heroBlock.image) {
        return { type: 'image', src: heroBlock.image };
      }
    }
    // Look for banner block
    const bannerBlock = blocks.find(b => b.type === 'banner');
    if (bannerBlock && bannerBlock.image) {
      return { type: 'image', src: bannerBlock.image };
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Page Builder</h1>
          <p className="text-gray-600">Crie páginas customizadas para seu site</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Página
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Página</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
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
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '')})}
                  placeholder="sobre-nos"
                />
                <p className="text-xs text-gray-500 mt-1">URL: /p/{formData.slug}</p>
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
        {pages.map((page) => {
          const thumbnail = getPageThumbnail(page);
          return (
            <Card key={page.id} className={`overflow-hidden ${page.isSystem ? "border-blue-200" : !page.published ? "border-orange-200" : ""}`}>
              {/* Page Thumbnail */}
              {thumbnail ? (
                <div className="h-32 relative overflow-hidden bg-gray-100">
                  {thumbnail.type === 'video' ? (
                    <>
                      <VideoThumbnail 
                        src={thumbnail.src}
                        poster={thumbnail.poster}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-red-500/80 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Vídeo
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={thumbnail.src} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-blue-500/80 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Imagem
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className={`h-32 flex items-center justify-center ${page.isSystem ? "bg-blue-100" : "bg-gray-100"}`}>
                  <div className="text-center">
                    <FileText className={`w-8 h-8 mx-auto mb-1 ${page.isSystem ? "text-blue-400" : "text-gray-400"}`} />
                    <span className="text-xs text-gray-500">{(page.blocks || []).length} blocos</span>
                  </div>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {page.name || page.title}
                      {page.isSystem && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Sistema
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">/{page.slug}</p>
                  </div>
                  {!page.isSystem && (
                    <Badge className={page.published ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {page.published ? "🟢 Live" : "⚠️ Draft"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/page-editor/${page.id}`)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar Conteúdo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/p/${page.slug}`, '_blank')}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  {!page.isSystem && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleDuplicate(page)} title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(page.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>

      {pages.length === 0 && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layout className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma página ainda</h3>
            <p className="text-gray-600 mb-4">Crie sua primeira página customizada</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Página
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PageBuilder;
