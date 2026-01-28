# VigiLoc CMS - Product Requirements Document

## Original Problem Statement
Build a comprehensive CMS for VigiLoc, a security services company in Brazil. The platform includes e-commerce, CRM/ERP, and marketing tools for the Baixada Santista region.

## User Personas
- **Admin**: Full access to all features, manages content, services, and sales
- **Sales Team**: Uses Prospecção Intel for lead management and route optimization
- **Customers**: Browse services, products, and contact the company

## Core Requirements

### Implemented Features ✅

#### Homepage & Content Management
- [x] Dynamic homepage with admin editor
- [x] Hero section customization (image/video/gradient)
- [x] Statistics cards management
- [x] Featured services section
- [x] Footer link manager
- [x] Navbar customization
- [x] Visual page builder
- [x] Seasonal templates with AI generation

#### Services & Products
- [x] Service pages with custom content
- [x] Product catalog with badges
- [x] Categories management
- [x] Video thumbnails with CORS fallback
- [x] Social reviews management

#### Prospecção Intel - Complete Feature 🎯
- [x] Interactive map with Leaflet (React-Leaflet)
- [x] Heatmap of crime statistics (SSP-SP data)
- [x] Opportunity scoring algorithm
- [x] Lead management by zone
- [x] Optimized route generation
- [x] Visit scheduling system
- [x] Success metrics tracking
- [x] Seasonality analysis
- [x] Real IBGE population data integration
- [x] Municipality selector (9 cities of Baixada Santista)
- [x] Priority-based markers (alta/média/baixa)

#### Prospect Management System (NEW - Jan 28, 2026) 📋
- [x] Manual prospect creation with full form
- [x] Automatic prospect scraping via Playwright
- [x] Filter by city, portaria type, and status
- [x] Types of Portaria:
  - Porteiro 24h
  - Portaria Remota
  - Sem Portaria
  - Porteiro Diurno
  - Misto
  - Empresa/Comércio
- [x] Status tracking (Não Contatado, Interessado, Negociando, Fechado, Descartado)
- [x] Edit and delete prospects
- [x] Prospect statistics dashboard
- [x] Route assignment for prospects

#### CRM/ERP
- [x] Customer management
- [x] Contract management
- [x] Equipment tracking
- [x] Payment management
- [x] Support tickets
- [x] Notification system

#### Admin Tools
- [x] Dashboard with analytics
- [x] User management
- [x] SEO configuration
- [x] Tracking tags (GTM, GA4, Meta Pixel)
- [x] Help guide

### Pending Features

#### P0 - Critical
- [ ] None (all P0 completed)

#### P1 - Important
- [ ] Direct social media integration for reviews (Google My Business API)
- [ ] SEO ranking report integration (SEMrush/Ahrefs)
- [ ] Password recovery (requires SENDGRID_API_KEY)

#### P2 - Nice to Have
- [ ] Payment gateway integration (Stripe, Mercado Pago)
- [ ] Shipping integration (Melhor Envio)
- [ ] Advanced analytics reports

## Technical Architecture

### Backend (FastAPI)
- `/app/backend/server.py` - Main API routes
- `/app/backend/prospecting_service.py` - Prospecção Intel service with scraping

### Frontend (React)
- `/app/frontend/src/pages/admin/ProspectingIntel.js` - Complete prospecting dashboard
- `/app/frontend/src/components/ProspectingMap.js` - Interactive map component
- Shadcn/UI component library
- React-Leaflet for maps

### External APIs & Libraries
- IBGE API for population data
- SSP-SP statistics (static data based on public reports)
- OpenStreetMap tiles for maps
- Playwright for web scraping

### Database Schema

#### Key Collections
- `users` - Admin and customer accounts
- `services` - Service pages
- `products` - Product catalog
- `homepage_settings` - Homepage configuration
- `footer_settings` - Footer configuration
- `prospecting_routes` - Generated routes
- `prospecting_schedules` - Visit schedules
- `prospects` - Prospect entries (NEW)

#### Prospects Schema
```json
{
  "id": "uuid",
  "nome": "string",
  "tipo": "condominio|empresa",
  "cidade": "string",
  "bairro": "string",
  "endereco": "string",
  "telefone": "string",
  "email": "string",
  "tipo_portaria": "porteiro_24h|portaria_remota|sem_portaria|porteiro_diurno|misto|empresa",
  "unidades": "number",
  "torres": "number",
  "sindico": "string",
  "administradora": "string",
  "interesse": "nao_contatado|interessado|negociando|fechado|descartado",
  "servico_interesse": ["totem", "cameras", "controle_acesso", "alarme"],
  "valor_estimado": "number",
  "prioridade": "alta|media|baixa",
  "origem": "manual|scraping|indicacao",
  "rota_id": "string",
  "historico": [{"data": "ISO", "acao": "string", "usuario": "string"}]
}
```

## Test Credentials
- **Admin URL**: `/painel-admin`
- **Email**: `admin@vigiloc.com`
- **Password**: `admin123`

## API Endpoints for Prospects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/prospecting/tipos-portaria` | Get portaria types |
| POST | `/api/admin/prospecting/prospects` | Create prospect |
| GET | `/api/admin/prospecting/prospects` | List with filters |
| GET | `/api/admin/prospecting/prospects/{id}` | Get single prospect |
| PUT | `/api/admin/prospecting/prospects/{id}` | Update prospect |
| DELETE | `/api/admin/prospecting/prospects/{id}` | Delete prospect |
| GET | `/api/admin/prospecting/prospects-stats` | Get statistics |
| POST | `/api/admin/prospecting/scrape` | Scrape new prospects |

---
Last Updated: January 28, 2026
