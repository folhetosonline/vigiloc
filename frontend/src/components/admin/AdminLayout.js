import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, ShoppingCart, Truck, FolderOpen, FileText, 
  MessageSquare, LogOut, Users, Settings, Eye, Image, Ticket, 
  DollarSign, Wrench, Bell, ClipboardList, Building2, BoxIcon, Layout, Palette, Menu, BarChart3, Briefcase, Star, Search, FileCode, Sparkles, Phone, MessageCircle, Calendar, Gift, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      toast.success("Logout realizado com sucesso");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const handlePreview = () => {
    window.open("/", "_blank");
  };

  const menuItems = [
    { path: "/admin", icon: <LayoutDashboard />, label: "Dashboard", exact: true },
    { path: "/admin/services", icon: <Briefcase />, label: "Serviços" },
    { path: "/admin/categories", icon: <FolderOpen />, label: "Categorias" },
    { path: "/admin/reviews", icon: <Star />, label: "Avaliações ⭐" },
    { path: "/admin/orders", icon: <ShoppingCart />, label: "Pedidos" },
    { path: "/admin/banners", icon: <Image />, label: "Banners 🎬" },
    { path: "/admin/templates", icon: <Gift />, label: "Sazonalidade 🎄" },
    { path: "/admin/contacts", icon: <MessageSquare />, label: "Mensagens" },
    { path: "/admin/contact-page", icon: <Phone />, label: "Contato" },
    { path: "/admin/page-builder", icon: <Layout />, label: "Páginas" },
    { path: "/admin/visual-builder", icon: <Layout />, label: "Visual Builder ✨" },
    { path: "/admin/navbar", icon: <Menu />, label: "Menu Navegação" },
    { path: "/admin/logo", icon: <Sparkles />, label: "Logo 👁️" },
    { path: "/admin/theme-customizer", icon: <Palette />, label: "Tema" },
    { path: "/admin/seo", icon: <Search />, label: "SEO & Integração 🔍" },
    { path: "/admin/seo/files", icon: <FileCode />, label: "Arquivos SEO 📂" },
    { path: "/admin/reports", icon: <BarChart3 />, label: "Relatórios" },
    { path: "/admin/settings", icon: <Settings />, label: "Configurações" },
    { path: "/admin/help", icon: <HelpCircle />, label: "Ajuda 📚" },
  ];

  const crmMenuItems = [
    { path: "/admin/crm", icon: <Building2 />, label: "CRM Dashboard" },
    { path: "/admin/crm/customers", icon: <Users />, label: "Clientes" },
    { path: "/admin/crm/contracts", icon: <ClipboardList />, label: "Contratos" },
    { path: "/admin/crm/equipment", icon: <BoxIcon />, label: "Equipamentos" },
    { path: "/admin/crm/payments", icon: <DollarSign />, label: "Pagamentos" },
    { path: "/admin/crm/tickets", icon: <Wrench />, label: "Chamados" },
    { path: "/admin/crm/notifications", icon: <MessageCircle className="text-green-500" />, label: "Notificações 💬" },
    { path: "/admin/crm/settings", icon: <Settings />, label: "Configurações" },
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Admin VigiLoc</h1>
        </div>
        
        {/* Preview Button */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <Button 
            onClick={handlePreview} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Site Público
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">E-commerce</p>
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path, item.exact) ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">CRM/ERP</p>
            {crmMenuItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className="w-full justify-start mb-1"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 w-4 h-4" />
            Sair
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;