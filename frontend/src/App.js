import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import axios from "axios";

// Public pages
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Totens from "@/pages/Totens";
import Contact from "@/pages/Contact";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminShipping from "@/pages/admin/Shipping";
import AdminCategories from "@/pages/admin/Categories";
import AdminContent from "@/pages/admin/Content";
import AdminContacts from "@/pages/admin/Contacts";
import AdminBanners from "@/pages/admin/Banners";
import AdminCoupons from "@/pages/admin/Coupons";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AdminLayout from "@/components/admin/AdminLayout";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

// Auth Context
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    setUser(null);
  };

  return { user, loading, login, logout, checkAuth };
};

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return user && user.is_admin ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <HelmetProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<><Navbar /><Home /><Footer /><WhatsAppButton /></>} />
            <Route path="/produtos" element={<><Navbar /><Products /><Footer /><WhatsAppButton /></>} />
            <Route path="/produto/:id" element={<><Navbar /><ProductDetail /><Footer /><WhatsAppButton /></>} />
            <Route path="/totens" element={<><Navbar /><Totens /><Footer /><WhatsAppButton /></>} />
            <Route path="/contato" element={<><Navbar /><Contact /><Footer /><WhatsAppButton /></>} />
            <Route path="/carrinho" element={<><Navbar /><Cart /><Footer /><WhatsAppButton /></>} />
            <Route path="/checkout" element={<><Navbar /><Checkout /><Footer /><WhatsAppButton /></>} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

export default App;