import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API } from "@/App";
import VigiLocLogo from "./VigiLocLogo";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ site_name: "VigiLoc", logo_url: null, use_animated_logo: true });
  const [navbarSettings, setNavbarSettings] = useState({ links: [], background_color: "#FFFFFF", text_color: "#1F2937" });
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchSiteSettings();
    fetchNavbarSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/site-settings`);
      setSiteSettings(response.data);
    } catch (error) {
      console.error("Erro ao carregar configurações do site");
    }
  };

  const fetchNavbarSettings = async () => {
    try {
      const response = await axios.get(`${API}/navbar-settings`);
      setNavbarSettings(response.data);
    } catch (error) {
      console.error("Erro ao carregar configurações da navbar");
    }
  };

  const isActive = (path) => location.pathname === path;

  // Default links if none configured
  const defaultLinks = [
    { path: "/", label: "Início" },
    { path: "/produtos", label: "Produtos" },
    { path: "/totens", label: "Totens" },
    { path: "/contato", label: "Contato" }
  ];

  // Use configured links or defaults
  const navLinks = navbarSettings.links && navbarSettings.links.length > 0 
    ? navbarSettings.links.map(link => ({
        path: link.url,
        label: link.label,
        sublinks: link.sublinks || []
      }))
    : defaultLinks;

  // Render logo based on settings
  const renderLogo = () => {
    // If custom logo URL is set, use it
    if (siteSettings.logo_url && siteSettings.logo_url.trim() !== '') {
      return (
        <img 
          src={siteSettings.logo_url} 
          alt={siteSettings.site_name} 
          className="h-12 w-auto object-contain"
        />
      );
    }
    
    // Use animated logo
    return (
      <VigiLocLogo 
        size={44} 
        variant="header" 
        showText={true}
        textColor="#111827"
      />
    );
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
            {renderLogo()}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <div key={link.path || index} className="relative group">
                {link.sublinks && link.sublinks.length > 0 ? (
                  // Link with dropdown
                  <div 
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(index)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 text-lg font-medium transition-colors cursor-default ${
                        isActive(link.path)
                          ? "text-blue-600"
                          : "text-gray-700 hover:text-blue-600"
                      }`}
                      style={{ color: navbarSettings.text_color }}
                    >
                      {link.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {openDropdown === index && (
                      <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg border py-2 min-w-[200px] z-50">
                        <Link
                          to={link.path}
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-default"
                        >
                          {link.label}
                        </Link>
                        <div className="border-t my-1"></div>
                        {link.sublinks.map((sublink, subIndex) => (
                          <Link
                            key={sublink.id || subIndex}
                            to={sublink.url}
                            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-default"
                          >
                            {sublink.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Simple link without dropdown
                  <Link
                    to={link.path}
                    data-testid={`nav-link-${link.label.toLowerCase()}`}
                    className={`text-lg font-medium transition-colors cursor-default ${
                      isActive(link.path)
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                    style={{ color: navbarSettings.text_color }}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <Link to="/carrinho">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-6 w-6" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">
                Minha Conta
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
                className={`block py-2 text-lg font-medium cursor-default ${
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
              className="w-full mt-4 btn-primary cursor-default"
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