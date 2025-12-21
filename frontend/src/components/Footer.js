import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [siteRes, footerRes] = await Promise.all([
        axios.get(`${API}/site-settings`),
        axios.get(`${API}/footer-settings`)
      ]);
      setSiteSettings(siteRes.data);
      setFooterSettings(footerRes.data);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

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
              Soluções inteligentes em segurança eletrônica: câmeras, controle de acesso e totens de monitoramento.
            </p>
            {siteSettings.contact_email && (
              <p className="text-gray-400 mt-2">Email: {siteSettings.contact_email}</p>
            )}
            {siteSettings.contact_phone && (
              <p className="text-gray-400">Tel: {siteSettings.contact_phone}</p>
            )}
          </div>

          {/* Quick Links */}
          <div data-testid="footer-links">
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/produtos" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Produtos
                </Link>
              </li>
              <li>
                <Link to="/totens" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Totens
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div data-testid="footer-products">
            <h3 className="text-lg font-semibold mb-4">Produtos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/produtos?category=cameras" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Câmeras de Vigilância
                </Link>
              </li>
              <li>
                <Link to="/produtos?category=controle-acesso" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Controle de Acesso
                </Link>
              </li>
              <li>
                <Link to="/produtos?category=fechaduras" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Fechaduras Inteligentes
                </Link>
              </li>
              <li>
                <Link to="/totens" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Totens de Monitoramento
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div data-testid="footer-contact">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-gray-400">
              <li>(11) 9999-9999</li>
              <li>contato@vigiloc.com.br</li>
              <li>Av. Paulista, 1000<br />São Paulo, SP</li>
            </ul>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors" data-testid="facebook-link">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors" data-testid="instagram-link">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors" data-testid="linkedin-link">
                <Linkedin className="h-6 w-6" />
              </a>
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