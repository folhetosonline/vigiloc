import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Save, Link2, ExternalLink, FileText, FolderOpen } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const NavbarManager = () => {
  const [settings, setSettings] = useState({
    background_color: "#FFFFFF",
    text_color: "#1F2937",
    hover_color: "#3B82F6",
    font_family: "Inter",
    links: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Available pages and categories for quick add
  const [availablePages, setAvailablePages] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  
  // Dialog states
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [sublinkDialogOpen, setSublinkDialogOpen] = useState(false);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editingSublink, setEditingSublink] = useState(null);
  const [parentLinkId, setParentLinkId] = useState(null);
  
  // Form states
  const [linkForm, setLinkForm] = useState({ label: "", url: "" });
  const [sublinkForm, setSublinkForm] = useState({ label: "", url: "" });

  useEffect(() => {
    fetchSettings();
    fetchAvailablePages();
    fetchCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/navbar-settings`);
      setSettings({
        background_color: response.data.background_color || "#FFFFFF",
        text_color: response.data.text_color || "#1F2937",
        hover_color: response.data.hover_color || "#3B82F6",
        font_family: response.data.font_family || "Inter",
        links: response.data.links || []
      });
    } catch (error) {
      console.error("Error fetching navbar settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePages = async () => {
    try {
      const response = await axios.get(`${API}/admin/pages`);
      // Filter only published pages
      const published = response.data.filter(p => p.published);
      setAvailablePages(published);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setAvailableCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/navbar-settings`, settings);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving navbar settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  // Link management
  const openAddLinkDialog = () => {
    setEditingLink(null);
    setLinkForm({ label: "", url: "" });
    setLinkDialogOpen(true);
  };

  const openEditLinkDialog = (link) => {
    setEditingLink(link);
    setLinkForm({ label: link.label, url: link.url });
    setLinkDialogOpen(true);
  };

  const handleLinkSubmit = () => {
    if (!linkForm.label || !linkForm.url) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (editingLink) {
      setSettings(prev => ({
        ...prev,
        links: prev.links.map(link => 
          link.id === editingLink.id 
            ? { ...link, label: linkForm.label, url: linkForm.url }
            : link
        )
      }));
      toast.success("Link atualizado!");
    } else {
      const newLink = {
        id: `link-${Date.now()}`,
        label: linkForm.label,
        url: linkForm.url,
        sublinks: []
      };
      setSettings(prev => ({
        ...prev,
        links: [...prev.links, newLink]
      }));
      toast.success("Link adicionado!");
    }

    setLinkDialogOpen(false);
    setLinkForm({ label: "", url: "" });
    setEditingLink(null);
  };

  const deleteLink = (linkId) => {
    if (!window.confirm("Deseja remover este link e todos os seus sublinks?")) return;
    
    setSettings(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
    toast.success("Link removido!");
  };

  const moveLink = (index, direction) => {
    const newLinks = [...settings.links];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newLinks.length) return;
    
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    setSettings(prev => ({ ...prev, links: newLinks }));
  };

  // Sublink management
  const openAddSublinkDialog = (parentId) => {
    setParentLinkId(parentId);
    setEditingSublink(null);
    setSublinkForm({ label: "", url: "" });
    setSublinkDialogOpen(true);
  };

  const openEditSublinkDialog = (parentId, sublink) => {
    setParentLinkId(parentId);
    setEditingSublink(sublink);
    setSublinkForm({ label: sublink.label, url: sublink.url });
    setSublinkDialogOpen(true);
  };

  const handleSublinkSubmit = () => {
    if (!sublinkForm.label || !sublinkForm.url) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSettings(prev => ({
      ...prev,
      links: prev.links.map(link => {
        if (link.id !== parentLinkId) return link;
        
        if (editingSublink) {
          return {
            ...link,
            sublinks: link.sublinks.map(sub => 
              sub.id === editingSublink.id 
                ? { ...sub, label: sublinkForm.label, url: sublinkForm.url }
                : sub
            )
          };
        } else {
          return {
            ...link,
            sublinks: [...(link.sublinks || []), {
              id: `sublink-${Date.now()}`,
              label: sublinkForm.label,
              url: sublinkForm.url
            }]
          };
        }
      })
    }));

    toast.success(editingSublink ? "Sublink atualizado!" : "Sublink adicionado!");
    setSublinkDialogOpen(false);
    setSublinkForm({ label: "", url: "" });
    setEditingSublink(null);
    setParentLinkId(null);
  };

  const deleteSublink = (parentId, sublinkId) => {
    setSettings(prev => ({
      ...prev,
      links: prev.links.map(link => {
        if (link.id !== parentId) return link;
        return {
          ...link,
          sublinks: link.sublinks.filter(sub => sub.id !== sublinkId)
        };
      })
    }));
    toast.success("Sublink removido!");
  };

  // Quick add functions
  const addPageAsLink = (page) => {
    const newLink = {
      id: `link-page-${Date.now()}`,
      label: page.title,
      url: `/p/${page.slug}`,
      sublinks: []
    };
    setSettings(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }));
    toast.success(`Página "${page.title}" adicionada!`);
  };

  const addPageAsSublink = (page, parentId) => {
    setSettings(prev => ({
      ...prev,
      links: prev.links.map(link => {
        if (link.id !== parentId) return link;
        return {
          ...link,
          sublinks: [...(link.sublinks || []), {
            id: `sublink-page-${Date.now()}`,
            label: page.title,
            url: `/p/${page.slug}`
          }]
        };
      })
    }));
    toast.success(`Página "${page.title}" adicionada como sublink!`);
  };

  const addCategoryAsSublink = (category, parentId) => {
    setSettings(prev => ({
      ...prev,
      links: prev.links.map(link => {
        if (link.id !== parentId) return link;
        return {
          ...link,
          sublinks: [...(link.sublinks || []), {
            id: `sublink-cat-${Date.now()}`,
            label: category.name,
            url: `/totens?categoria=${category.slug}`
          }]
        };
      })
    }));
    toast.success(`Categoria "${category.name}" adicionada como sublink!`);
  };

  // Add "Serviços" template with categories
  const addServicosTemplate = () => {
    const servicosLink = {
      id: `link-servicos-${Date.now()}`,
      label: "Serviços",
      url: "/totens",
      sublinks: availableCategories.map(cat => ({
        id: `sublink-${cat.id}`,
        label: cat.name,
        url: `/totens?categoria=${cat.slug}`
      }))
    };
    
    setSettings(prev => ({
      ...prev,
      links: [...prev.links, servicosLink]
    }));
    toast.success("Menu 'Serviços' com categorias adicionado!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu de Navegação</h1>
          <p className="text-gray-500 mt-1">Configure os links e submenus do header</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">⚡ Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={addServicosTemplate} className="bg-white">
              <FolderOpen className="w-4 h-4 mr-2" />
              Adicionar "Serviços" com Categorias
            </Button>
            <Button variant="outline" onClick={() => setQuickAddDialogOpen(true)} className="bg-white">
              <FileText className="w-4 h-4 mr-2" />
              Adicionar Página do Page Builder
            </Button>
            <Button variant="outline" onClick={openAddLinkDialog} className="bg-white">
              <Plus className="w-4 h-4 mr-2" />
              Link Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cores do Navbar */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Cores e Estilo</CardTitle>
          <CardDescription>Personalize as cores do menu de navegação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={settings.background_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Cor do Texto</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={settings.text_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={settings.text_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Cor de Hover</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={settings.hover_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, hover_color: e.target.value }))}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={settings.hover_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, hover_color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Fonte</Label>
              <select
                value={settings.font_family}
                onChange={(e) => setSettings(prev => ({ ...prev, font_family: e.target.value }))}
                className="w-full mt-1 h-10 px-3 border rounded-md"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
          </div>
          
          {/* Preview */}
          <div className="mt-6">
            <Label>Preview do Menu</Label>
            <div 
              className="mt-2 p-4 rounded-lg flex items-center gap-6 shadow"
              style={{ backgroundColor: settings.background_color, fontFamily: settings.font_family }}
            >
              <span className="font-bold text-xl" style={{ color: settings.text_color }}>VigiLoc</span>
              {settings.links.length > 0 ? (
                settings.links.slice(0, 5).map((link, idx) => (
                  <div key={idx} className="relative group">
                    <span 
                      className="cursor-pointer flex items-center gap-1"
                      style={{ color: settings.text_color }}
                    >
                      {link.label}
                      {link.sublinks?.length > 0 && <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-sm">Adicione links para ver o preview</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links de Navegação */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>🔗 Links de Navegação</CardTitle>
              <CardDescription>Organize os links do menu principal e seus submenus</CardDescription>
            </div>
            <Button onClick={openAddLinkDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.links.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
              <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Nenhum link configurado</p>
              <p className="text-sm mb-4">Use as ações rápidas acima ou clique em "Novo Link"</p>
              <Button variant="outline" onClick={addServicosTemplate}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Começar com "Serviços"
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {settings.links.map((link, index) => (
                <div key={link.id} className="border rounded-lg overflow-hidden">
                  {/* Link principal */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50">
                    <div className="flex flex-col gap-0.5">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => moveLink(index, -1)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => moveLink(index, 1)}
                        disabled={index === settings.links.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{link.label}</p>
                        {link.sublinks?.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {link.sublinks.length} sublinks
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {link.url}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAddSublinkDialog(link.id)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Sublink
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => openEditLinkDialog(link)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteLink(link.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Sublinks */}
                  {link.sublinks && link.sublinks.length > 0 && (
                    <div className="border-t bg-white">
                      {link.sublinks.map((sublink) => (
                        <div key={sublink.id} className="flex items-center gap-3 p-3 pl-16 border-b last:border-b-0 hover:bg-gray-50">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <div className="flex-1">
                            <p className="font-medium">{sublink.label}</p>
                            <p className="text-xs text-gray-500">{sublink.url}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditSublinkDialog(link.id, sublink)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteSublink(link.id, sublink.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick add pages/categories to existing link */}
      {settings.links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📄 Adicionar Páginas aos Menus</CardTitle>
            <CardDescription>Adicione páginas do Page Builder como sublinks</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pages">
              <TabsList className="mb-4">
                <TabsTrigger value="pages">Páginas Publicadas</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pages">
                {availablePages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma página publicada encontrada</p>
                ) : (
                  <div className="space-y-2">
                    {availablePages.map(page => (
                      <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-gray-500">/p/{page.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => addPageAsLink(page)}>
                            Link Principal
                          </Button>
                          <Select onValueChange={(parentId) => addPageAsSublink(page, parentId)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Sublink de..." />
                            </SelectTrigger>
                            <SelectContent>
                              {settings.links.map(link => (
                                <SelectItem key={link.id} value={link.id}>{link.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="categories">
                {availableCategories.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma categoria encontrada</p>
                ) : (
                  <div className="space-y-2">
                    {availableCategories.map(category => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-500">/totens?categoria={category.slug}</p>
                        </div>
                        <Select onValueChange={(parentId) => addCategoryAsSublink(category, parentId)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Adicionar a..." />
                          </SelectTrigger>
                          <SelectContent>
                            {settings.links.map(link => (
                              <SelectItem key={link.id} value={link.id}>{link.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Dialog para adicionar/editar Link */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Editar Link" : "Novo Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Texto do Link</Label>
              <Input
                placeholder="Ex: Serviços, Sobre, Contato"
                value={linkForm.label}
                onChange={(e) => setLinkForm(prev => ({ ...prev, label: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                placeholder="Ex: /totens ou /p/minha-pagina"
                value={linkForm.url}
                onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use "/" para links internos. Páginas do Page Builder usam "/p/slug"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkSubmit}>
              {editingLink ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar/editar Sublink */}
      <Dialog open={sublinkDialogOpen} onOpenChange={setSublinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSublink ? "Editar Sublink" : "Novo Sublink"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Texto do Sublink</Label>
              <Input
                placeholder="Ex: Câmeras de Segurança"
                value={sublinkForm.label}
                onChange={(e) => setSublinkForm(prev => ({ ...prev, label: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                placeholder="Ex: /totens?categoria=cameras"
                value={sublinkForm.url}
                onChange={(e) => setSublinkForm(prev => ({ ...prev, url: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSublinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSublinkSubmit}>
              {editingSublink ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar páginas rapidamente */}
      <Dialog open={quickAddDialogOpen} onOpenChange={setQuickAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Página do Page Builder</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-y-auto">
            {availablePages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma página publicada</p>
                <p className="text-sm">Crie páginas no Visual Builder e publique-as</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availablePages.map(page => (
                  <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{page.title}</p>
                      <p className="text-sm text-gray-500">/p/{page.slug}</p>
                    </div>
                    <Button size="sm" onClick={() => { addPageAsLink(page); setQuickAddDialogOpen(false); }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavbarManager;
