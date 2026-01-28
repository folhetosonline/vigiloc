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

#### Prospecção Intel (NEW - Jan 2026) 🎯
- [x] Interactive map with Leaflet
- [x] Heatmap of crime statistics (SSP-SP data)
- [x] Opportunity scoring algorithm
- [x] Lead management by zone
- [x] Optimized route generation
- [x] Visit scheduling system
- [x] Success metrics tracking
- [x] Seasonality analysis
- [x] Real IBGE population data integration
- [x] Municipality selector (9 cities)
- [x] Priority-based markers (alta/média/baixa)

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
- `/app/backend/prospecting_service.py` - Prospecção Intel service
- MongoDB for data storage
- JWT authentication

### Frontend (React)
- `/app/frontend/src/pages/admin/` - Admin pages
- `/app/frontend/src/components/` - Shared components
- Shadcn/UI component library
- React-Leaflet for maps

### External APIs
- IBGE API for population data
- SSP-SP statistics (static data)
- OpenStreetMap tiles for maps

## Database Schema

### Key Collections
- `users` - Admin and customer accounts
- `services` - Service pages
- `products` - Product catalog
- `homepage_settings` - Homepage configuration
- `footer_settings` - Footer configuration
- `prospecting_routes` - Generated routes
- `prospecting_schedules` - Visit schedules

## Test Credentials
- **Admin URL**: `/painel-admin`
- **Email**: `admin@vigiloc.com`
- **Password**: `admin123`

---
Last Updated: January 28, 2026
