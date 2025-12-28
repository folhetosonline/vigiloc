import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff, 
  Award,
  Loader2,
  ExternalLink,
  MessageSquare
} from "lucide-react";

// Source icons and colors
const SOURCE_CONFIG = {
  google: { 
    name: "Google", 
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "🔴"
  },
  facebook: { 
    name: "Facebook", 
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🔵"
  },
  instagram: { 
    name: "Instagram", 
    color: "bg-pink-100 text-pink-700 border-pink-200",
    icon: "📸"
  },
  whatsapp: { 
    name: "WhatsApp", 
    color: "bg-green-100 text-green-700 border-green-200",
    icon: "💬"
  },
  manual: { 
    name: "Manual", 
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "✍️"
  }
};

// Star rating component
const StarRating = ({ rating, onChange, readonly = false }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-2xl transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star 
            className={`w-6 h-6 ${
              star <= (hover || rating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const SocialReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    author_name: "",
    author_avatar: "",
    rating: 5,
    text: "",
    source: "google",
    source_url: "",
    published: true,
    featured: false,
    order: 0,
    review_date: ""
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/social-reviews`);
      setReviews(response.data);
    } catch (error) {
      toast.error("Erro ao carregar avaliações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (review = null) => {
    if (review) {
      setSelectedReview(review);
      setFormData({
        author_name: review.author_name || "",
        author_avatar: review.author_avatar || "",
        rating: review.rating || 5,
        text: review.text || "",
        source: review.source || "google",
        source_url: review.source_url || "",
        published: review.published ?? true,
        featured: review.featured ?? false,
        order: review.order || 0,
        review_date: review.review_date ? review.review_date.split('T')[0] : ""
      });
    } else {
      setSelectedReview(null);
      setFormData({
        author_name: "",
        author_avatar: "",
        rating: 5,
        text: "",
        source: "google",
        source_url: "",
        published: true,
        featured: false,
        order: 0,
        review_date: ""
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.author_name.trim() || !formData.text.trim()) {
      toast.error("Nome e texto são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (selectedReview) {
        await axios.put(`${API}/admin/social-reviews/${selectedReview.id}`, formData);
        toast.success("Avaliação atualizada!");
      } else {
        await axios.post(`${API}/admin/social-reviews`, formData);
        toast.success("Avaliação criada!");
      }
      setDialogOpen(false);
      fetchReviews();
    } catch (error) {
      toast.error("Erro ao salvar avaliação");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;
    
    try {
      await axios.delete(`${API}/admin/social-reviews/${selectedReview.id}`);
      toast.success("Avaliação excluída!");
      setDeleteDialogOpen(false);
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      toast.error("Erro ao excluir avaliação");
      console.error(error);
    }
  };

  const togglePublish = async (review) => {
    try {
      const response = await axios.patch(`${API}/admin/social-reviews/${review.id}/toggle-publish`);
      toast.success(response.data.published ? "Avaliação publicada!" : "Avaliação despublicada!");
      fetchReviews();
    } catch (error) {
      toast.error("Erro ao alterar status");
      console.error(error);
    }
  };

  const toggleFeatured = async (review) => {
    try {
      const response = await axios.patch(`${API}/admin/social-reviews/${review.id}/toggle-featured`);
      toast.success(response.data.featured ? "Avaliação destacada!" : "Destaque removido!");
      fetchReviews();
    } catch (error) {
      toast.error("Erro ao alterar destaque");
      console.error(error);
    }
  };

  const getSourceBadge = (source) => {
    const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon} {config.name}
      </Badge>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Avaliações e Depoimentos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie avaliações de clientes das redes sociais e Google
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Avaliação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Publicadas</p>
                <p className="text-2xl font-bold">{reviews.filter(r => r.published).length}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Destacadas</p>
                <p className="text-2xl font-bold">{reviews.filter(r => r.featured).length}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Média</p>
                <p className="text-2xl font-bold">
                  {reviews.length > 0 
                    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
                    : "0"
                  }
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma avaliação cadastrada</p>
              <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
                Adicionar primeira avaliação
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autor</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destaque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {review.author_avatar ? (
                          <img 
                            src={review.author_avatar} 
                            alt={review.author_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {review.author_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{review.author_name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                            {review.text}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getSourceBadge(review.source)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(review)}
                        className={review.published ? "text-green-600" : "text-gray-400"}
                      >
                        {review.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(review)}
                        className={review.featured ? "text-yellow-500" : "text-gray-400"}
                      >
                        <Award className={`w-4 h-4 ${review.featured ? 'fill-yellow-400' : ''}`} />
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {review.source_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(review.source_url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(review)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            setSelectedReview(review);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedReview ? "Editar Avaliação" : "Nova Avaliação"}
            </DialogTitle>
            <DialogDescription>
              Adicione uma avaliação de cliente das redes sociais ou Google
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Autor *</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>Fonte</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avaliação</Label>
              <StarRating 
                rating={formData.rating} 
                onChange={(rating) => setFormData({ ...formData, rating })}
              />
            </div>

            <div className="space-y-2">
              <Label>Texto da Avaliação *</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Excelente serviço! Recomendo a todos..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL do Avatar (opcional)</Label>
                <Input
                  value={formData.author_avatar}
                  onChange={(e) => setFormData({ ...formData, author_avatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Data da Avaliação</Label>
                <Input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link Original (opcional)</Label>
              <Input
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://g.co/review/..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label>Publicar</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label>Destacar na Home</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedReview ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a avaliação de "{selectedReview?.author_name}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialReviews;
