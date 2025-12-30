import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Save, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, 
  Image as ImageIcon, Type, LayoutGrid, Play, ShoppingBag 
} from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const ContentBlockEditor = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [blockForm, setBlockForm] = useState({
    type: "hero",
    settings: {},
    content: {},
    published: true,
    order: 0
  });

  const blockTypes = [
    { value: "hero", label: "Hero Section", icon: <ImageIcon className="w-4 h-4" /> },
    { value: "card", label: "Cards", icon: <LayoutGrid className="w-4 h-4" /> },
    { value: "text", label: "Texto", icon: <Type className="w-4 h-4" /> },
    { value: "media", label: "Mídia", icon: <Play className="w-4 h-4" /> },
    { value: "banner", label: "Banner", icon: <ImageIcon className="w-4 h-4" /> },
    { value: "product_list", label: "Lista de Produtos", icon: <ShoppingBag className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (pageId) {
      loadPageData();
    }
  }, [pageId]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPage(), fetchBlocks()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPage = async () => {
    try {
      // Fetch both system and custom pages
      const response = await axios.get(`${API}/admin/all-pages`);
      // Search in both system and custom pages
      const systemPage = response.data.system?.find(p => p.id === pageId);
      const customPage = response.data.custom?.find(p => p.id === pageId);
      const foundPage = systemPage || customPage;
      
      if (foundPage) {
        setPage({
          ...foundPage,
          title: foundPage.title || foundPage.name,
          isSystem: !!systemPage
        });
      } else {
        toast.error("Página não encontrada");
        navigate("/admin/page-builder");
      }
    } catch (error) {
      toast.error("Erro ao carregar página");
      console.error(error);
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await axios.get(`${API}/admin/content-blocks/${pageId}`);
      setBlocks(response.data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Erro ao carregar blocos");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.url;
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      const blockData = {
        ...blockForm,
        page_id: pageId,
        order: blocks.length
      };
      
      await axios.post(`${API}/admin/content-blocks`, blockData);
      toast.success("Bloco criado!");
      setOpen(false);
      resetForm();
      fetchBlocks();
    } catch (error) {
      toast.error("Erro ao criar bloco");
    }
  };

  const handleUpdateBlock = async (blockId, updates) => {
    try {
      await axios.put(`${API}/admin/content-blocks/${blockId}`, updates);
      toast.success("Bloco atualizado!");
      fetchBlocks();
    } catch (error) {
      toast.error("Erro ao atualizar bloco");
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm("Deletar este bloco?")) return;
    
    try {
      await axios.delete(`${API}/admin/content-blocks/${blockId}`);
      toast.success("Bloco deletado!");
      fetchBlocks();
    } catch (error) {
      toast.error("Erro ao deletar bloco");
    }
  };

  const moveBlock = async (blockId, direction) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === blocks.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newOrder = blocks[newIndex].order;

    try {
      await axios.put(`${API}/admin/content-blocks/${blockId}/reorder?new_order=${newOrder}`);
      toast.success("Ordem atualizada!");
      fetchBlocks();
    } catch (error) {
      toast.error("Erro ao reordenar");
    }
  };

  const resetForm = () => {
    setBlockForm({
      type: "hero",
      settings: {},
      content: {},
      published: true,
      order: 0
    });
    setEditingBlock(null);
  };

  const renderBlockPreview = (block) => {
    switch (block.type) {
      case "hero":
        return (
          <div className="p-4 bg-gray-900 text-white rounded">
            <h2 className="text-2xl font-bold">{block.content.title || "Título Hero"}</h2>
            <p>{block.content.subtitle || "Subtítulo"}</p>
          </div>
        );
      case "card":
        return (
          <div className="p-4 bg-gray-100 rounded">
            <LayoutGrid className="w-8 h-8 mb-2" />
            <p className="text-sm">Grid de Cards ({block.content.cards?.length || 0} cards)</p>
          </div>
        );
      case "text":
        return (
          <div className="p-4 border rounded">
            <Type className="w-6 h-6 mb-2" />
            <p className="text-sm">{block.content.html?.substring(0, 100) || "Bloco de texto"}</p>
          </div>
        );
      case "media":
        return (
          <div className="p-4 bg-blue-50 rounded flex items-center">
            <Play className="w-8 h-8 mr-2" />
            <p className="text-sm">Mídia ({block.content.media?.length || 0} arquivos)</p>
          </div>
        );
      case "banner":
        return (
          <div className="relative h-24 bg-gray-200 rounded overflow-hidden">
            {block.content.image_url ? (
              <img src={block.content.image_url} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        );
      case "product_list":
        return (
          <div className="p-4 bg-green-50 rounded">
            <ShoppingBag className="w-8 h-8 mb-2" />
            <p className="text-sm">Lista de Produtos - {block.content.title || "Sem título"}</p>
            <p className="text-xs text-gray-500">
              Filtro: {block.content.category || block.content.badges?.join(", ") || "Todos"}
            </p>
          </div>
        );
      default:
        return <div className="p-4 border rounded">Tipo: {block.type}</div>;
    }
  };

  const renderBlockEditor = () => {
    switch (blockForm.type) {
      case "hero":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <Input
                value={blockForm.content.title || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, title: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subtítulo</label>
              <Input
                value={blockForm.content.subtitle || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, subtitle: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">URL da Imagem de Fundo</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={async (e) => {
                    const url = await handleUpload(e);
                    if (url) {
                      setBlockForm({
                        ...blockForm,
                        content: { ...blockForm.content, background_url: url }
                      });
                    }
                  }}
                  disabled={uploading}
                />
                {blockForm.content.background_url && (
                  <img 
                    src={blockForm.content.background_url} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded" 
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Texto do Botão</label>
                <Input
                  value={blockForm.content.button_text || ""}
                  onChange={(e) => setBlockForm({
                    ...blockForm,
                    content: { ...blockForm.content, button_text: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Link do Botão</label>
                <Input
                  value={blockForm.content.button_link || ""}
                  onChange={(e) => setBlockForm({
                    ...blockForm,
                    content: { ...blockForm.content, button_link: e.target.value }
                  })}
                />
              </div>
            </div>
          </>
        );
      
      case "text":
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Conteúdo HTML</label>
            <textarea
              className="w-full p-3 border rounded min-h-[200px] font-mono text-sm"
              value={blockForm.content.html || ""}
              onChange={(e) => setBlockForm({
                ...blockForm,
                content: { ...blockForm.content, html: e.target.value }
              })}
              placeholder="<p>Seu conteúdo HTML aqui...</p>"
            />
          </div>
        );
      
      case "banner":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const url = await handleUpload(e);
                    if (url) {
                      setBlockForm({
                        ...blockForm,
                        content: { ...blockForm.content, image_url: url }
                      });
                    }
                  }}
                  disabled={uploading}
                />
                {blockForm.content.image_url && (
                  <img 
                    src={blockForm.content.image_url} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded" 
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Link do Banner</label>
              <Input
                value={blockForm.content.link || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, link: e.target.value }
                })}
                placeholder="/produtos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Texto Alternativo</label>
              <Input
                value={blockForm.content.alt || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, alt: e.target.value }
                })}
              />
            </div>
          </>
        );
      
      case "product_list":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Título da Seção</label>
              <Input
                value={blockForm.content.title || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, title: e.target.value }
                })}
                placeholder="Produtos em Destaque"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por Categoria</label>
              <Input
                value={blockForm.content.category || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, category: e.target.value }
                })}
                placeholder="Câmeras"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por Badges (separados por vírgula)</label>
              <Input
                value={blockForm.content.badges?.join(",") || ""}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  content: { ...blockForm.content, badges: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }
                })}
                placeholder="novidade,top-linha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Limite de Produtos</label>
              <Input
                type="number"
                value={blockForm.settings.limit || 12}
                onChange={(e) => setBlockForm({
                  ...blockForm,
                  settings: { ...blockForm.settings, limit: parseInt(e.target.value) }
                })}
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Editor para tipo "{blockForm.type}" em desenvolvimento
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">Página não encontrada</p>
          <Button onClick={() => navigate("/admin/page-builder")}>
            Voltar ao Page Builder
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button variant="outline" onClick={() => navigate("/admin/page-builder")} className="mb-2">
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold">Editor: {page.title}</h1>
          <p className="text-gray-600">Gerencie os blocos de conteúdo desta página</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Bloco
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Bloco</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Bloco</label>
                <Select 
                  value={blockForm.type} 
                  onValueChange={(value) => setBlockForm({ ...blockForm, type: value, content: {}, settings: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blockTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {renderBlockEditor()}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={blockForm.published}
                  onChange={(e) => setBlockForm({ ...blockForm, published: e.target.checked })}
                />
                <label>Publicar bloco</label>
              </div>

              <Button type="submit" className="w-full">Criar Bloco</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutGrid className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum bloco ainda</h3>
            <p className="text-gray-600 mb-4">Adicione seu primeiro bloco de conteúdo</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Bloco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <Card key={block.id} className={!block.published ? "border-orange-300 bg-orange-50" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <CardTitle className="text-lg capitalize">{block.type}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {block.published ? "✅ Publicado" : "⚠️ Rascunho"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveBlock(block.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => moveBlock(block.id, "down")}
                      disabled={index === blocks.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleUpdateBlock(block.id, { published: !block.published })}
                    >
                      {block.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteBlock(block.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderBlockPreview(block)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentBlockEditor;
