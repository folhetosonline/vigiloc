import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";

const Footer = () => {
  const [siteSettings, setSiteSettings] = useState({ 
    site_name: "VigiLoc", 
    logo_url: null,
    contact_email: "",
    contact_phone: "",
    address: ""
  });
  const [footerSettings, setFooterSettings] = useState({
    about_text: "Referência em segurança eletrônica: câmeras, controle de acesso e totens de monitoramento.",
    contact_email: "",
    contact_phone: "",
    whatsapp_number: "",
    address: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: ""
  });
  const [navbarLinks, setNavbarLinks] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [siteRes, footerRes, navbarRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/site-settings`),
        axios.get(`${API}/footer-settings`),
        axios.get(`${API}/navbar-settings`),
        axios.get(`${API}/categories`)
      ]);
      setSiteSettings(siteRes.data);
      setFooterSettings(footerRes.data);
      setNavbarLinks(navbarRes.data.links || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  // Default links if none configured
  const defaultLinks = [
    { label: "Início", url: "/" },
    { label: "Produtos", url: "/produtos" },
    { label: "Totens", url: "/totens" },
    { label: "Contato", url: "/contato" }
  ];

  const quickLinks = navbarLinks.length > 0 
    ? navbarLinks.map(l => ({ label: l.label, url: l.url }))
    : defaultLinks;

  return (
    <footer className="bg-gray-900 text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div data-testid="footer-brand">
            <div className="flex items-center space-x-2 mb-4">
              {siteSettings.logo_url && siteSettings.logo_url.trim() !== '' ? (
                <img 
                  src={siteSettings.logo_url} 
                  alt={siteSettings.site_name} 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="vigiloc-logo-footer" 
                aria-label={siteSettings.site_name}
                style={{ display: siteSettings.logo_url && siteSettings.logo_url.trim() !== '' ? 'none' : 'flex' }}
              >
                <span className="vigiloc-v-footer">V</span>
              </div>
              <span className="text-2xl font-bold">{siteSettings.site_name}</span>
            </div>
            <p className="text-gray-400">
              {footerSettings.about_text}
            </p>
            {footerSettings.contact_email && (
              <p className="text-gray-400 mt-2">Email: {footerSettings.contact_email}</p>
            )}
            {footerSettings.contact_phone && (
              <p className="text-gray-400">Tel: {footerSettings.contact_phone}</p>
            )}
          </div>

          {/* Quick Links - Dynamic from Navbar */}
          <div data-testid="footer-links">
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.url} className="text-gray-400 hover:text-blue-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services/Categories - Dynamic */}
          <div data-testid="footer-products">
            <h3 className="text-lg font-semibold mb-4">Serviços</h3>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.slice(0, 5).map((cat, index) => (
                  <li key={index}>
                    <Link 
                      to={`/totens?categoria=${cat.slug}`} 
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/totens" className="text-gray-400 hover:text-blue-400 transition-colors">
                      Totens de Monitoramento
                    </Link>
                  </li>
                  <li>
                    <Link to="/produtos" className="text-gray-400 hover:text-blue-400 transition-colors">
                      Produtos
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div data-testid="footer-contact">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-gray-400">
              {footerSettings.contact_phone && <li>{footerSettings.contact_phone}</li>}
              {footerSettings.contact_email && <li>{footerSettings.contact_email}</li>}
              {footerSettings.address && <li dangerouslySetInnerHTML={{ __html: footerSettings.address.replace(/\n/g, '<br />') }} />}
            </ul>
            <div className="flex space-x-4 mt-4">
              {footerSettings.whatsapp_number && (
                <a href={`https://wa.me/${footerSettings.whatsapp_number.replace(/\D/g, '')}`} className="text-gray-400 hover:text-green-400 transition-colors" data-testid="whatsapp-link" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-6 w-6" />
                </a>
              )}
              {footerSettings.facebook_url && (
                <a href={footerSettings.facebook_url} className="text-gray-400 hover:text-blue-400 transition-colors" data-testid="facebook-link" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {footerSettings.instagram_url && (
                <a href={footerSettings.instagram_url} className="text-gray-400 hover:text-blue-400 transition-colors" data-testid="instagram-link" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {footerSettings.linkedin_url && (
                <a href={footerSettings.linkedin_url} className="text-gray-400 hover:text-blue-400 transition-colors" data-testid="linkedin-link" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400" data-testid="footer-copyright">
          <p>&copy; 2025 VigiLoc. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;