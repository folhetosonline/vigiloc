import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API } from "@/App";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ site_name: "VigiLoc", logo_url: null });
  const location = useLocation();

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      console.error("Erro ao carregar configurações do site");
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Início" },
    { path: "/produtos", label: "Produtos" },
    { path: "/totens", label: "Totens" },
    { path: "/contato", label: "Contato" }
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
            {siteSettings.logo_url ? (
              <img 
                src={siteSettings.logo_url.startsWith('http') ? siteSettings.logo_url : `${API}${siteSettings.logo_url}`} 
                alt={siteSettings.site_name} 
                className="h-12 w-auto object-contain" 
              />
            ) : (
              <div className="vigiloc-logo" aria-label={siteSettings.site_name}>
                <span className="vigiloc-v">V</span>
              </div>
            )}
            <span className="text-2xl font-bold text-gray-900">{siteSettings.site_name}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className={`text-lg font-medium transition-colors ${
                  isActive(link.path)
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/carrinho">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-6 w-6" />
              </Button>
            </Link>
            <Button
              data-testid="nav-whatsapp-btn"
              onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
              className="btn-primary"
            >
              WhatsApp
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            data-testid="mobile-menu-btn"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4" data-testid="mobile-menu">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                className={`block py-2 text-lg font-medium ${
                  isActive(link.path) ? "text-blue-600" : "text-gray-700"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button
              data-testid="mobile-whatsapp-btn"
              onClick={() => {
                window.open("https://wa.me/5511999999999", "_blank");
                setIsOpen(false);
              }}
              className="w-full mt-4 btn-primary"
            >
              WhatsApp
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;