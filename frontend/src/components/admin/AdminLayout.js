import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Truck, FolderOpen, FileText, MessageSquare, LogOut, Users, Settings } from "lucide-react";
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

  const menuItems = [
    { path: "/admin", icon: <LayoutDashboard />, label: "Dashboard", exact: true },
    { path: "/admin/products", icon: <Package />, label: "Produtos" },
    { path: "/admin/categories", icon: <FolderOpen />, label: "Categorias" },
    { path: "/admin/orders", icon: <ShoppingCart />, label: "Pedidos" },
    { path: "/admin/shipping", icon: <Truck />, label: "Frete" },
    { path: "/admin/banners", icon: <FileText />, label: "Banners" },
    { path: "/admin/coupons", icon: <FileText />, label: "Cupons" },
    { path: "/admin/content", icon: <FileText />, label: "Conteúdo" },
    { path: "/admin/contacts", icon: <MessageSquare />, label: "Contatos" },
  ];

  const crmMenuItems = [
    { path: "/admin/crm", icon: <Users />, label: "CRM Dashboard" },
    { path: "/admin/crm/customers", icon: <Users />, label: "Clientes" },
    { path: "/admin/crm/contracts", icon: <FileText />, label: "Contratos" },
    { path: "/admin/crm/equipment", icon: <Package />, label: "Equipamentos" },
    { path: "/admin/crm/payments", icon: <ShoppingCart />, label: "Pagamentos" },
    { path: "/admin/crm/tickets", icon: <MessageSquare />, label: "Chamados" },
    { path: "/admin/crm/notifications", icon: <MessageSquare />, label: "Notificações" },
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