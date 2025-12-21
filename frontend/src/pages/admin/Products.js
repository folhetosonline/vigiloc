import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: 0,
    image: "",
    images: [],
    features: [],
    inStock: true,
    quantity: 0,
    sku: "",
    weight: 0,
    show_on_pages: [],
    badges: [],
    enable_cart: false,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      // Use admin endpoint to see ALL products (published and unpublished)
      const response = await axios.get(`${API}/admin/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      toast.error("Erro ao carregar categorias");
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
      setFormData({ ...formData, image: response.data.url });
      toast.success("Imagem enviada com sucesso");
    } catch (error) {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.id}`, formData);
        toast.success("Produto atualizado com sucesso");
      } else {
        await axios.post(`${API}/admin/products`, formData);
        toast.success("Produto criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      image: product.image,
      images: product.images || [],
      features: product.features || [],
      inStock: product.inStock,
      quantity: product.quantity || 0,
      sku: product.sku || "",
      weight: product.weight || 0,
      show_on_pages: product.show_on_pages || [],
      badges: product.badges || [],
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      await axios.delete(`${API}/admin/products/${id}`);
      toast.success("Produto deletado com sucesso");
      fetchProducts();
    } catch (error) {
      toast.error("Erro ao deletar produto");
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await axios.patch(`${API}/admin/products/${id}/publish?published=${newStatus}`);
      toast.success(newStatus ? "Produto publicado!" : "Produto despublicado!");
      fetchProducts();
    } catch (error) {
      toast.error("Erro ao atualizar status de publicação");
    }
  };


  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      price: 0,
      image: "",
      images: [],
      features: [],
      inStock: true,
      quantity: 0,
      sku: "",
      weight: 0,
      show_on_pages: [],
      badges: [],
    });
    setEditingProduct(null);
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preço</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantidade</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Imagem Principal</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Características</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeFeature(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFeature}>
                  Adicionar Característica
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                />
                <label>Em estoque</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">🎯 Exibir nas Páginas</label>
                <div className="space-y-2">
                  {["home", "totens", "produtos", "todas"].map(page => (
                    <div key={page} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`page-${page}`}
                        checked={formData.show_on_pages.includes(page)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, show_on_pages: [...formData.show_on_pages, page] });
                          } else {
                            setFormData({ ...formData, show_on_pages: formData.show_on_pages.filter(p => p !== page) });
                          }
                        }}
                      />
                      <label htmlFor={`page-${page}`} className="capitalize">{page}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">🏷️ Badges do Produto</label>
                <div className="space-y-2">
                  {[
                    { value: "novidade", label: "🆕 Novidade" },
                    { value: "lancamento", label: "🚀 Lançamento" },
                    { value: "custo-beneficio", label: "💰 Ótimo Custo-Benefício" },
                    { value: "top-linha", label: "⭐ Top de Linha" },
                    { value: "oferta", label: "🔥 Oferta" },
                    { value: "destaque", label: "🎯 Destaque" }
                  ].map(badge => (
                    <div key={badge.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`badge-${badge.value}`}
                        checked={formData.badges.includes(badge.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, badges: [...formData.badges, badge.value] });
                          } else {
                            setFormData({ ...formData, badges: formData.badges.filter(b => b !== badge.value) });
                          }
                        }}
                      />
                      <label htmlFor={`badge-${badge.value}`}>{badge.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingProduct ? "Atualizar" : "Criar"} Produto
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
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className={!product.published ? "bg-gray-50" : ""}>
                  <TableCell>
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>R$ {(product.price || 0).toFixed(2)}</TableCell>
                  <TableCell>{product.quantity || 0}</TableCell>
                  <TableCell>
                    <Badge className={product.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {product.published ? "🟢 Publicado" : "⚪ Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="icon" 
                        variant={product.published ? "outline" : "default"}
                        onClick={() => handleTogglePublish(product.id, product.published)}
                        title={product.published ? "Despublicar" : "Publicar"}
                      >
                        {product.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(product.id)}>
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

export default Products;