import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    media_type: "image",
    media_url: "",
    link_url: "",
    order: 0,
    active: true
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API}/admin/banners`);
      setBanners(response.data);
    } catch (error) {
      toast.error("Erro ao carregar banners");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      setFormData({ ...formData, media_url: response.data.url, media_type: mediaType });
      toast.success("Arquivo enviado com sucesso");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBanner) {
        await axios.put(`${API}/admin/banners/${editingBanner.id}`, formData);
        toast.success("Banner atualizado com sucesso");
      } else {
        await axios.post(`${API}/admin/banners`, formData);
        toast.success("Banner criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      toast.error("Erro ao salvar banner");
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      media_type: banner.media_type,
      media_url: banner.media_url,
      link_url: banner.link_url || "",
      order: banner.order,
      active: banner.active
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar este banner?")) return;

    try {
      await axios.delete(`${API}/admin/banners/${id}`);
      toast.success("Banner deletado com sucesso");
      fetchBanners();
    } catch (error) {
      toast.error("Erro ao deletar banner");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      media_type: "image",
      media_url: "",
      link_url: "",
      order: 0,
      active: true
    });
    setEditingBanner(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Banners do Carrossel</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtítulo</label>
                <Textarea
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Mídia</label>
                <Select value={formData.media_type} onValueChange={(value) => setFormData({ ...formData, media_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mídia</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept={formData.media_type === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </div>
                  <Input
                    placeholder="Ou cole a URL da mídia"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                  />
                  {formData.media_url && formData.media_type === 'image' && (
                    <img src={formData.media_url} alt="Preview" className="w-32 h-32 object-cover rounded" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Link (opcional)</label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ordem de Exibição</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <label>Ativo</label>
              </div>

              <Button type="submit" className="w-full">
                {editingBanner ? "Atualizar" : "Criar"} Banner
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    {banner.media_type === 'image' ? (
                      <img src={banner.media_url} alt={banner.title} className="w-20 h-12 object-cover rounded" />
                    ) : (
                      <video src={banner.media_url} className="w-20 h-12 object-cover rounded" muted />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>{banner.media_type === 'image' ? 'Imagem' : 'Vídeo'}</TableCell>
                  <TableCell>{banner.order}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {banner.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="icon" variant="outline" onClick={() => handleEdit(banner)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(banner.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Banners;