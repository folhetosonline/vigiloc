import { Helmet } from "react-helmet-async";

const SITE_DOMAIN = "https://www.vigiloc.com.br";
const SITE_NAME = "VigiLoc";

const SEO = ({
  title = "VigiLoc - Soluções em Automação e Segurança Eletrônica",
  description = "Líder em portaria autônoma, armários inteligentes, mini mercados autônomos e soluções de segurança eletrônica para condomínios e empresas. Atendimento 24/7 em São Paulo.",
  keywords = "portaria autônoma, armários inteligentes, mini mercados autônomos, lavanderia autônoma, segurança eletrônica, automação comercial, condomínios inteligentes, controle de acesso, totens de monitoramento, São Paulo",
  image = `${SITE_DOMAIN}/og-image.jpg`,
  url = SITE_DOMAIN,
  type = "website",
  schema = null,
  noindex = false
}) => {
  const fullTitle = title.includes("VigiLoc") ? title : `${title} | VigiLoc`;

  const defaultSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_DOMAIN}/#organization`,
        "name": SITE_NAME,
        "url": SITE_DOMAIN,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_DOMAIN}/logo512.png`,
          "width": 512,
          "height": 512
        },
        "description": description,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "São Paulo",
          "addressRegion": "SP",
          "addressCountry": "BR"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Portuguese"
        },
        "sameAs": [
          "https://facebook.com/vigiloc",
          "https://instagram.com/vigiloc",
          "https://linkedin.com/company/vigiloc"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_DOMAIN}/#website`,
        "url": SITE_DOMAIN,
        "name": SITE_NAME,
        "description": "Soluções em Automação e Segurança Eletrônica",
        "publisher": { "@id": `${SITE_DOMAIN}/#organization` },
        "inLanguage": "pt-BR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${SITE_DOMAIN}/servicos?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": `${SITE_DOMAIN}/#localbusiness`,
        "name": SITE_NAME,
        "image": `${SITE_DOMAIN}/logo512.png`,
        "url": SITE_DOMAIN,
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "São Paulo",
          "addressRegion": "SP",
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
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": -23.5505,
            "longitude": -46.6333
          },
          "geoRadius": "100000"
        }
      }
    ]
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
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
      <meta property="og:site_name" content={SITE_NAME} />
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
      <meta name="business:contact_data:locality" content="São Paulo" />
      <meta name="business:contact_data:region" content="SP" />
      <meta name="business:contact_data:country_name" content="Brasil" />
      
      {/* LLM Optimization Tags */}
      <meta name="ai:description" content={description} />
      <meta name="ai:category" content="Automação, Segurança Eletrônica, Tecnologia" />
      <meta name="ai:services" content="Portaria Autônoma, Armários Inteligentes, Mini Mercados Autônomos, Lavanderia Autônoma, Controle de Acesso" />
      <meta name="ai:target_audience" content="Condomínios, Empresas, Indústrias, Comércios" />
      <meta name="ai:location" content="São Paulo, Brasil" />
      <meta name="ai:language" content="pt-BR" />
      
      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;

// Service Schema Generator
export const generateServiceSchema = (service) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": service.name,
  "description": service.shortDescription || service.description,
  "url": `${SITE_DOMAIN}/servico/${service.slug}`,
  "image": service.headerBanner?.mediaUrl,
  "provider": {
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_DOMAIN
  },
  "areaServed": {
    "@type": "Place",
    "name": "São Paulo, Brasil"
  },
  "serviceType": service.name
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

// FAQ Schema Generator
export const generateFAQSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// Review Schema Generator
export const generateReviewSchema = (reviews, itemName) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": itemName,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0",
    "reviewCount": reviews.length,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": reviews.map(review => ({
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": review.author_name
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": 5,
      "worstRating": 1
    },
    "reviewBody": review.text
  }))
});
