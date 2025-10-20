import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
        toast.error("Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleWhatsAppContact = () => {
    const message = `Olá! Tenho interesse no produto: ${product.name}`;
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleAddToCart = async () => {
    try {
      const sessionId = localStorage.getItem("cart_session_id") || generateSessionId();
      await axios.post(`${API}/cart/add?session_id=${sessionId}`, {
        product_id: product.id,
        quantity: 1,
        price: product.price
      });
      toast.success("Produto adicionado ao carrinho!");
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
    }
  };

  const generateSessionId = () => {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("cart_session_id", id);
    return id;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="product-not-found">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
          <Link to="/produtos">
            <Button>Voltar para Produtos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page py-16 bg-gray-50 min-h-screen" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/produtos">
          <Button variant="ghost" className="mb-6" data-testid="back-to-products-btn">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Produtos
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" data-testid="product-image-container">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Product Info */}
          <div data-testid="product-info-container">
            <span className="category-badge mb-4">{product.category}</span>
            <h1 className="text-4xl font-bold text-gray-900 mt-4 mb-4" data-testid="product-name">{product.name}</h1>
            <p className="text-3xl font-bold text-blue-600 mb-6" data-testid="product-price">R$ {product.price.toFixed(2)}</p>
            
            <p className="text-lg text-gray-700 mb-8" data-testid="product-description">{product.description}</p>

            {/* Features */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Características</h3>
                <ul className="space-y-3" data-testid="product-features">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start" data-testid={`feature-${index}`}>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Stock Status */}
            {product.inStock ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" data-testid="in-stock-message">
                <p className="text-green-800 font-semibold flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Produto disponível em estoque
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="out-of-stock-message">
                <p className="text-red-800 font-semibold">Produto fora de estoque</p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-4">
              <Button
                data-testid="add-to-cart-btn"
                onClick={handleAddToCart}
                size="lg"
                className="w-full btn-primary text-lg py-6"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
              <Button
                data-testid="whatsapp-contact-btn"
                onClick={handleWhatsAppContact}
                size="lg"
                variant="outline"
                className="w-full text-lg py-6"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Consultar via WhatsApp
              </Button>
              <Link to="/contato">
                <Button
                  data-testid="request-quote-btn"
                  size="lg"
                  variant="outline"
                  className="w-full text-lg py-6"
                >
                  Solicitar Orçamento
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;