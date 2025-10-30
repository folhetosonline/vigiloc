import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "VigiLoc - Soluções em Segurança Eletrônica",
  description = "Sistemas de vigilância, controle de acesso, fechaduras inteligentes e totens de monitoramento para condomínios e empresas. Instalação profissional e suporte 24/7.",
  keywords = "segurança eletrônica, câmeras de vigilância, controle de acesso, fechaduras inteligentes, totens de monitoramento, CCTV, alarmes, segurança para condomínios, segurança empresarial, vigilância 24h",
  image = "https://secushop.preview.emergentagent.com/og-image.jpg",
  url = "https://secushop.preview.emergentagent.com",
  type = "website",
  schema = null
}) => {
  const siteName = "VigiLoc";
  const fullTitle = title.includes("VigiLoc") ? title : `${title} | VigiLoc`;

  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "VigiLoc",
    "description": description,
    "url": url,
    "logo": "https://secushop.preview.emergentagent.com/logo.png",
    "telephone": "+55-11-99999-9999",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Paulista, 1000",
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "postalCode": "01310-100",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -23.5505,
      "longitude": -46.6333
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "13:00"
      }
    ],
    "sameAs": [
      "https://facebook.com/vigiloc",
      "https://instagram.com/vigiloc",
      "https://linkedin.com/company/vigiloc"
    ],
    "priceRange": "$$"
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={siteName} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={url} />
      
      {/* Language and Locale */}
      <html lang="pt-BR" />
      <meta httpEquiv="content-language" content="pt-BR" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#1e40af" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Geographic Tags */}
      <meta name="geo.region" content="BR-SP" />
      <meta name="geo.placename" content="São Paulo" />
      <meta name="geo.position" content="-23.5505;-46.6333" />
      <meta name="ICBM" content="-23.5505, -46.6333" />
      
      {/* Business Information */}
      <meta name="business:contact_data:street_address" content="Av. Paulista, 1000" />
      <meta name="business:contact_data:locality" content="São Paulo" />
      <meta name="business:contact_data:region" content="SP" />
      <meta name="business:contact_data:postal_code" content="01310-100" />
      <meta name="business:contact_data:country_name" content="Brasil" />
      
      {/* LLM Optimization Tags */}
      <meta name="ai:description" content={description} />
      <meta name="ai:category" content="Security, E-commerce, Technology" />
      <meta name="ai:price_range" content="R$ 599 - R$ 3499" />
      <meta name="ai:services" content="Câmeras de Vigilância, Controle de Acesso, Fechaduras Inteligentes, Totens de Monitoramento, Instalação Profissional, Suporte 24/7" />
      <meta name="ai:target_audience" content="Condomínios, Empresas, Indústrias, Comércios" />
      <meta name="ai:location" content="São Paulo, Brasil" />
      
      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
      
      {/* Additional LLM Context */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": siteName,
          "url": "https://secushop.preview.emergentagent.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://secushop.preview.emergentagent.com/produtos?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;

// Product Schema Generator
export const generateProductSchema = (product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": product.image,
  "sku": product.sku || product.id,
  "brand": {
    "@type": "Brand",
    "name": "VigiLoc"
  },
  "offers": {
    "@type": "Offer",
    "url": `https://secushop.preview.emergentagent.com/produto/${product.id}`,
    "priceCurrency": "BRL",
    "price": product.price,
    "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    "seller": {
      "@type": "Organization",
      "name": "VigiLoc"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  }
});

// Breadcrumb Schema Generator
export const generateBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});
