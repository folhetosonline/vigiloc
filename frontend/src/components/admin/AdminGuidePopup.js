import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Search,
  Globe,
  Star,
  Share2,
  Bot,
  BarChart3,
  Settings,
  Zap,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Shield,
  Rocket
} from "lucide-react";

const GUIDE_SECTIONS = [
  {
    id: "intro",
    icon: <Rocket className="w-5 h-5" />,
    title: "🚀 Bem-vindo ao Guia Completo",
    description: "Tudo que você precisa saber para dominar sua presença digital",
    content: `
## Parabéns por escolher a VigiLoc!

Este guia foi criado para ajudá-lo a **maximizar sua presença online** e atrair mais clientes através dos mecanismos de busca e inteligência artificial.

### O que você vai aprender:

1. **SEO Básico e Avançado** - Como aparecer no Google
2. **Google Search Console** - Monitorar sua indexação
3. **Google My Business** - Aparecer no Google Maps
4. **Redes Sociais** - Integrar avaliações
5. **LLMs e IA** - Ser encontrado por ChatGPT, Claude, etc.
6. **Analytics** - Medir seus resultados

### Por que isso é importante?

- **93%** das experiências online começam em um buscador
- **75%** dos usuários nunca passam da primeira página do Google
- **46%** das buscas do Google são para negócios locais
- **LLMs** como ChatGPT estão se tornando uma nova forma de busca

**Tempo estimado para configuração completa: 2-3 horas**
    `,
    steps: []
  },
  {
    id: "google-search-console",
    icon: <Search className="w-5 h-5" />,
    title: "📊 Google Search Console",
    description: "Monitore como o Google vê seu site",
    content: `
## O que é o Google Search Console?

O **Google Search Console** (GSC) é uma ferramenta gratuita do Google que permite:

- Ver quais palavras-chave trazem visitantes
- Identificar erros de indexação
- Submeter seu sitemap
- Receber alertas sobre problemas
- Ver sua posição nas buscas

### Por que é essencial?

Sem o GSC, você está "voando às cegas" - não sabe se o Google está encontrando suas páginas ou se há problemas técnicos impedindo sua indexação.
    `,
    steps: [
      {
        title: "Acesse o Google Search Console",
        description: "Vá para search.google.com/search-console e faça login com sua conta Google (a mesma do Gmail).",
        link: "https://search.google.com/search-console",
        important: true
      },
      {
        title: "Adicione sua propriedade",
        description: "Clique em 'Adicionar propriedade' e escolha 'Prefixo do URL'. Digite: https://www.vigiloc.com.br",
        tip: "Use sempre a versão com 'www' e 'https' para consistência."
      },
      {
        title: "Verifique a propriedade",
        description: "O Google oferece várias formas de verificação. A mais fácil é através do Google Analytics (se já tiver) ou por tag HTML.",
        tip: "Para verificação por HTML: copie a meta tag fornecida e cole no <head> do site."
      },
      {
        title: "Submeta seu Sitemap",
        description: "No menu lateral, vá em 'Sitemaps'. Digite 'sitemap.xml' e clique em 'Enviar'. Seu sitemap está em: /api/sitemap.xml",
        important: true
      },
      {
        title: "Solicite indexação",
        description: "Use a ferramenta 'Inspeção de URL' para verificar páginas específicas. Se não estiverem indexadas, clique em 'Solicitar indexação'.",
        tip: "Priorize: Homepage, página de Serviços e páginas de cada serviço individual."
      },
      {
        title: "Configure alertas por email",
        description: "Em 'Configurações', ative as notificações por email para ser avisado sobre problemas críticos."
      },
      {
        title: "Monitore semanalmente",
        description: "Verifique o relatório de 'Desempenho' para ver cliques, impressões e posição média. Acompanhe a evolução ao longo do tempo."
      }
    ]
  },
  {
    id: "google-my-business",
    icon: <Globe className="w-5 h-5" />,
    title: "📍 Google My Business",
    description: "Apareça no Google Maps e nas buscas locais",
    content: `
## O que é o Google My Business?

O **Google My Business** (GMB) é o perfil da sua empresa que aparece no Google Maps e na lateral das buscas quando alguém procura por você ou por serviços relacionados.

### Benefícios:

- **Aparecer no Google Maps** com endereço, telefone e horários
- **Coletar avaliações** dos clientes diretamente no Google
- **Postar atualizações** sobre promoções e novidades
- **Ver estatísticas** de quantas pessoas viram seu perfil
- **Responder a perguntas** de potenciais clientes

### Impacto no SEO Local:

Empresas com perfil GMB completo têm **70% mais chances** de atrair visitas presenciais e **50% mais chances** de gerar vendas.
    `,
    steps: [
      {
        title: "Acesse o Google Business Profile",
        description: "Vá para business.google.com e faça login com sua conta Google.",
        link: "https://business.google.com",
        important: true
      },
      {
        title: "Crie ou reivindique seu negócio",
        description: "Pesquise por 'VigiLoc' para ver se já existe um perfil. Se sim, reivindique. Se não, crie um novo.",
        tip: "Se já existir, você precisará verificar que é o proprietário."
      },
      {
        title: "Preencha todas as informações",
        description: "Complete 100% do perfil: nome, categoria (Segurança Eletrônica), endereço, telefone, site, horários de funcionamento.",
        important: true,
        tip: "Use a categoria principal 'Empresa de Sistemas de Segurança' e adicione categorias secundárias como 'Automação Residencial'."
      },
      {
        title: "Adicione fotos de qualidade",
        description: "Faça upload de: logo, fotos da equipe, fotos de instalações, fotos de produtos instalados. Mínimo 10 fotos.",
        tip: "Fotos geram 42% mais solicitações de rota no Maps."
      },
      {
        title: "Escreva uma descrição completa",
        description: "Use até 750 caracteres para descrever seus serviços. Inclua palavras-chave naturalmente: portaria autônoma, armários inteligentes, etc.",
        tip: "Exemplo: 'A VigiLoc é líder em soluções de automação e segurança eletrônica para condomínios em São Paulo. Oferecemos portaria autônoma, armários inteligentes, mini mercados autônomos e muito mais.'"
      },
      {
        title: "Verifique seu negócio",
        description: "O Google enviará um código de verificação por correio (cartão postal) ou telefone. Insira o código para ativar seu perfil.",
        important: true,
        tip: "A verificação por correio leva 5-14 dias. Por telefone é instantânea (quando disponível)."
      },
      {
        title: "Solicite avaliações",
        description: "Peça aos clientes satisfeitos para deixarem avaliações. Use o link de avaliação do GMB para facilitar.",
        tip: "Responda a TODAS as avaliações, positivas e negativas, de forma profissional."
      },
      {
        title: "Publique posts regularmente",
        description: "Use a função 'Posts' para compartilhar novidades, promoções e eventos. Posts têm validade de 7 dias.",
        tip: "Publique pelo menos 1 post por semana para manter o perfil ativo."
      }
    ]
  },
  {
    id: "reviews-management",
    icon: <Star className="w-5 h-5" />,
    title: "⭐ Gestão de Avaliações",
    description: "Colete e gerencie depoimentos de clientes",
    content: `
## Por que avaliações são cruciais?

As avaliações são um dos **fatores mais importantes** para decisão de compra:

- **88%** dos consumidores confiam em avaliações online tanto quanto recomendações pessoais
- **72%** dos clientes só tomam uma ação após ler avaliações positivas
- Avaliações impactam diretamente seu **ranking no Google**

### Onde coletar avaliações:

1. **Google My Business** - Mais impactante para SEO
2. **Facebook** - Grande alcance social
3. **Instagram** - Stories e posts de clientes
4. **WhatsApp** - Depoimentos diretos

### Estratégia recomendada:

1. Após cada instalação bem-sucedida, envie um link de avaliação
2. Ofereça um pequeno incentivo (desconto na manutenção)
3. Facilite: envie o link direto para avaliar
4. Responda todas as avaliações em até 24h
    `,
    steps: [
      {
        title: "Acesse o painel de Avaliações",
        description: "No admin da VigiLoc, vá em 'Avaliações ⭐'. Aqui você gerencia todos os depoimentos que aparecem no site.",
        link: "/admin/reviews",
        important: true
      },
      {
        title: "Crie uma rotina de coleta",
        description: "Após cada serviço concluído, envie uma mensagem pedindo avaliação. Use o WhatsApp com um link direto para o Google.",
        tip: "Modelo: 'Olá [Nome]! Ficamos felizes em atendê-lo. Poderia compartilhar sua experiência? [link]'"
      },
      {
        title: "Importe avaliações existentes",
        description: "Use o botão 'Importar Review' para adicionar avaliações do Google, Facebook ou Instagram ao seu site.",
        tip: "Cole o link da avaliação e preencha os dados extraídos."
      },
      {
        title: "Destaque as melhores",
        description: "Marque as melhores avaliações como 'Destacadas' para aparecerem na homepage.",
        important: true
      },
      {
        title: "Responda no Google",
        description: "Acesse seu Google My Business e responda cada avaliação. Isso mostra profissionalismo e melhora seu ranking.",
        tip: "Para avaliações negativas: agradeça, peça desculpas, ofereça solução, leve para o privado."
      },
      {
        title: "Monitore sua reputação",
        description: "Acompanhe sua nota média no painel SEO. Meta: manter acima de 4.5 estrelas.",
        tip: "Configure alertas do Google para 'VigiLoc avaliação' para saber quando alguém menciona sua empresa."
      }
    ]
  },
  {
    id: "llm-optimization",
    icon: <Bot className="w-5 h-5" />,
    title: "🤖 Otimização para IAs (LLMs)",
    description: "Seja encontrado pelo ChatGPT, Claude e outros",
    content: `
## O que são LLMs e por que importam?

**LLMs** (Large Language Models) como ChatGPT, Claude, Perplexity e Google Gemini estão revolucionando a forma como as pessoas buscam informações.

### Tendências:

- **100 milhões** de usuários ativos no ChatGPT
- **40%** dos jovens já usam IA para buscar serviços locais
- LLMs citam empresas com **informações claras e estruturadas**

### Como LLMs encontram informações:

1. **Crawlers de IA** visitam sites regularmente
2. Leem arquivos especiais como **llms.txt**
3. Processam **dados estruturados** (JSON-LD)
4. Priorizam sites com **conteúdo claro e autoridade**

### Seu site já está otimizado! ✅

Implementamos:
- Arquivo **llms.txt** com informações da empresa
- **Permissões no robots.txt** para crawlers de IA
- **Dados estruturados** para serviços e avaliações
    `,
    steps: [
      {
        title: "Entenda o llms.txt",
        description: "Este é um arquivo especial que IAs leem para entender seu negócio. Acesse /llms.txt para ver o conteúdo.",
        link: "/llms.txt",
        tip: "Similar ao robots.txt, mas focado em dar contexto para IAs."
      },
      {
        title: "Mantenha informações atualizadas",
        description: "Quando adicionar novos serviços ou mudar informações, o llms.txt é atualizado automaticamente via API.",
        important: true
      },
      {
        title: "Crie conteúdo claro e estruturado",
        description: "IAs preferem textos bem organizados com títulos (H1, H2), listas e parágrafos curtos.",
        tip: "Evite jargões. Escreva como se explicasse para alguém que não conhece o setor."
      },
      {
        title: "Adicione FAQs às páginas",
        description: "Perguntas e respostas são ótimas para IAs. Considere adicionar seções de FAQ nas páginas de serviços.",
        tip: "Use o Page Builder para adicionar componentes de FAQ."
      },
      {
        title: "Monitore menções",
        description: "Pergunte ao ChatGPT: 'Quais empresas de portaria autônoma em São Paulo você recomenda?' e veja se sua empresa aparece.",
        important: true
      },
      {
        title: "Construa autoridade",
        description: "Quanto mais seu site for citado em outros lugares, mais IAs o considerarão confiável. Busque parcerias e menções.",
        tip: "Participe de diretórios de empresas, associações do setor e publique artigos em blogs relevantes."
      }
    ]
  },
  {
    id: "social-media",
    icon: <Share2 className="w-5 h-5" />,
    title: "📱 Redes Sociais",
    description: "Integre e amplifique sua presença social",
    content: `
## Redes Sociais para Negócios B2B

Para empresas de segurança e automação, as redes sociais servem principalmente para:

1. **Construir autoridade** através de conteúdo educativo
2. **Mostrar cases de sucesso** (antes e depois)
3. **Humanizar a marca** com bastidores da equipe
4. **Gerar leads** através de anúncios segmentados

### Plataformas recomendadas:

| Rede | Objetivo | Frequência |
|------|----------|------------|
| **LinkedIn** | Relacionamento B2B, conteúdo técnico | 3x/semana |
| **Instagram** | Cases visuais, stories | 5x/semana |
| **Facebook** | Comunidade, eventos | 3x/semana |
| **YouTube** | Tutoriais, demonstrações | 2x/mês |

### Integração com o Site:

Seu site já está configurado com **Open Graph** para que links compartilhados apareçam com imagem e descrição atrativas.
    `,
    steps: [
      {
        title: "Complete seus perfis",
        description: "Certifique-se de que todas as redes tenham: foto de perfil (logo), capa, descrição completa, link para o site, e informações de contato.",
        important: true
      },
      {
        title: "Mantenha consistência visual",
        description: "Use as mesmas cores (azul #1e40af), fontes e estilo de comunicação em todas as redes.",
        tip: "Crie templates no Canva para posts padronizados."
      },
      {
        title: "Publique cases de sucesso",
        description: "Fotografe instalações (com permissão) e mostre o antes/depois. Isso gera confiança.",
        tip: "Peça depoimentos em vídeo - têm 10x mais engajamento."
      },
      {
        title: "Use hashtags estratégicas",
        description: "Para Instagram: #SegurançaEletronica #PortariaAutonoma #CondominioInteligente #AutomaçaoResidencial #SaoPaulo",
        tip: "Use 5-10 hashtags relevantes, misturando populares e nichadas."
      },
      {
        title: "Integre avaliações",
        description: "Compartilhe prints de avaliações positivas nas redes. Use o Stories para isso.",
        tip: "Marque o cliente (se ele permitir) para aumentar o alcance."
      },
      {
        title: "Monitore métricas",
        description: "Acompanhe: alcance, engajamento, cliques no link da bio, e leads gerados.",
        tip: "Use o Meta Business Suite para Facebook/Instagram e LinkedIn Analytics."
      }
    ]
  },
  {
    id: "analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    title: "📈 Google Analytics 4",
    description: "Meça resultados e tome decisões baseadas em dados",
    content: `
## Por que usar Analytics?

O **Google Analytics 4** (GA4) permite entender:

- **De onde vêm** seus visitantes
- **Quais páginas** são mais acessadas
- **Quanto tempo** passam no site
- **Quais ações** realizam (cliques em WhatsApp, formulários)
- **Taxa de conversão** de visitantes em leads

### Métricas importantes para VigiLoc:

1. **Usuários** - Quantas pessoas visitam
2. **Taxa de Rejeição** - % que sai sem interagir (meta: <50%)
3. **Páginas por Sessão** - Quantas páginas cada visitante vê
4. **Conversões** - Cliques no WhatsApp, envios de formulário
5. **Origem do Tráfego** - Google, direto, redes sociais

### ROI de Marketing:

Com Analytics, você pode calcular o **custo por lead** e identificar quais canais trazem os melhores resultados.
    `,
    steps: [
      {
        title: "Crie uma conta GA4",
        description: "Acesse analytics.google.com e crie uma nova propriedade GA4 para www.vigiloc.com.br",
        link: "https://analytics.google.com",
        important: true
      },
      {
        title: "Instale o código de rastreamento",
        description: "Copie o ID de medição (G-XXXXXXXX) e adicione ao site. Isso requer acesso ao código.",
        tip: "O código deve ir no <head> de todas as páginas."
      },
      {
        title: "Configure eventos de conversão",
        description: "Marque como conversão: cliques no botão de WhatsApp, envios do formulário de contato, visualização da página de contato.",
        important: true
      },
      {
        title: "Conecte com Search Console",
        description: "No GA4, vá em Admin > Vinculações de produtos > Search Console. Isso mostra dados de busca dentro do Analytics.",
        tip: "Permite ver quais palavras-chave trazem tráfego."
      },
      {
        title: "Crie um painel personalizado",
        description: "Configure um 'Relatório personalizado' com as métricas mais importantes para seu negócio.",
        tip: "Inclua: Usuários, Sessões, Taxa de Conversão, Principais Páginas."
      },
      {
        title: "Configure alertas",
        description: "Crie alertas para: quedas bruscas de tráfego, aumento de taxa de rejeição, ou picos de conversão.",
        tip: "Alertas ajudam a identificar problemas ou oportunidades rapidamente."
      },
      {
        title: "Revise mensalmente",
        description: "Dedique 30 minutos por mês para analisar os dados e identificar tendências.",
        tip: "Compare mês a mês e ano a ano para entender sazonalidades."
      }
    ]
  },
  {
    id: "advanced-seo",
    icon: <Target className="w-5 h-5" />,
    title: "🎯 SEO Avançado",
    description: "Técnicas para dominar os resultados de busca",
    content: `
## Além do Básico: SEO Avançado

Seu site já tem a **fundação técnica** de SEO implementada. Para ir além, considere estas estratégias avançadas:

### 1. Link Building (Construção de Links)

Links de outros sites para o seu são como "votos de confiança". Quanto mais sites relevantes linkarem para você, melhor seu ranking.

**Estratégias:**
- Parcerias com construtoras e incorporadoras
- Menções em portais de notícias locais
- Participação em associações do setor
- Guest posts em blogs de condomínios

### 2. Conteúdo de Autoridade

Crie conteúdo que responda perguntas do seu público:
- "Quanto custa uma portaria autônoma?"
- "Como funciona um armário inteligente?"
- "Vantagens do mini mercado em condomínio"

### 3. SEO Local

Para buscas como "portaria autônoma São Paulo":
- Otimize para cada bairro/região
- Crie páginas específicas por localidade
- Colete avaliações mencionando o bairro

### 4. Core Web Vitals

Métricas de velocidade que o Google considera:
- **LCP** (carregamento): <2.5s
- **FID** (interatividade): <100ms
- **CLS** (estabilidade): <0.1
    `,
    steps: [
      {
        title: "Identifique oportunidades de backlinks",
        description: "Liste parceiros, fornecedores, e clientes que poderiam linkar para seu site.",
        tip: "Ofereça criar conteúdo para o blog deles em troca de um link."
      },
      {
        title: "Crie conteúdo para palavras-chave de cauda longa",
        description: "Ao invés de 'segurança eletrônica', foque em 'sistema de portaria autônoma para condomínio residencial em São Paulo'.",
        important: true,
        tip: "Palavras específicas têm menos competição e maior intenção de compra."
      },
      {
        title: "Otimize imagens",
        description: "Comprima todas as imagens para <100KB. Use nomes descritivos: 'portaria-autonoma-condominio.jpg' ao invés de 'IMG_1234.jpg'.",
        tip: "Use ferramentas como TinyPNG ou Squoosh."
      },
      {
        title: "Melhore a velocidade do site",
        description: "Teste em pagespeed.web.dev e siga as recomendações. Meta: pontuação acima de 80.",
        link: "https://pagespeed.web.dev",
        tip: "Imagens são geralmente o maior problema. Use formato WebP."
      },
      {
        title: "Implemente Schema FAQ",
        description: "Adicione perguntas frequentes nas páginas de serviços usando schema.org/FAQPage.",
        tip: "FAQs podem aparecer como 'rich snippets' no Google."
      },
      {
        title: "Monitore concorrentes",
        description: "Use ferramentas como Ubersuggest ou SEMrush para ver quais palavras-chave seus concorrentes rankeiam.",
        tip: "Versões gratuitas dessas ferramentas já dão boas informações."
      }
    ]
  },
  {
    id: "maintenance",
    icon: <Settings className="w-5 h-5" />,
    title: "🔧 Manutenção Contínua",
    description: "Rotina semanal e mensal para manter resultados",
    content: `
## SEO é uma Maratona, não um Sprint

Os resultados de SEO levam tempo (3-6 meses para ver impacto significativo), mas com manutenção constante, os resultados são duradouros.

### Checklist Semanal (30 min):

- [ ] Verificar Google Search Console para erros
- [ ] Responder novas avaliações
- [ ] Publicar 1-2 posts nas redes sociais
- [ ] Verificar posição para 3-5 palavras-chave principais

### Checklist Mensal (2h):

- [ ] Analisar relatório completo do Analytics
- [ ] Revisar e atualizar conteúdo das páginas principais
- [ ] Solicitar avaliações de clientes recentes
- [ ] Publicar 1 conteúdo novo (artigo, case, vídeo)
- [ ] Verificar links quebrados

### Checklist Trimestral (meio dia):

- [ ] Auditoria completa de SEO
- [ ] Atualizar fotos do Google My Business
- [ ] Revisar e atualizar descrições de serviços
- [ ] Analisar concorrência
- [ ] Definir metas para o próximo trimestre
    `,
    steps: [
      {
        title: "Configure lembretes",
        description: "Use o Google Calendar para criar lembretes recorrentes das tarefas semanais e mensais.",
        important: true
      },
      {
        title: "Documente mudanças",
        description: "Mantenha um log de todas as alterações feitas no site e seus resultados.",
        tip: "Isso ajuda a identificar o que funciona e o que não funciona."
      },
      {
        title: "Delegue quando possível",
        description: "Considere contratar um freelancer para tarefas repetitivas como publicação em redes sociais.",
        tip: "Sua prioridade deve ser responder avaliações e criar conteúdo estratégico."
      },
      {
        title: "Mantenha-se atualizado",
        description: "O algoritmo do Google muda constantemente. Siga blogs como Search Engine Journal e Moz.",
        link: "https://www.searchenginejournal.com",
        tip: "Mudanças importantes são anunciadas com antecedência."
      },
      {
        title: "Celebre vitórias",
        description: "Quando atingir primeira página para uma palavra-chave, comemore! Isso motiva a continuar.",
        tip: "Tire prints e compartilhe com a equipe."
      }
    ]
  }
];

const AdminGuidePopup = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("intro");

  const currentSection = GUIDE_SECTIONS.find(s => s.id === selectedSection);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Guia Completo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-72 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="w-6 h-6" />
                <div>
                  <h2 className="font-bold">Central de Ajuda</h2>
                  <p className="text-xs text-blue-100">Guia Completo do Admin</p>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {GUIDE_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                      selectedSection === section.id
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={selectedSection === section.id ? "text-blue-600" : "text-gray-500"}>
                        {section.icon}
                      </span>
                      <span className="font-medium text-sm">{section.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-7">{section.description}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Dúvidas? Entre em contato pelo suporte.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {currentSection?.icon}
                </div>
                <div>
                  <DialogTitle className="text-xl">{currentSection?.title}</DialogTitle>
                  <DialogDescription>{currentSection?.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              {/* Main Content */}
              <div className="prose prose-sm max-w-none mb-8">
                <div className="whitespace-pre-line text-gray-700">
                  {currentSection?.content}
                </div>
              </div>

              {/* Steps */}
              {currentSection?.steps && currentSection.steps.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Passo a Passo
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {currentSection.steps.map((step, idx) => (
                      <AccordionItem 
                        key={idx} 
                        value={`step-${idx}`}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 text-left">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              step.important 
                                ? "bg-yellow-100 text-yellow-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <span className="font-medium">{step.title}</span>
                              {step.important && (
                                <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-300">
                                  Importante
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="ml-11 space-y-3">
                            <p className="text-gray-700">{step.description}</p>
                            
                            {step.tip && (
                              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-blue-800"><strong>Dica:</strong> {step.tip}</span>
                              </div>
                            )}
                            
                            {step.link && (
                              <a 
                                href={step.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Acessar: {step.link}
                              </a>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Footer Navigation */}
              <div className="mt-8 pt-6 border-t flex justify-between">
                <Button 
                  variant="outline"
                  disabled={GUIDE_SECTIONS.findIndex(s => s.id === selectedSection) === 0}
                  onClick={() => {
                    const currentIdx = GUIDE_SECTIONS.findIndex(s => s.id === selectedSection);
                    if (currentIdx > 0) {
                      setSelectedSection(GUIDE_SECTIONS[currentIdx - 1].id);
                    }
                  }}
                >
                  ← Anterior
                </Button>
                <Button 
                  disabled={GUIDE_SECTIONS.findIndex(s => s.id === selectedSection) === GUIDE_SECTIONS.length - 1}
                  onClick={() => {
                    const currentIdx = GUIDE_SECTIONS.findIndex(s => s.id === selectedSection);
                    if (currentIdx < GUIDE_SECTIONS.length - 1) {
                      setSelectedSection(GUIDE_SECTIONS[currentIdx + 1].id);
                    }
                  }}
                >
                  Próximo →
                </Button>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminGuidePopup;
