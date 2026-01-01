import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Key, Shield, User, Globe, Upload, TrendingUp, Code, CreditCard, Truck, ShoppingCart, Link2, GripVertical, ExternalLink, MoveUp, MoveDown } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import TrackingManager from "./TrackingManager";
import SEOManager from "./SEOManager";
import PaymentSettings from "./PaymentSettings";
import ShippingIntegration from "./ShippingIntegration";

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [changeOwnPasswordOpen, setChangeOwnPasswordOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [siteSettings, setSiteSettings] = useState({
    site_name: "VigiLoc",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    whatsapp_number: "",
    address: "",
    enable_cart_globally: false
  });
  
  const [footerSettings, setFooterSettings] = useState({
    about_text: "",
    contact_email: "",
    contact_phone: "",
    whatsapp_number: "",
    address: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: "",
    twitter_url: "",
    tiktok_url: "",
    quick_links: [],
    services_links: [],
    custom_sections: [],
    copyright_text: "",
    copyright_year: "2026",
    show_powered_by: false
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkSection, setLinkSection] = useState("quick_links");
  const [linkFormData, setLinkFormData] = useState({ label: "", url: "", newTab: false });
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
    is_admin: false,
    active: true
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [adminPasswordData, setAdminPasswordData] = useState({
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchSiteSettings();
    fetchFooterSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      toast.error("Erro ao carregar configurações do site");
    }
  };

  const fetchFooterSettings = async () => {
    try {
      const response = await axios.get(`${API}/footer-settings`);
      setFooterSettings(response.data);
    } catch (error) {
      toast.error("Erro ao carregar configurações do footer");
    }
  };

  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/site-settings`, siteSettings);
      toast.success("Configurações do site atualizadas!");
      // Reload page to show new logo
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };


  const handleSaveFooterSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/footer-settings`, footerSettings);
      toast.success("Configurações do footer atualizadas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações do footer");
    }
  };


  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingLogo(true);
      const response = await axios.post(`${API}/admin/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const logoUrl = response.data.file_url;
      setSiteSettings({...siteSettings, logo_url: logoUrl});
      toast.success("Logo enviado! Clique em Salvar para aplicar");
    } catch (error) {
      toast.error("Erro ao fazer upload do logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`${API}/admin/users/${editingUser.id}`, formData);
        toast.success("Usuário atualizado com sucesso");
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error("Senha deve ter no mínimo 6 caracteres");
          return;
        }
        await axios.post(`${API}/admin/users`, formData);
        toast.success("Usuário criado com sucesso");
      }
      setOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao salvar usuário");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      is_admin: user.is_admin,
      active: user.active
    });
    setOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success("Usuário deletado com sucesso");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao deletar usuário");
    }
  };

  const handleAdminChangePassword = async (e) => {
    e.preventDefault();
    if (adminPasswordData.new_password !== adminPasswordData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (adminPasswordData.new_password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      await axios.post(`${API}/admin/users/${selectedUser.id}/change-password`, {
        new_password: adminPasswordData.new_password
      });
      toast.success("Senha alterada com sucesso");
      setPasswordDialogOpen(false);
      setAdminPasswordData({ new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error("Erro ao alterar senha");
    }
  };

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error("Nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast.success("Senha alterada com sucesso! Faça login novamente.");
      setChangeOwnPasswordOpen(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erro ao alterar senha");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "viewer",
      is_admin: false,
      active: true
    });
    setEditingUser(null);
  };

  const openPasswordDialog = (user) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrador",
      manager: "Gerente",
      editor: "Editor",
      viewer: "Visualizador"
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      editor: "bg-green-100 text-green-800",
      viewer: "bg-gray-100 text-gray-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList>
          <TabsTrigger value="site">
            <Globe className="w-4 h-4 mr-2" />
            Site
          </TabsTrigger>
          <TabsTrigger value="footer">
            <Globe className="w-4 h-4 mr-2" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="footer-links">
            <Link2 className="w-4 h-4 mr-2" />
            Links Footer
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="w-4 h-4 mr-2" />
            Frete
          </TabsTrigger>
          <TabsTrigger value="tracking">
            <Code className="w-4 h-4 mr-2" />
            Tracking
          </TabsTrigger>
          <TabsTrigger value="seo">
            <TrendingUp className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="users">
            <User className="w-4 h-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Key className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Configurações do Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSiteSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo do Site</label>
                  {siteSettings.logo_url && (
                    <div className="mb-4">
                      <img src={siteSettings.logo_url} alt="Logo atual" className="h-20 w-auto border rounded p-2" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button type="button" variant="outline" disabled={uploadingLogo} onClick={() => document.getElementById('logo-upload').click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingLogo ? "Enviando..." : "Fazer Upload do Logo"}
                      </Button>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Recomendado: PNG transparente, 200x60px</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Site</label>
                  <Input
                    value={siteSettings.site_name}
                    onChange={(e) => setSiteSettings({...siteSettings, site_name: e.target.value})}
                    placeholder="VigiLoc"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email de Contato</label>
                    <Input
                      type="email"
                      value={siteSettings.contact_email}
                      onChange={(e) => setSiteSettings({...siteSettings, contact_email: e.target.value})}
                      placeholder="contato@vigiloc.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone</label>
                    <Input
                      value={siteSettings.contact_phone}
                      onChange={(e) => setSiteSettings({...siteSettings, contact_phone: e.target.value})}
                      placeholder="(11) 98888-8888"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp (com código do país)</label>
                  <Input
                    value={siteSettings.whatsapp_number}
                    onChange={(e) => setSiteSettings({...siteSettings, whatsapp_number: e.target.value})}
                    placeholder="5511988888888"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Endereço</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    value={siteSettings.address}
                    onChange={(e) => setSiteSettings({...siteSettings, address: e.target.value})}
                    placeholder="Rua, Número, Bairro, Cidade - Estado"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-orange-600" />
                      <div>
                        <Label htmlFor="enable_cart_globally" className="font-semibold">
                          Habilitar Carrinho Globalmente
                        </Label>
                        <p className="text-sm text-gray-600">
                          Ativa carrinho para TODOS os produtos (pode sobrescrever por produto)
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="enable_cart_globally"
                      checked={siteSettings.enable_cart_globally}
                      onCheckedChange={(checked) => 
                        setSiteSettings({...siteSettings, enable_cart_globally: checked})
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Se desabilitado, priorizará venda consultiva via WhatsApp. Configure individualmente em cada produto.
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Salvar Configurações do Site
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Usuários do Sistema</CardTitle>
                <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 w-4 h-4" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          disabled={!!editingUser}
                        />
                      </div>

                      {!editingUser && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Senha *</label>
                          <Input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2">Nível de Acesso *</label>
                        <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Visualizador - Apenas leitura</SelectItem>
                            <SelectItem value="editor">Editor - Pode editar conteúdo</SelectItem>
                            <SelectItem value="manager">Gerente - Gestão completa exceto usuários</SelectItem>
                            <SelectItem value="admin">Administrador - Acesso total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_admin"
                          checked={formData.is_admin}
                          onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <label htmlFor="is_admin" className="text-sm font-medium">
                          <Shield className="inline w-4 h-4 mr-1" />
                          Acesso Admin Total
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="active"
                          checked={formData.active}
                          onChange={(e) => setFormData({...formData, active: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <label htmlFor="active" className="text-sm font-medium">Usuário Ativo</label>
                      </div>

                      <Button type="submit" className="w-full">
                        {editingUser ? "Atualizar" : "Criar"} Usuário
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.is_admin && (
                          <Badge className="ml-2 bg-red-100 text-red-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={user.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="icon" variant="outline" onClick={() => openPasswordDialog(user)} title="Alterar senha">
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => handleEdit(user)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => handleDelete(user.id)}>
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
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFooterSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Texto Sobre a Empresa</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    value={footerSettings.about_text}
                    onChange={(e) => setFooterSettings({...footerSettings, about_text: e.target.value})}
                    placeholder="Breve descrição da empresa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email de Contato</label>
                    <Input
                      type="email"
                      value={footerSettings.contact_email}
                      onChange={(e) => setFooterSettings({...footerSettings, contact_email: e.target.value})}
                      placeholder="contato@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone</label>
                    <Input
                      value={footerSettings.contact_phone}
                      onChange={(e) => setFooterSettings({...footerSettings, contact_phone: e.target.value})}
                      placeholder="(11) 1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">WhatsApp (com código do país)</label>
                  <Input
                    value={footerSettings.whatsapp_number}
                    onChange={(e) => setFooterSettings({...footerSettings, whatsapp_number: e.target.value})}
                    placeholder="5511999999999"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: código do país + DDD + número (ex: 5511999999999)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Endereço Completo</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="2"
                    value={footerSettings.address}
                    onChange={(e) => setFooterSettings({...footerSettings, address: e.target.value})}
                    placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Redes Sociais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Facebook (URL completa)</label>
                      <Input
                        value={footerSettings.facebook_url}
                        onChange={(e) => setFooterSettings({...footerSettings, facebook_url: e.target.value})}
                        placeholder="https://facebook.com/suapagina"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Instagram (URL completa)</label>
                      <Input
                        value={footerSettings.instagram_url}
                        onChange={(e) => setFooterSettings({...footerSettings, instagram_url: e.target.value})}
                        placeholder="https://instagram.com/seuperfil"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">LinkedIn (URL completa)</label>
                      <Input
                        value={footerSettings.linkedin_url}
                        onChange={(e) => setFooterSettings({...footerSettings, linkedin_url: e.target.value})}
                        placeholder="https://linkedin.com/company/suaempresa"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Salvar Configurações do Footer
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="shipping">
          <ShippingIntegration />
        </TabsContent>

        <TabsContent value="tracking">
          <TrackingManager />
        </TabsContent>

        <TabsContent value="seo">
          <SEOManager />
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-2">Alterar Minha Senha</p>
                <Dialog open={changeOwnPasswordOpen} onOpenChange={setChangeOwnPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Key className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Minha Senha</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangeOwnPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Senha Atual *</label>
                        <Input
                          type="password"
                          required
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Nova Senha *</label>
                        <Input
                          type="password"
                          required
                          minLength={6}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Confirmar Nova Senha *</label>
                        <Input
                          type="password"
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full">Alterar Senha</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha de {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nova Senha *</label>
              <Input
                type="password"
                required
                minLength={6}
                value={adminPasswordData.new_password}
                onChange={(e) => setAdminPasswordData({...adminPasswordData, new_password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Nova Senha *</label>
              <Input
                type="password"
                required
                value={adminPasswordData.confirm_password}
                onChange={(e) => setAdminPasswordData({...adminPasswordData, confirm_password: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full">Alterar Senha</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
