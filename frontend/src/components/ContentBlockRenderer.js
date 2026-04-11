import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { 
  MessageCircle, 
  ArrowRight, 
  ChevronRight,
  Play,
  Star,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

/**
 * ContentBlockRenderer - Renders content blocks created in the Page Builder
 * This component is used to display dynamic content on system and custom pages
 */

// Hero Block Component
const HeroBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  
  return (
    <div 
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: content.background_url ? `url(${content.background_url})` : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        {content.title && (
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {content.title}
          </h1>
        )}
        {content.subtitle && (
          <p className="text-lg md:text-xl mb-8 opacity-90">
            {content.subtitle}
          </p>
        )}
        {content.cta_text && content.cta_url && (
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = content.cta_url}
          >
            {content.cta_text}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Text Block Component
const TextBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  
  return (
    <div className={`py-16 ${settings.background === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto px-4">
        {content.title && (
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            {content.title}
          </h2>
        )}
        {content.html && (
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        )}
        {content.text && !content.html && (
          <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
            {content.text}
          </p>
        )}
      </div>
    </div>
  );
};

// Cards Block Component
const CardsBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  const cards = content.cards || [];
  
  return (
    <div className={`py-16 ${settings.background === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {content.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{content.title}</h2>
            {content.subtitle && (
              <p className="text-gray-600 mt-2">{content.subtitle}</p>
            )}
          </div>
        )}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(cards.length, 4)} gap-6`}>
          {cards.map((card, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              {card.image && (
                <img 
                  src={card.image} 
                  alt={card.title} 
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <CardContent className="p-6">
                {card.icon && (
                  <div className="text-4xl mb-4">{card.icon}</div>
                )}
                {card.title && (
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                )}
                {card.description && (
                  <p className="text-gray-600">{card.description}</p>
                )}
                {card.link && (
                  <Link to={card.link} className="text-blue-600 mt-4 inline-flex items-center">
                    Saiba mais <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Banner Block Component
const BannerBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  
  return (
    <div 
      className="relative py-20 bg-cover bg-center"
      style={{
        backgroundImage: content.image_url ? `url(${content.image_url})` : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
        {content.title && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
        )}
        {content.text && (
          <p className="text-lg mb-6 opacity-90">{content.text}</p>
        )}
        {content.button_text && content.button_url && (
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => window.location.href = content.button_url}
          >
            {content.button_text}
          </Button>
        )}
      </div>
    </div>
  );
};

// Media Block Component
const MediaBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  const media = content.media || [];
  
  return (
    <div className={`py-16 ${settings.background === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{content.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {media.map((item, index) => (
            <div key={index} className="rounded-lg overflow-hidden shadow-md">
              {item.type === 'video' ? (
                <video 
                  src={item.url} 
                  controls 
                  className="w-full h-64 object-cover"
                />
              ) : (
                <img 
                  src={item.url} 
                  alt={item.caption || ''} 
                  className="w-full h-64 object-cover"
                />
              )}
              {item.caption && (
                <p className="p-4 text-gray-600 text-sm">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Features Block Component
const FeaturesBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  const features = content.features || [];
  
  return (
    <div className={`py-16 ${settings.background === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {content.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{content.title}</h2>
            {content.subtitle && (
              <p className="text-gray-600 mt-2">{content.subtitle}</p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                {feature.icon ? (
                  <span className="text-2xl">{feature.icon}</span>
                ) : (
                  <Check className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// FAQ Block Component
const FAQBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  const faqs = content.items || [];
  const [openIndex, setOpenIndex] = useState(null);
  
  return (
    <div className={`py-16 ${settings.background === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto px-4">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{content.title}</h2>
        )}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left font-medium flex items-center justify-between hover:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {faq.question}
                <ChevronRight className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-90' : ''}`} />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Statistics Block Component
const StatsBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  const stats = content.stats || [];
  
  return (
    <div className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Gallery Block Component
const GalleryBlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  const images = content.images || [];
  
  return (
    <div className={`py-16 ${settings.background === 'gray' ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{content.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden">
              <img 
                src={image.url || image} 
                alt={image.alt || `Image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// CTA Block Component
const CTABlock = ({ block }) => {
  const { content = {}, settings = {} } = block;
  
  return (
    <div className={`py-16 ${settings.background === 'gradient' ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white' : 'bg-gray-900 text-white'}`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        {content.title && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
        )}
        {content.subtitle && (
          <p className="text-lg mb-8 opacity-90">{content.subtitle}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {content.primary_button_text && (
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => content.primary_button_url && (window.location.href = content.primary_button_url)}
            >
              {content.primary_button_text}
            </Button>
          )}
          {content.secondary_button_text && (
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => content.secondary_button_url && (window.location.href = content.secondary_button_url)}
            >
              {content.secondary_button_text}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Block Renderer
const renderBlock = (block) => {
  if (!block.published) return null;
  
  switch (block.type) {
    case 'hero':
      return <HeroBlock key={block.id} block={block} />;
    case 'text':
      return <TextBlock key={block.id} block={block} />;
    case 'card':
    case 'cards':
      return <CardsBlock key={block.id} block={block} />;
    case 'banner':
      return <BannerBlock key={block.id} block={block} />;
    case 'media':
      return <MediaBlock key={block.id} block={block} />;
    case 'features':
      return <FeaturesBlock key={block.id} block={block} />;
    case 'faq':
      return <FAQBlock key={block.id} block={block} />;
    case 'stats':
    case 'statistics':
      return <StatsBlock key={block.id} block={block} />;
    case 'gallery':
      return <GalleryBlock key={block.id} block={block} />;
    case 'cta':
      return <CTABlock key={block.id} block={block} />;
    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
};

// Content Block Renderer Component
const ContentBlockRenderer = ({ pageId, className = "" }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pageId) {
      fetchBlocks();
    }
  }, [pageId]);

  const fetchBlocks = async () => {
    try {
      const response = await axios.get(`${API}/content-blocks/${pageId}`);
      const sortedBlocks = response.data.sort((a, b) => a.order - b.order);
      setBlocks(sortedBlocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show loading state - let the page render its default content
  }

  if (blocks.length === 0) {
    return null; // No blocks to render
  }

  return (
    <div className={`content-blocks ${className}`}>
      {blocks.map(renderBlock)}
    </div>
  );
};

export default ContentBlockRenderer;
export { renderBlock, HeroBlock, TextBlock, CardsBlock, BannerBlock, MediaBlock, FeaturesBlock, FAQBlock, StatsBlock, GalleryBlock, CTABlock };
