import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, User, Key, Package, TrendingUp } from "lucide-react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import MyOrders from "./MyOrders";
import MyProfile from "./MyProfile";
import ChangePassword from "./ChangePassword";

const CustomerAccount = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API}/customer/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('customer_token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    toast.success('Logout realizado com sucesso');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
          <p className="text-gray-600">Olá, {user?.name}!</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Link to="/minha-conta?tab=pedidos">
                    <Button variant="ghost" className="w-full justify-start">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Meus Pedidos
                    </Button>
                  </Link>
                  <Link to="/minha-conta?tab=perfil">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      Dados Pessoais
                    </Button>
                  </Link>
                  <Link to="/minha-conta?tab=senha">
                    <Button variant="ghost" className="w-full justify-start">
                      <Key className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="pedidos" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="pedidos">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Meus Pedidos
                </TabsTrigger>
                <TabsTrigger value="perfil">
                  <User className="w-4 h-4 mr-2" />
                  Dados Pessoais
                </TabsTrigger>
                <TabsTrigger value="senha">
                  <Key className="w-4 h-4 mr-2" />
                  Alterar Senha
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pedidos">
                <MyOrders />
              </TabsContent>

              <TabsContent value="perfil">
                <MyProfile user={user} onUpdate={(updated) => setUser(updated)} />
              </TabsContent>

              <TabsContent value="senha">
                <ChangePassword />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAccount;