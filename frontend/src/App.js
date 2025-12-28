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
import AdminForgotPassword from "@/pages/AdminForgotPassword";
import AdminResetPassword from "@/pages/AdminResetPassword";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerAccount from "@/pages/CustomerAccount";
import ForgotPassword from "@/pages/ForgotPassword";
import DynamicPage from "@/pages/DynamicPage";
import ServicePage from "@/pages/ServicePage";
import ServicesPage from "@/pages/ServicesPage";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import CreateOrder from "@/pages/admin/CreateOrder";
import AdminShipping from "@/pages/admin/Shipping";
import AdminCategories from "@/pages/admin/Categories";
import AdminContent from "@/pages/admin/Content";
import AdminContacts from "@/pages/admin/Contacts";
import AdminBanners from "@/pages/admin/Banners";
import AdminCoupons from "@/pages/admin/Coupons";
import PageBuilder from "@/pages/admin/PageBuilder";
import VisualPageBuilder from "@/pages/admin/VisualPageBuilder";
import ThemeCustomizer from "@/pages/admin/ThemeCustomizer";
import ContentBlockEditor from "@/pages/admin/ContentBlockEditor";
import NavbarCustomizer from "@/pages/admin/NavbarCustomizer";
import NavbarManager from "@/pages/admin/NavbarManager";
import Reports from "@/pages/admin/Reports";
import Services from "@/pages/admin/Services";
import SocialReviews from "@/pages/admin/SocialReviews";
import SEODashboard from "@/pages/admin/SEODashboard";
import SEOFilesManager from "@/pages/admin/SEOFilesManager";
import LogoManager from "@/pages/admin/LogoManager";

// CRM pages
import CRMDashboard from "@/pages/admin/crm/CRMDashboard";
import CRMCustomers from "@/pages/admin/crm/Customers";
import CRMContracts from "@/pages/admin/crm/Contracts";
import CRMEquipment from "@/pages/admin/crm/Equipment";
import CRMPayments from "@/pages/admin/crm/Payments";
import CRMTickets from "@/pages/admin/crm/Tickets";
import CRMNotifications from "@/pages/admin/crm/Notifications";
import CRMSettings from "@/pages/admin/crm/Settings";
import AdminSettings from "@/pages/admin/Settings";

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

  return user && user.is_admin ? children : <Navigate to="/painel-admin" />;
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
            
            {/* Customer Area */}
            <Route path="/login" element={<><Navbar /><CustomerLogin /><Footer /><WhatsAppButton /></>} />
            <Route path="/entrar-cliente" element={<><Navbar /><CustomerLogin /><Footer /><WhatsAppButton /></>} />
            <Route path="/recuperar-senha" element={<><Navbar /><ForgotPassword /><Footer /><WhatsAppButton /></>} />
            <Route path="/minha-conta" element={<><Navbar /><CustomerAccount /><Footer /><WhatsAppButton /></>} />
            
            {/* Service Pages */}
            <Route path="/servicos" element={<><Navbar /><ServicesPage /><Footer /><WhatsAppButton /></>} />
            <Route path="/servico/:slug" element={<><Navbar /><ServicePage /><Footer /><WhatsAppButton /></>} />
            
            {/* Admin Login - Secure URL */}
            <Route path="/painel-admin" element={<Login />} />
            <Route path="/admin/recuperar-senha" element={<AdminForgotPassword />} />
            <Route path="/admin/redefinir-senha" element={<AdminResetPassword />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/create" element={<CreateOrder />} />
              <Route path="shipping" element={<AdminShipping />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="services" element={<Services />} />
              <Route path="reviews" element={<SocialReviews />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="contacts" element={<AdminContacts />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="coupons" element={<AdminCoupons />} />
              
              {/* CRM Routes */}
              <Route path="crm" element={<CRMDashboard />} />
              <Route path="crm/customers" element={<CRMCustomers />} />
              <Route path="crm/contracts" element={<CRMContracts />} />
              <Route path="crm/equipment" element={<CRMEquipment />} />
              <Route path="crm/payments" element={<CRMPayments />} />
              <Route path="crm/tickets" element={<CRMTickets />} />
              <Route path="crm/notifications" element={<CRMNotifications />} />
              <Route path="crm/settings" element={<CRMSettings />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="navbar" element={<NavbarManager />} />
              
              {/* Shopify-like Features */}
              <Route path="page-builder" element={<PageBuilder />} />
              <Route path="visual-builder" element={<VisualPageBuilder />} />
              <Route path="page-editor/:pageId" element={<ContentBlockEditor />} />
              <Route path="theme-customizer" element={<ThemeCustomizer />} />
              <Route path="navbar-customizer" element={<NavbarCustomizer />} />
              <Route path="reports" element={<Reports />} />
              <Route path="seo" element={<SEODashboard />} />
              <Route path="seo/files" element={<SEOFilesManager />} />
              <Route path="logo" element={<LogoManager />} />
            </Route>

            {/* Dynamic Pages - Page Builder (Must be last to catch custom slugs) */}
            <Route path="/p/:slug" element={<><Navbar /><DynamicPage /><Footer /><WhatsAppButton /></>} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

export default App;