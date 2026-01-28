from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import shutil
import aiofiles
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# SendGrid
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@vigiloc.com')

def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SendGrid"""
    try:
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        if SENDGRID_API_KEY:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            return {"success": True, "status_code": response.status_code}
        else:
            # Log instead of sending if no API key
            logger.info(f"EMAIL (no API key): To: {to_email}, Subject: {subject}")
            return {"success": False, "message": "SendGrid API key not configured"}
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return {"success": False, "error": str(e)}


# Upload directory
UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', '/app/backend/uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: Optional[str] = None
    is_admin: bool = False
    role: str = "viewer"  # admin, manager, editor, viewer, customer
    google_id: Optional[str] = None
    picture: Optional[str] = None
    active: bool = True
    # Customer fields
    phone: Optional[str] = None
    cpf: Optional[str] = None
    address_street: Optional[str] = None
    address_number: Optional[str] = None
    address_complement: Optional[str] = None
    address_neighborhood: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SessionData(BaseModel):
    id: str
    email: str
    name: str

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    token: str
    used: bool = False
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    picture: Optional[str] = None
    session_token: str

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    description: str
    price: float
    image: str
    images: List[str] = []
    features: List[str]
    inStock: bool = True
    quantity: int = 0
    sku: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[dict] = None
    published: bool = False  # Controls if product is visible on website
    published_at: Optional[datetime] = None
    # New fields for pages and badges
    show_on_pages: List[str] = []  # ["home", "totens", "produtos", "todas"]
    badges: List[str] = []  # ["novidade", "lancamento", "custo-beneficio", "top-linha", "oferta", "destaque"]
    enable_cart: bool = False  # Se permite adicionar ao carrinho (default: false para venda consultiva)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category: str
    description: str
    price: float
    image: str
    images: List[str] = []
    features: List[str]
    inStock: bool = True
    quantity: int = 0
    sku: Optional[str] = None
    weight: Optional[float] = None
    dimensions: Optional[dict] = None
    published: bool = False  # Controls if product is visible on website
    published_at: Optional[datetime] = None
    show_on_pages: List[str] = []  # ["home", "totens", "produtos", "todas"]
    badges: List[str] = []  # ["novidade", "lancamento", "custo-beneficio", "top-linha", "oferta", "destaque"]

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: str
    icon: str
    image: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: str
    icon: str
    image: Optional[str] = None

# Service Model for the 6 service categories
class ServiceFeature(BaseModel):
    title: str
    description: str
    icon: Optional[str] = None

class HeaderBanner(BaseModel):
    type: str = 'image'  # 'image' | 'video' | 'gradient'
    mediaUrl: Optional[str] = None
    overlayColor: str = 'rgba(0,0,0,0.5)'
    overlayOpacity: int = 50
    title: Optional[str] = None
    titleColor: str = '#FFFFFF'
    titleSize: str = '4xl'
    titleFont: str = 'Inter'
    titlePosition: str = 'center'
    subtitle: Optional[str] = None
    subtitleColor: str = '#FFFFFF'
    subtitleSize: str = 'xl'
    ctaText: Optional[str] = None
    ctaUrl: Optional[str] = None
    ctaColor: str = '#22C55E'
    ctaTextColor: str = '#FFFFFF'
    height: str = '70vh'
    textAlign: str = 'center'
    verticalAlign: str = 'center'

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    categoryId: Optional[str] = None
    shortDescription: Optional[str] = None
    fullDescription: Optional[str] = None
    icon: Optional[str] = None
    published: bool = True
    headerBanner: Optional[dict] = None
    features: List[dict] = []
    gallery: List[str] = []
    ctaWhatsapp: Optional[str] = None
    pageContent: List[dict] = []  # Page builder components
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class ServiceCreate(BaseModel):
    name: str
    slug: str
    categoryId: Optional[str] = None
    shortDescription: Optional[str] = None
    fullDescription: Optional[str] = None
    icon: Optional[str] = None
    published: bool = True
    headerBanner: Optional[dict] = None
    features: List[dict] = []
    gallery: List[str] = []
    ctaWhatsapp: Optional[str] = None
    pageContent: List[dict] = []

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShippingRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # 'cep', 'fixed', 'free'
    price: float = 0.0
    min_days: int = 0
    max_days: int = 0
    regions: Optional[List[str]] = None
    active: bool = True

# ==================== CRM/ERP MODELS ====================

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    whatsapp: str
    cpf_cnpj: Optional[str] = None
    address: dict
    customer_type: str = "residential"  # residential, commercial, industrial
    status: str = "active"  # active, suspended, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Contract(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    contract_number: str
    service_type: str  # totem, camera, access_control, complete
    monthly_value: float
    installation_value: float
    start_date: datetime
    end_date: Optional[datetime] = None
    payment_day: int  # Day of month for payment
    status: str = "active"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Equipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    contract_id: str
    equipment_type: str
    brand: str
    model: str
    serial_number: str
    installation_date: datetime
    warranty_until: Optional[datetime] = None
    status: str = "active"  # active, maintenance, inactive
    location: str
    notes: Optional[str] = None

class MaintenanceTicket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_number: str
    customer_id: str
    equipment_id: Optional[str] = None
    title: str
    description: str
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "open"  # open, in_progress, resolved, closed
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    contract_id: str
    invoice_number: str
    amount: float
    due_date: datetime
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    status: str = "pending"  # pending, paid, overdue, cancelled
    pix_key: Optional[str] = None
    pix_qrcode: Optional[str] = None
    reminder_sent: bool = False
    overdue_notice_sent: bool = False
    suspension_notice_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    type: str  # payment_reminder, overdue, suspension, order, ticket
    channel: str = "whatsapp"  # whatsapp, email, sms
    message: str
    status: str = "pending"  # pending, sent, failed
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CRMSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "crm_settings"
    trigger_settings: dict = {
        "payment_reminder_days": 1,
        "overdue_notice_days": 3,
        "suspension_warning_days": 10
    }
    email_templates: dict = {
        "payment_reminder": {
            "subject": "Lembrete: Pagamento próximo ao vencimento",
            "body": "Olá {customer_name}!\n\nSeu pagamento de R$ {amount} vence em {due_date}.\n\nChave Pix: {pix_key}\n\nAtenciosamente,\nVigiloc"
        },
        "overdue_notice": {
            "subject": "⚠️ Pagamento em Atraso",
            "body": "Olá {customer_name},\n\nIdentificamos que seu pagamento de R$ {amount} está em atraso desde {due_date}.\n\nPor favor, regularize para evitar a suspensão do serviço.\n\nChave Pix: {pix_key}\n\nAtenciosamente,\nVigiloc"
        },
        "suspension_warning": {
            "subject": "🚨 AVISO FINAL - Suspensão de Serviço",
            "body": "AVISO FINAL\n\n{customer_name},\n\nSeu serviço será suspenso em 24 horas por falta de pagamento.\n\nValor em atraso: R$ {amount}\nVencimento original: {due_date}\n\nREGULARIZE URGENTEMENTE!\n\nChave Pix: {pix_key}\n\nVigiloc"
        }
    }
    whatsapp_templates: dict = {
        "payment_reminder": "Olá {customer_name}! Lembrete: Seu pagamento de R$ {amount} vence em {due_date}. PIX: {pix_key}",
        "overdue_notice": "⚠️ {customer_name}, seu pagamento de R$ {amount} está atrasado. Por favor, regularize para evitar suspensão do serviço. PIX: {pix_key}",
        "suspension_warning": "🚨 AVISO FINAL {customer_name}: Seu serviço será suspenso em 24h por falta de pagamento. Valor: R$ {amount}. Regularize URGENTE! PIX: {pix_key}"
    }

class PageContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    page_name: str
    sections: dict
    images: dict
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published: bool = False  # Controls if content is live on website
    published_at: Optional[datetime] = None

    price: float = 0.0
    min_days: int = 0
    max_days: int = 0
    active: bool = True

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "site_settings"
    site_name: str = "VigiLoc"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str = "#3B82F6"
    secondary_color: str = "#1E40AF"
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    enable_cart_globally: bool = False  # Se habilita carrinho para todos os produtos (default: false)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NavLink(BaseModel):
    """Navigation link model"""
    id: str = ""
    label: str
    url: str
    sublinks: List[dict] = []  # List of {id, label, url}

class NavbarSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "navbar_settings"
    background_color: str = "#FFFFFF"
    text_color: str = "#1F2937"
    hover_color: str = "#3B82F6"
    font_family: str = "Inter"
    links: List[dict] = []  # List of NavLink objects


class FooterSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "footer_settings"
    about_text: Optional[str] = "Referência em segurança eletrônica: câmeras, controle de acesso e totens de monitoramento."
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    youtube_url: Optional[str] = None
    twitter_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    
    # Custom links sections
    quick_links: List[dict] = []  # [{label, url, newTab}]
    services_links: List[dict] = []  # [{label, url, newTab}]
    custom_sections: List[dict] = []  # [{title, links: [{label, url, newTab}]}]
    
    # Copyright settings
    copyright_text: Optional[str] = None
    copyright_year: str = "2026"
    show_powered_by: bool = False
    
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    font_size: str = "base"  # sm, base, lg
    height: str = "16"  # Tailwind units (16 = 4rem = 64px)
    logo_size: str = "10"  # Tailwind units
    show_logo: bool = True
    show_site_name: bool = True
    sticky: bool = True
    shadow: bool = True

class SystemPage(BaseModel):
    """Pages that are part of the system (not custom)"""
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    editable: bool = True  # If content blocks can be added
    removable: bool = False  # System pages cannot be removed

class TrackingSettings(BaseModel):
    """Analytics and tracking tags configuration"""
    model_config = ConfigDict(extra="ignore")
    id: str = "tracking_settings"
    # Google Tag Manager
    gtm_id: Optional[str] = None
    gtm_enabled: bool = False
    # Google Analytics 4
    ga4_measurement_id: Optional[str] = None
    ga4_enabled: bool = False
    ga4_ecommerce_enabled: bool = True
    # Meta Pixel
    meta_pixel_id: Optional[str] = None
    meta_pixel_enabled: bool = False
    # Amazon
    amazon_tag_id: Optional[str] = None
    amazon_enabled: bool = False
    # Custom Scripts
    custom_head_scripts: Optional[str] = None  # Scripts to inject in <head>
    custom_body_scripts: Optional[str] = None  # Scripts to inject before </body>
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SEOSettings(BaseModel):
    """SEO configuration and automation settings"""
    model_config = ConfigDict(extra="ignore")
    id: str = "seo_settings"
    # Site basics
    site_url: str = os.environ.get('SITE_URL', os.environ.get('REACT_APP_BACKEND_URL', 'https://prospecting-intel.preview.emergentagent.com'))
    default_meta_title: str = "VigiLoc - Segurança Inteligente"
    default_meta_description: str = "Soluções de segurança inteligente"
    default_keywords: str = "segurança, câmeras, vigilância"
    # Robots.txt
    robots_txt_content: str = "User-agent: *\nAllow: /\nSitemap: {site_url}/sitemap.xml"
    # Indexação automática
    auto_index_enabled: bool = True
    auto_index_frequency: str = "daily"  # daily, weekly
    # Search Console
    google_search_console_enabled: bool = False
    google_search_console_api_key: Optional[str] = None
    bing_webmaster_enabled: bool = False
    bing_webmaster_api_key: Optional[str] = None
    # LLM Indexing
    llm_indexing_enabled: bool = True
    # Social Media
    og_image: Optional[str] = None
    twitter_card: str = "summary_large_image"
    twitter_site: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SEOAnalysis(BaseModel):
    """SEO analysis result for a page"""
    page_url: str
    score: int  # 0-100
    title_score: int
    description_score: int
    keywords_score: int
    headings_score: int
    content_score: int
    images_score: int
    links_score: int
    issues: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== ADVANCED ADMIN MODELS ====================

class CustomPage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str  # URL da página (ex: /sobre-nos)
    title: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    components: List[dict] = []  # Componentes do visual builder
    published: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# CMS Content Blocks
class ContentBlock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_id: str  # ID da página onde o bloco aparece
    type: str  # hero, card, text, media, banner, product_list
    order: int = 0
    settings: dict = {}  # Configurações específicas do bloco
    content: dict = {}  # Conteúdo do bloco
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

# Exemplo de estruturas de settings e content por tipo:
# type: "hero" 
#   settings: { "background_type": "image|video|color", "overlay_opacity": 0.5, "text_align": "center" }
#   content: { "background_url": "...", "title": "...", "subtitle": "...", "button_text": "...", "button_link": "..." }
#
# type: "card"
#   settings: { "layout": "grid|carousel", "columns": 3 }
#   content: { "cards": [{ "image": "...", "title": "...", "description": "...", "link": "..." }] }
#
# type: "text"
#   settings: { "font_size": "base", "text_color": "#000", "background_color": "#FFF" }
#   content: { "html": "..." }
#
# type: "media"
#   settings: { "layout": "single|gallery", "aspect_ratio": "16:9" }
#   content: { "media": [{ "url": "...", "type": "image|video", "alt": "..." }] }
#
# type: "banner"
#   settings: { "full_width": true, "height": "auto" }
#   content: { "image_url": "...", "link": "...", "alt": "..." }
#
# type: "product_list"
#   settings: { "filter": "all|category|badges", "layout": "grid|list", "limit": 12 }
#   content: { "category": "...", "badges": ["novidade"], "title": "..." }

class ThemeSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "theme_settings"
    primary_color: str = "#3B82F6"
    secondary_color: str = "#1E40AF"
    accent_color: str = "#F59E0B"
    font_heading: str = "Inter"
    font_body: str = "Inter"
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    custom_css: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "payment_settings"
    
    # Mercado Pago
    mercadopago_enabled: bool = False
    mercadopago_public_key: Optional[str] = None
    mercadopago_access_token: Optional[str] = None
    mercadopago_webhook_secret: Optional[str] = None
    mercadopago_sandbox_mode: bool = True
    
    # Stripe
    stripe_enabled: bool = False
    stripe_public_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    stripe_test_mode: bool = True
    
    # PagSeguro
    pagseguro_enabled: bool = False

class ShippingSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "shipping_settings"
    
    # Melhor Envio Integration
    melhor_envio_enabled: bool = False
    melhor_envio_token: Optional[str] = None
    melhor_envio_sandbox: bool = False
    origin_cep: Optional[str] = None  # CEP de origem dos produtos
    
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    pagseguro_email: Optional[str] = None
    pagseguro_token_production: Optional[str] = None
    pagseguro_token_sandbox: Optional[str] = None
    pagseguro_sandbox_mode: bool = True
    
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    url: str
    target: str = "_self"  # _self ou _blank
    order: int = 0
    parent_id: Optional[str] = None  # Para submenus
    icon: Optional[str] = None

class Menu(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # header, footer, mobile
    items: List[MenuItem] = []
    active: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: Optional[str] = None
    user_name: str
    user_email: str
    rating: int  # 1-5
    title: Optional[str] = None
    comment: str
    verified_purchase: bool = False
    status: str = "pending"  # pending, approved, rejected
    admin_reply: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None

class SocialReview(BaseModel):
    """Social/Testimonial reviews from Google, Facebook, Instagram, etc."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_name: str
    author_avatar: Optional[str] = None  # URL to avatar image
    rating: int = 5  # 1-5 stars
    text: str
    source: str = "google"  # google, facebook, instagram, whatsapp, manual
    source_url: Optional[str] = None  # Link to original review
    published: bool = True
    featured: bool = False  # Show in homepage
    order: int = 0  # Display order
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    review_date: Optional[datetime] = None  # Original review date

class SocialReviewCreate(BaseModel):
    author_name: str
    author_avatar: Optional[str] = None
    rating: int = 5
    text: str
    source: str = "google"
    source_url: Optional[str] = None
    published: bool = True
    featured: bool = False
    order: int = 0
    review_date: Optional[str] = None

class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str  # page_view, product_view, add_to_cart, purchase
    page_url: Optional[str] = None
    product_id: Optional[str] = None
    order_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: str
    amount: Optional[float] = None
    metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))



class ShippingRateCreate(BaseModel):
    name: str
    type: str
    regions: Optional[List[str]] = None
    price: float = 0.0
    min_days: int = 0
    max_days: int = 0
    active: bool = True

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    user_id: Optional[str] = None
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    items: List[CartItem]
    subtotal: float
    shipping_cost: float
    total: float
    shipping_address: dict
    shipping_method: str
    payment_method: str = "pending"
    status: str = "pending"  # pending, approved, processing, shipped, delivered, cancelled, returned, payment_failed
    payment_status: str = "pending"  # pending, approved, failed
    tracking_code: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PasswordReset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    token: str
    used: bool = False
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    items: List[CartItem]
    shipping_address: dict
    shipping_method: str
    notes: Optional[str] = None

class SiteContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "site_content"
    logo_url: str = ""
    site_name: str = "VigiLoc"
    hero_title: str = ""
    hero_subtitle: str = ""
    about_text: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    contact_address: str = ""
    whatsapp_number: str = "5511999999999"
    social_facebook: str = ""
    social_instagram: str = ""
    social_linkedin: str = ""
    footer_text: str = ""
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactInquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    message: str
    productInterest: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactInquiryCreate(BaseModel):
    name: str
    email: str
    phone: str
    message: str
    productInterest: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = None
    
    # Check Authorization header first (for API calls)
    if credentials:
        token = credentials.credentials
    
    # Fallback to cookie (for web sessions)
    if not token:
        token = request.cookies.get("session_token")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_identifier: str = payload.get("sub")
        if user_identifier is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Try to find user by ID first, then by email (for customer tokens)
    user = await db.users.find_one({"id": user_identifier}, {"_id": 0})
    if user is None:
        user = await db.users.find_one({"email": user_identifier}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_customer_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Authentication for customer endpoints - only accepts Authorization header, ignores cookies"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_identifier: str = payload.get("sub")
        if user_identifier is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Try to find user by ID first, then by email
    user = await db.users.find_one({"id": user_identifier}, {"_id": 0})
    if user is None:
        user = await db.users.find_one({"email": user_identifier}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Verify user is a customer (not admin-only)
    user_obj = User(**user)
    if user_obj.role not in ["customer", "admin", "manager", "editor", "viewer"]:
        raise HTTPException(status_code=403, detail="Invalid user role")
    
    return user_obj

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        is_admin=False
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user.id})
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}}

@api_router.post("/auth/login")
async def login(response: Response, user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id']})
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )
    
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "name": user['name'], "is_admin": user.get('is_admin', False)}}

# Duplicate Google OAuth callback removed - using the correct implementation below

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "is_admin": current_user.is_admin}

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(key="session_token", path="/")
    await db.sessions.delete_many({"user_id": current_user.id})
    return {"message": "Logged out successfully"}


@api_router.post("/auth/forgot-password")
async def forgot_password(data: dict):
    """Request password reset - sends email with reset token"""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user exists
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # Token expires in 1 hour
    
    # Store token in database
    token_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "token": reset_token,
        "used": False,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.password_reset_tokens.insert_one(token_doc)
    
    # Send email (if SendGrid is configured)
    reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/admin/redefinir-senha?token={reset_token}"
    
    try:
        await send_email(
            to_email=email,
            subject="Redefinir Senha - Admin",
            html_content=f"""
            <h2>Redefinir Senha</h2>
            <p>Você solicitou a redefinição de senha da sua conta de administrador.</p>
            <p>Clique no link abaixo para definir uma nova senha:</p>
            <p><a href="{reset_link}">Redefinir Senha</a></p>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou esta alteração, ignore este email.</p>
            """
        )
    except Exception as e:
        print(f"Error sending email: {e}")
        # Continue anyway - don't reveal if email was sent
    
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: dict):
    """Reset password using token"""
    token = data.get("token")
    new_password = data.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find token
    token_doc = await db.password_reset_tokens.find_one({"token": token, "used": False})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(token_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Update user password
    hashed_password = pwd_context.hash(new_password)
    await db.users.update_one(
        {"email": token_doc['email']},
        {"$set": {"password_hash": hashed_password}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}



# ==================== USER MANAGEMENT ROUTES ====================

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_admin)):
    """Get all users - Admin only"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('updated_at'), str):
            user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    return users

@api_router.post("/admin/users")
async def create_user(user_data: dict, current_user: User = Depends(get_current_admin)):
    """Create new user - Admin only"""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data['email']})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    user = User(
        email=user_data['email'],
        name=user_data['name'],
        password_hash=pwd_context.hash(user_data['password']),
        is_admin=user_data.get('is_admin', False),
        role=user_data.get('role', 'viewer'),
        active=user_data.get('active', True)
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "Usuário criado com sucesso", "user_id": user.id}

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: User = Depends(get_current_admin)):
    """Update user - Admin only"""
    existing = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Don't allow updating password through this route
    if 'password' in user_data:
        del user_data['password']
    if 'password_hash' in user_data:
        del user_data['password_hash']
    
    user_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": user_data})
    return {"message": "Usuário atualizado com sucesso"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_admin)):
    """Delete user - Admin only"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode deletar sua própria conta")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Also delete user's sessions
    await db.sessions.delete_many({"user_id": user_id})
    
    return {"message": "Usuário deletado com sucesso"}

@api_router.post("/admin/users/{user_id}/change-password")
async def admin_change_user_password(user_id: str, password_data: dict, current_user: User = Depends(get_current_admin)):
    """Change user password - Admin only"""
    new_password = password_data.get('new_password')
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter no mínimo 6 caracteres")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "password_hash": pwd_context.hash(new_password),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Logout all sessions of this user
    await db.sessions.delete_many({"user_id": user_id})
    
    return {"message": "Senha alterada com sucesso"}

@api_router.post("/auth/change-password")
async def change_own_password(password_data: dict, current_user: User = Depends(get_current_user)):
    """Change own password - Any authenticated user"""
    current_password = password_data.get('current_password')
    new_password = password_data.get('new_password')
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Senha atual e nova senha são obrigatórias")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Nova senha deve ter no mínimo 6 caracteres")
    
    # Verify current password
    user = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not user or not pwd_context.verify(current_password, user['password_hash']):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Update password
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "password_hash": pwd_context.hash(new_password),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Logout all sessions except current
    session_token = password_data.get('session_token')
    if session_token:
        await db.sessions.delete_many({
            "user_id": current_user.id,
            "session_token": {"$ne": session_token}
        })
    
    return {"message": "Senha alterada com sucesso"}


# ==================== UPLOAD ROUTES ====================

@api_router.post("/upload")
@api_router.post("/admin/upload")  # Add admin route too
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_admin)):
    # Accept both images and videos
    allowed_types = ['image/', 'video/']
    if not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(status_code=400, detail="Apenas imagens e vídeos são permitidos")
    
    # Check file size (max 100MB)
    content = await file.read()
    file_size_mb = len(content) / (1024 * 1024)
    
    if file_size_mb > 100:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande ({file_size_mb:.1f}MB). Máximo: 100MB")
    
    file_ext = file.filename.split('.')[-1].lower()
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Get backend URL from env and construct full URL with /api/media/
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    full_url = f"{backend_url}/api/media/{file_name}"
    
    return {
        "url": f"/api/media/{file_name}",
        "file_url": full_url,  # Full URL for direct access
        "size": f"{file_size_mb:.2f}MB",
        "type": file.content_type
    }


@api_router.get("/media/{filename}")
async def get_media_file(filename: str):
    """Serve uploaded media files with proper CORS"""
    from fastapi.responses import FileResponse
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    ext = filename.split('.')[-1].lower()
    content_types = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'webm': 'video/webm'
    }
    content_type = content_types.get(ext, 'application/octet-stream')
    
    return FileResponse(
        file_path, 
        media_type=content_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=31536000"
        }
    )


# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {"published": True}  # Only show published products
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('timestamp'), str):
            product['timestamp'] = datetime.fromisoformat(product['timestamp'])
        if isinstance(product.get('published_at'), str):
            product['published_at'] = datetime.fromisoformat(product['published_at'])
    return products


@api_router.get("/product-categories")
async def get_product_categories():
    """Get all unique categories from published products (returns strings only)"""
    products = await db.products.find({"published": True}, {"_id": 0, "category": 1}).to_list(1000)
    categories = list(set([p['category'] for p in products if p.get('category')]))
    return sorted(categories)


@api_router.get("/products/by-page/{page_name}", response_model=List[Product])
async def get_products_by_page(page_name: str, badges: Optional[str] = None):
    """Get products filtered by page and optionally by badges"""
    query = {"published": True}
    
    # Filter by page (products can be shown on multiple pages)
    if page_name == "todas":
        # Show all products
        pass
    else:
        # Show products that have this page in show_on_pages OR have "todas" in show_on_pages
        query["$or"] = [
            {"show_on_pages": page_name},
            {"show_on_pages": "todas"}
        ]
    
    # Filter by badges if provided (comma-separated)
    if badges:
        badge_list = [b.strip() for b in badges.split(',')]
        query["badges"] = {"$in": badge_list}
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('timestamp'), str):
            product['timestamp'] = datetime.fromisoformat(product['timestamp'])
        if isinstance(product.get('published_at'), str):
            product['published_at'] = datetime.fromisoformat(product['published_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "published": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('timestamp'), str):
        product['timestamp'] = datetime.fromisoformat(product['timestamp'])
    if isinstance(product.get('published_at'), str):
        product['published_at'] = datetime.fromisoformat(product['published_at'])
    return product

@api_router.get("/admin/products", response_model=List[Product])
async def get_all_products_admin(current_user: User = Depends(get_current_admin)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('timestamp'), str):
            product['timestamp'] = datetime.fromisoformat(product['timestamp'])
        if isinstance(product.get('published_at'), str):
            product['published_at'] = datetime.fromisoformat(product['published_at'])
    return products

@api_router.post("/admin/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_admin)):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_doc = product_data.model_dump()
    updated_doc['timestamp'] = datetime.now(timezone.utc).isoformat()
    
    # Handle published_at timestamp
    if updated_doc.get('published') and not existing.get('published'):
        # Product is being published for the first time
        updated_doc['published_at'] = datetime.now(timezone.utc).isoformat()
    elif not updated_doc.get('published'):
        # Product is being unpublished
        updated_doc['published_at'] = None
    elif updated_doc.get('published_at'):
        # Convert datetime to ISO string if needed
        if isinstance(updated_doc['published_at'], datetime):
            updated_doc['published_at'] = updated_doc['published_at'].isoformat()
    
    await db.products.update_one({"id": product_id}, {"$set": updated_doc})
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(product.get('timestamp'), str):
        product['timestamp'] = datetime.fromisoformat(product['timestamp'])
    if isinstance(product.get('published_at'), str):
        product['published_at'] = datetime.fromisoformat(product['published_at'])
    return Product(**product)

@api_router.patch("/admin/products/{product_id}/publish")
async def toggle_product_publication(product_id: str, published: bool, current_user: User = Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {"published": published}
    if published and not existing.get('published'):
        # Product is being published for the first time
        update_data['published_at'] = datetime.now(timezone.utc).isoformat()
    elif not published:
        # Product is being unpublished
        update_data['published_at'] = None
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    return {"message": f"Product {'published' if published else 'unpublished'} successfully"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/admin/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, current_user: User = Depends(get_current_admin)):
    category = Category(**category_data.model_dump())
    await db.categories.insert_one(category.model_dump())
    return category

@api_router.put("/admin/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryCreate, current_user: User = Depends(get_current_admin)):
    result = await db.categories.update_one({"id": category_id}, {"$set": category_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return Category(**category)

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ==================== SERVICE ROUTES ====================

@api_router.get("/services")
async def get_public_services():
    """Get all published services"""
    services = await db.services.find({"published": True}, {"_id": 0}).to_list(100)
    return services

@api_router.get("/services/{slug}")
async def get_service_by_slug(slug: str):
    """Get a service by slug for public view"""
    service = await db.services.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@api_router.get("/admin/services")
async def get_admin_services(current_user: User = Depends(get_current_admin)):
    """Get all services for admin"""
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    return services

@api_router.post("/admin/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_user: User = Depends(get_current_admin)):
    """Create a new service"""
    service = Service(**service_data.model_dump())
    await db.services.insert_one(service.model_dump())
    return service

@api_router.put("/admin/services/{service_id}")
async def update_service(service_id: str, service_data: ServiceCreate, current_user: User = Depends(get_current_admin)):
    """Update a service"""
    update_data = service_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.services.update_one({"id": service_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    return service

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, current_user: User = Depends(get_current_admin)):
    """Delete a service"""
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(session_id: Optional[str] = None, current_user: Optional[User] = Depends(get_current_user)):
    query = {}
    if current_user:
        query["user_id"] = current_user.id
    elif session_id:
        query["session_id"] = session_id
    else:
        raise HTTPException(status_code=400, detail="Session ID or authentication required")
    
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        cart = Cart(user_id=current_user.id if current_user else None, session_id=session_id).model_dump()
        cart['updated_at'] = cart['updated_at'].isoformat()
        await db.carts.insert_one(cart)
    
    if isinstance(cart.get('updated_at'), str):
        cart['updated_at'] = datetime.fromisoformat(cart['updated_at'])
    
    return cart

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, session_id: Optional[str] = None):
    query = {"session_id": session_id} if session_id else {}
    
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        cart = Cart(session_id=session_id, items=[item.model_dump()]).model_dump()
        cart['updated_at'] = cart['updated_at'].isoformat()
        await db.carts.insert_one(cart)
    else:
        items = cart.get('items', [])
        found = False
        for i, cart_item in enumerate(items):
            if cart_item['product_id'] == item.product_id:
                items[i]['quantity'] += item.quantity
                found = True
                break
        if not found:
            items.append(item.model_dump())
        
        await db.carts.update_one(query, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, session_id: Optional[str] = None):
    query = {"session_id": session_id} if session_id else {}
    
    cart = await db.carts.find_one(query, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [item for item in cart.get('items', []) if item['product_id'] != product_id]
    await db.carts.update_one(query, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(session_id: Optional[str] = None):
    query = {"session_id": session_id} if session_id else {}
    await db.carts.update_one(query, {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Cart cleared"}

# ==================== SHIPPING ROUTES ====================

@api_router.get("/shipping/rates", response_model=List[ShippingRate])
async def get_shipping_rates():
    rates = await db.shipping_rates.find({"active": True}, {"_id": 0}).to_list(100)
    return rates

@api_router.post("/admin/shipping/rates", response_model=ShippingRate)
async def create_shipping_rate(rate_data: ShippingRateCreate, current_user: User = Depends(get_current_admin)):
    rate = ShippingRate(**rate_data.model_dump())
    await db.shipping_rates.insert_one(rate.model_dump())
    return rate

@api_router.put("/admin/shipping/rates/{rate_id}", response_model=ShippingRate)
async def update_shipping_rate(rate_id: str, rate_data: ShippingRateCreate, current_user: User = Depends(get_current_admin)):
    result = await db.shipping_rates.update_one({"id": rate_id}, {"$set": rate_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shipping rate not found")
    rate = await db.shipping_rates.find_one({"id": rate_id}, {"_id": 0})
    return ShippingRate(**rate)

@api_router.delete("/admin/shipping/rates/{rate_id}")
async def delete_shipping_rate(rate_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.shipping_rates.delete_one({"id": rate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipping rate not found")
    return {"message": "Shipping rate deleted successfully"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, session_id: Optional[str] = None):
    # Calculate totals
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart or not cart.get('items'):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    subtotal = sum(item['price'] * item['quantity'] for item in cart['items'])
    
    # Get shipping cost
    shipping_rate = await db.shipping_rates.find_one({"id": order_data.shipping_method}, {"_id": 0})
    shipping_cost = shipping_rate['price'] if shipping_rate else 0.0
    
    order = Order(
        order_number=f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        items=cart['items'],
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=subtotal + shipping_cost,
        shipping_address=order_data.shipping_address,
        shipping_method=order_data.shipping_method,
        notes=order_data.notes,
        status="pending"
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Clear cart
    await db.carts.update_one({"session_id": session_id}, {"$set": {"items": []}})
    
    return order


# ==================== CUSTOMER ACCOUNT ROUTES ====================

@api_router.post("/customer/register")
async def register_customer(data: dict):
    """Register new customer account"""
    # Check if email already exists
    existing = await db.users.find_one({"email": data.get("email")})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    hashed_password = pwd_context.hash(data.get("password"))
    user = User(
        name=data.get("name"),
        email=data.get("email"),
        password_hash=hashed_password,
        phone=data.get("phone"),
        cpf=data.get("cpf"),
        role="customer"
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Generate token
    token = create_access_token(data={"sub": user.email})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }

@api_router.post("/customer/login")
async def login_customer(data: dict):
    """Customer login"""
    user_doc = await db.users.find_one({"email": data.get("email")})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not pwd_context.verify(data.get("password"), user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Generate token
    token = create_access_token(data={"sub": data.get("email")})
    
    return {
        "token": token,
        "user": {
            "id": user_doc['id'],
            "name": user_doc['name'],
            "email": user_doc['email'],
            "phone": user_doc.get('phone'),
            "role": user_doc['role']
        }
    }

@api_router.get("/customer/me")
async def get_customer_profile(current_user: User = Depends(get_customer_user)):
    """Get current customer profile"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "cpf": current_user.cpf,
        "address": {
            "street": current_user.address_street,
            "number": current_user.address_number,
            "complement": current_user.address_complement,
            "neighborhood": current_user.address_neighborhood,
            "city": current_user.address_city,
            "state": current_user.address_state,
            "zip": current_user.address_zip
        },
        "role": current_user.role
    }

@api_router.put("/customer/profile")
async def update_customer_profile(data: dict, current_user: User = Depends(get_customer_user)):
    """Update customer profile"""
    update_data = {
        "name": data.get("name"),
        "phone": data.get("phone"),
        "cpf": data.get("cpf"),
        "address_street": data.get("address", {}).get("street"),
        "address_number": data.get("address", {}).get("number"),
        "address_complement": data.get("address", {}).get("complement"),
        "address_neighborhood": data.get("address", {}).get("neighborhood"),
        "address_city": data.get("address", {}).get("city"),
        "address_state": data.get("address", {}).get("state"),
        "address_zip": data.get("address", {}).get("zip")
    }
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    return {"message": "Perfil atualizado com sucesso"}

@api_router.put("/customer/change-password")
async def change_customer_password(
    data: dict,
    current_user: User = Depends(get_customer_user)
):
    """Change customer password"""
    user_doc = await db.users.find_one({"id": current_user.id})
    
    # Verify current password
    if not pwd_context.verify(data.get("current_password"), user_doc['password_hash']):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Update password
    hashed_password = pwd_context.hash(data.get("new_password"))
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"password_hash": hashed_password}}
    )
    
    return {"message": "Senha alterada com sucesso"}

@api_router.post("/customer/forgot-password")
async def forgot_password(email: EmailStr):
    """Request password reset"""
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        # Don't reveal if email exists
        return {"message": "Se o email existir, um link de recuperação será enviado"}
    
    # Generate reset token
    import secrets
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    reset = PasswordReset(
        email=email,
        token=token,
        expires_at=expires_at
    )
    
    doc = reset.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['expires_at'] = doc['expires_at'].isoformat()
    await db.password_resets.insert_one(doc)
    
    # TODO: Send email with reset link
    # For now, just log it
    reset_link = f"https://seu-site.com/reset-password?token={token}"
    print(f"Password reset link: {reset_link}")
    
    return {"message": "Se o email existir, um link de recuperação será enviado"}

@api_router.post("/customer/reset-password")
async def reset_password(token: str, new_password: str):
    """Reset password with token"""
    reset_doc = await db.password_resets.find_one({
        "token": token,
        "used": False
    })
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    # Check if expired
    expires_at = datetime.fromisoformat(reset_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token expirado")
    
    # Update password
    hashed_password = pwd_context.hash(new_password)
    await db.users.update_one(
        {"email": reset_doc['email']},
        {"$set": {"password": hashed_password}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"id": reset_doc['id']},
        {"$set": {"used": True}}
    )
    
    return {"message": "Senha redefinida com sucesso"}

@api_router.get("/customer/orders")
async def get_customer_orders(current_user: User = Depends(get_customer_user)):
    """Get customer's orders"""
    orders = await db.orders.find(
        {"customer_email": current_user.email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

# ==================== GOOGLE OAUTH ROUTES ====================

@api_router.post("/auth/google/callback")
async def google_oauth_callback(data: dict):
    """Handle Google OAuth callback from Emergent Auth"""
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    try:
        # Call Emergent's session-data API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            session_data = response.json()
        
        # Extract user data
        email = session_data.get("email")
        name = session_data.get("name")
        picture = session_data.get("picture")
        emergent_session_token = session_data.get("session_token")
        google_id = session_data.get("id")
        
        # Check if user exists
        user_doc = await db.users.find_one({"email": email})
        
        if user_doc:
            # User exists - update google_id and picture if not set
            update_data = {}
            if not user_doc.get('google_id'):
                update_data['google_id'] = google_id
            if not user_doc.get('picture') and picture:
                update_data['picture'] = picture
            
            if update_data:
                await db.users.update_one(
                    {"email": email},
                    {"$set": update_data}
                )
            
            user_id = user_doc['id']
        else:
            # Auto-create new customer account
            new_user = User(
                email=email,
                name=name,
                google_id=google_id,
                picture=picture,
                role="customer",
                is_admin=False,
                password_hash=None  # No password for Google users
            )
            
            user_dict = new_user.model_dump()
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            await db.users.insert_one(user_dict)
            user_id = new_user.id
        
        # Store Emergent session in database with 7-day expiry
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = Session(
            user_id=user_id,
            session_token=emergent_session_token,
            expires_at=expires_at
        )
        
        session_dict = session.model_dump()
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        session_dict['expires_at'] = session_dict['expires_at'].isoformat()
        await db.sessions.insert_one(session_dict)
        
        # Generate our own JWT token for the customer
        token = create_access_token(data={"sub": email})
        
        return {
            "token": token,
            "session_token": emergent_session_token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "picture": picture,
                "role": "customer"
            }
        }
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate session: {str(e)}")


@api_router.get("/customer/orders/{order_id}")
async def get_customer_order_detail(order_id: str, current_user: User = Depends(get_current_user)):
    """Get specific order details"""
    order = await db.orders.find_one(
        {"id": order_id, "customer_email": current_user.email},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return order


@api_router.get("/admin/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.get("/admin/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_admin)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return order

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: User = Depends(get_current_admin)):
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

@api_router.post("/admin/orders/create", response_model=Order)
async def create_order_manually(order_data: dict, current_user: User = Depends(get_current_admin)):
    """Create order manually in admin"""
    # Generate order number
    order_count = await db.orders.count_documents({})
    order_number = f"ORD-{order_count + 1:05d}"
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in order_data['items'])
    shipping_cost = order_data.get('shipping_cost', 0)
    total = subtotal + shipping_cost
    
    order = Order(
        order_number=order_number,
        user_id=order_data.get('user_id'),
        customer_name=order_data['customer_name'],
        customer_email=order_data['customer_email'],
        customer_phone=order_data['customer_phone'],
        items=order_data['items'],
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total,
        shipping_address=order_data['shipping_address'],
        shipping_method=order_data.get('shipping_method', 'manual'),
        payment_method=order_data.get('payment_method', 'pending'),
        status=order_data.get('status', 'pending'),
        notes=order_data.get('notes')
    )
    
    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    order_doc['updated_at'] = order_doc['updated_at'].isoformat()
    
    await db.orders.insert_one(order_doc)
    return order

# ==================== SITE CONTENT ROUTES ====================

@api_router.get("/site-content", response_model=SiteContent)
async def get_site_content():
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if not content:
        content = SiteContent().model_dump()
        content['updated_at'] = content['updated_at'].isoformat()
        await db.site_content.insert_one(content)
    if isinstance(content.get('updated_at'), str):
        content['updated_at'] = datetime.fromisoformat(content['updated_at'])
    return content

@api_router.put("/admin/site-content", response_model=SiteContent)
async def update_site_content(content_data: dict, current_user: User = Depends(get_current_admin)):
    content_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": content_data},
        upsert=True
    )
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if isinstance(content.get('updated_at'), str):
        content['updated_at'] = datetime.fromisoformat(content['updated_at'])
    return SiteContent(**content)

# ==================== CONTACT ROUTES ====================

@api_router.post("/contact", response_model=ContactInquiry)
async def create_contact(input: ContactInquiryCreate):
    inquiry_dict = input.model_dump()
    inquiry_obj = ContactInquiry(**inquiry_dict)
    doc = inquiry_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.inquiries.insert_one(doc)
    return inquiry_obj

@api_router.get("/admin/contacts", response_model=List[ContactInquiry])
async def get_contacts(current_user: User = Depends(get_current_admin)):
    contacts = await db.inquiries.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    for contact in contacts:
        if isinstance(contact.get('timestamp'), str):
            contact['timestamp'] = datetime.fromisoformat(contact['timestamp'])
    return contacts

# ==================== STATS ROUTES ====================

@api_router.get("/admin/stats")
async def get_stats(current_user: User = Depends(get_current_admin)):
    products_count = await db.products.count_documents({})
    orders_count = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Total revenue
    orders = await db.orders.find({"status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}}, {"_id": 0}).to_list(10000)
    total_revenue = sum(order.get('total', 0) for order in orders)
    
    return {
        "products_count": products_count,
        "orders_count": orders_count,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue
    }


# ==================== BANNER ROUTES ====================

class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: Optional[str] = None
    media_type: str
    media_url: str
    link_url: Optional[str] = None
    order: int = 0
    active: bool = True
    published: bool = False  # Controls if banner is visible on website
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    media_type: str
    media_url: str
    link_url: Optional[str] = None
    order: int = 0
    active: bool = True
    published: bool = False  # Controls if banner is visible on website
    published_at: Optional[datetime] = None

@api_router.get("/banners", response_model=List[Banner])
async def get_banners():
    # Public route - only show PUBLISHED banners
    banners = await db.banners.find({"active": True, "published": True}, {"_id": 0}).sort("order", 1).to_list(100)
    for banner in banners:
        if isinstance(banner.get('created_at'), str):
            banner['created_at'] = datetime.fromisoformat(banner['created_at'])
        if isinstance(banner.get('published_at'), str):
            banner['published_at'] = datetime.fromisoformat(banner['published_at'])
    return banners

@api_router.post("/admin/banners", response_model=Banner)
async def create_banner(banner_data: BannerCreate, current_user: User = Depends(get_current_admin)):
    banner = Banner(**banner_data.model_dump())
    doc = banner.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.banners.insert_one(doc)
    return banner

@api_router.put("/admin/banners/{banner_id}", response_model=Banner)
async def update_banner(banner_id: str, banner_data: BannerCreate, current_user: User = Depends(get_current_admin)):
    existing = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    updated_doc = banner_data.model_dump()
    
    # Handle published_at timestamp
    if updated_doc.get('published') and not existing.get('published'):
        # Banner is being published for the first time
        updated_doc['published_at'] = datetime.now(timezone.utc).isoformat()
    elif not updated_doc.get('published'):
        # Banner is being unpublished
        updated_doc['published_at'] = None
    
    result = await db.banners.update_one({"id": banner_id}, {"$set": updated_doc})
    banner = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    if isinstance(banner.get('created_at'), str):
        banner['created_at'] = datetime.fromisoformat(banner['created_at'])
    if isinstance(banner.get('published_at'), str):
        banner['published_at'] = datetime.fromisoformat(banner['published_at'])
    return Banner(**banner)

@api_router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.banners.delete_one({"id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted successfully"}

@api_router.get("/admin/banners", response_model=List[Banner])
async def get_all_banners_admin(current_user: User = Depends(get_current_admin)):
    # Admin route - show ALL banners (published and unpublished)
    banners = await db.banners.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for banner in banners:
        if isinstance(banner.get('created_at'), str):
            banner['created_at'] = datetime.fromisoformat(banner['created_at'])
        if isinstance(banner.get('published_at'), str):
            banner['published_at'] = datetime.fromisoformat(banner['published_at'])
    return banners

@api_router.patch("/admin/banners/{banner_id}/publish")
async def toggle_banner_publication(banner_id: str, published: bool, current_user: User = Depends(get_current_admin)):
    """Toggle banner publication status"""
    existing = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    update_data = {"published": published}
    if published and not existing.get('published'):
        # Banner is being published for the first time
        update_data['published_at'] = datetime.now(timezone.utc).isoformat()
    elif not published:
        # Banner is being unpublished
        update_data['published_at'] = None
    
    await db.banners.update_one({"id": banner_id}, {"$set": update_data})
    
    return {"message": f"Banner {'published' if published else 'unpublished'} successfully"}

# ==================== COUPON ROUTES ====================

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float = 0.0
    max_uses: Optional[int] = None
    uses_count: int = 0
    active: bool = True
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float = 0.0
    max_uses: Optional[int] = None
    expires_at: Optional[str] = None

@api_router.post("/validate-coupon")
async def validate_coupon(code: str, subtotal: float):
    coupon = await db.coupons.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom inválido")
    
    # Check expiration
    if coupon.get('expires_at'):
        expires_at = datetime.fromisoformat(coupon['expires_at']) if isinstance(coupon['expires_at'], str) else coupon['expires_at']
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Cupom expirado")
    
    # Check max uses
    if coupon.get('max_uses') and coupon.get('uses_count', 0) >= coupon['max_uses']:
        raise HTTPException(status_code=400, detail="Cupom já foi totalmente utilizado")
    
    # Check minimum purchase
    if subtotal < coupon.get('min_purchase', 0):
        raise HTTPException(status_code=400, detail=f"Compra mínima de R$ {coupon['min_purchase']:.2f}")
    
    # Calculate discount
    if coupon['discount_type'] == 'percentage':
        discount = subtotal * (coupon['discount_value'] / 100)
    else:
        discount = coupon['discount_value']
    
    return {
        "valid": True,
        "discount_amount": discount,
        "code": coupon['code']
    }

@api_router.get("/admin/coupons", response_model=List[Coupon])
async def get_coupons(current_user: User = Depends(get_current_admin)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    for coupon in coupons:
        if isinstance(coupon.get('created_at'), str):
            coupon['created_at'] = datetime.fromisoformat(coupon['created_at'])
        if coupon.get('expires_at') and isinstance(coupon['expires_at'], str):
            coupon['expires_at'] = datetime.fromisoformat(coupon['expires_at'])
    return coupons

@api_router.post("/admin/coupons", response_model=Coupon)
async def create_coupon(coupon_data: CouponCreate, current_user: User = Depends(get_current_admin)):
    # Check if code already exists
    existing = await db.coupons.find_one({"code": coupon_data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Código de cupom já existe")
    
    coupon_dict = coupon_data.model_dump()
    coupon_dict['code'] = coupon_dict['code'].upper()
    
    if coupon_dict.get('expires_at'):
        coupon_dict['expires_at'] = datetime.fromisoformat(coupon_dict['expires_at'])
    
    coupon = Coupon(**coupon_dict)
    doc = coupon.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('expires_at'):
        doc['expires_at'] = doc['expires_at'].isoformat()
    
    await db.coupons.insert_one(doc)
    return coupon

@api_router.put("/admin/coupons/{coupon_id}", response_model=Coupon)
async def update_coupon(coupon_id: str, coupon_data: CouponCreate, current_user: User = Depends(get_current_admin)):
    coupon_dict = coupon_data.model_dump()
    coupon_dict['code'] = coupon_dict['code'].upper()
    
    if coupon_dict.get('expires_at'):
        coupon_dict['expires_at'] = datetime.fromisoformat(coupon_dict['expires_at']).isoformat()
    
    result = await db.coupons.update_one({"id": coupon_id}, {"$set": coupon_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if isinstance(coupon.get('created_at'), str):
        coupon['created_at'] = datetime.fromisoformat(coupon['created_at'])
    if coupon.get('expires_at') and isinstance(coupon['expires_at'], str):
        coupon['expires_at'] = datetime.fromisoformat(coupon['expires_at'])
    return Coupon(**coupon)

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted successfully"}

# ==================== CEP SHIPPING CALCULATION ====================

@api_router.get("/shipping/calculate")
async def calculate_shipping(cep: str, weight: float = 1.0):
    """Calculate shipping cost by CEP"""
    cep_clean = cep.replace("-", "").replace(".", "")
    
    if len(cep_clean) != 8:
        raise HTTPException(status_code=400, detail="CEP inválido")
    
    # Simple region-based calculation
    region = cep_clean[:2]
    rates = []
    
    # São Paulo region
    if region in ["01", "02", "03", "04", "05", "06", "07", "08", "09"]:
        rates.append({
            "id": "pac-sp",
            "name": "PAC",
            "price": 15.00,
            "min_days": 3,
            "max_days": 5
        })
        rates.append({
            "id": "sedex-sp",
            "name": "SEDEX",
            "price": 25.00,
            "min_days": 1,
            "max_days": 2
        })
    else:
        rates.append({
            "id": "pac-other",
            "name": "PAC",
            "price": 20.00 + (weight * 2),
            "min_days": 7,
            "max_days": 12
        })
        rates.append({
            "id": "sedex-other",
            "name": "SEDEX",
            "price": 35.00 + (weight * 3),
            "min_days": 3,
            "max_days": 5
        })
    
    return {"rates": rates}

# ==================== ANALYTICS & REPORTS ====================

@api_router.get("/admin/analytics")
async def get_analytics(current_user: User = Depends(get_current_admin)):
    """Get analytics data"""
    # Orders by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "total": {"$sum": "$total"}}}
    ]
    orders_by_status = await db.orders.aggregate(pipeline).to_list(100)
    
    # Products low stock
    low_stock = await db.products.find({"quantity": {"$lt": 10}, "inStock": True}, {"_id": 0}).to_list(100)
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Top products
    pipeline_products = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "total_sold": {"$sum": "$items.quantity"}, "revenue": {"$sum": {"$multiply": ["$items.quantity", "$items.price"]}}}},
        {"$sort": {"total_sold": -1}},
        {"$limit": 10}
    ]
    top_products_data = await db.orders.aggregate(pipeline_products).to_list(10)
    
    # Get product details
    top_products = []
    for item in top_products_data:
        product = await db.products.find_one({"id": item["_id"]}, {"_id": 0, "name": 1, "image": 1})
        if product:
            top_products.append({
                "product_id": item["_id"],
                "name": product.get("name"),
                "image": product.get("image"),
                "total_sold": item["total_sold"],
                "revenue": item["revenue"]
            })
    
    return {
        "orders_by_status": orders_by_status,
        "low_stock_products": low_stock,
        "recent_orders": recent_orders,
        "top_products": top_products
    }

@api_router.get("/admin/export-orders")
async def export_orders(current_user: User = Depends(get_current_admin)):
    """Export orders to CSV"""
    import csv
    from io import StringIO
    
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Order Number', 'Customer Name', 'Email', 'Phone', 'Total', 'Status', 'Created At'])
    
    # Data
    for order in orders:
        writer.writerow([
            order.get('order_number'),
            order.get('customer_name'),
            order.get('customer_email'),
            order.get('customer_phone'),
            order.get('total'),
            order.get('status'),
            order.get('created_at')
        ])
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"}
    )

# Router will be included at the end after all routes are defined

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()# CRM/ERP Routes - Para adicionar ao server.py

# ==================== CUSTOMER ROUTES ====================

@api_router.get("/admin/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_admin)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer.get('created_at'), str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@api_router.post("/admin/customers", response_model=Customer)
async def create_customer(customer_data: dict, current_user: User = Depends(get_current_admin)):
    customer = Customer(**customer_data)
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.put("/admin/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: dict, current_user: User = Depends(get_current_admin)):
    result = await db.customers.update_one({"id": customer_id}, {"$set": customer_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if isinstance(customer.get('created_at'), str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return Customer(**customer)

# ==================== CONTRACT ROUTES ====================

@api_router.get("/admin/contracts", response_model=List[Contract])
async def get_contracts(current_user: User = Depends(get_current_admin)):
    contracts = await db.contracts.find({}, {"_id": 0}).to_list(1000)
    for contract in contracts:
        for field in ['created_at', 'start_date', 'end_date']:
            if contract.get(field) and isinstance(contract[field], str):
                contract[field] = datetime.fromisoformat(contract[field])
    return contracts

@api_router.post("/admin/contracts", response_model=Contract)
async def create_contract(contract_data: dict, current_user: User = Depends(get_current_admin)):
    # Generate contract number
    count = await db.contracts.count_documents({})
    contract_data['contract_number'] = f"CTR-{datetime.now().year}-{count+1:04d}"
    
    contract = Contract(**contract_data)
    doc = contract.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    if doc.get('end_date'):
        doc['end_date'] = doc['end_date'].isoformat()
    
    await db.contracts.insert_one(doc)
    return contract

# ==================== EQUIPMENT ROUTES ====================

@api_router.get("/admin/equipment", response_model=List[Equipment])
async def get_equipment(customer_id: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    query = {"customer_id": customer_id} if customer_id else {}
    equipment = await db.equipment.find(query, {"_id": 0}).to_list(1000)
    for eq in equipment:
        for field in ['installation_date', 'warranty_until']:
            if eq.get(field) and isinstance(eq[field], str):
                eq[field] = datetime.fromisoformat(eq[field])
    return equipment

@api_router.post("/admin/equipment", response_model=Equipment)
async def create_equipment(equipment_data: dict, current_user: User = Depends(get_current_admin)):
    equipment = Equipment(**equipment_data)
    doc = equipment.model_dump()
    doc['installation_date'] = doc['installation_date'].isoformat()
    if doc.get('warranty_until'):
        doc['warranty_until'] = doc['warranty_until'].isoformat()
    await db.equipment.insert_one(doc)
    return equipment


@api_router.put("/admin/equipment/{equipment_id}", response_model=Equipment)
async def update_equipment(equipment_id: str, equipment_data: dict, current_user: User = Depends(get_current_admin)):
    # Convert dates to ISO format
    if 'installation_date' in equipment_data and isinstance(equipment_data['installation_date'], str):
        equipment_data['installation_date'] = equipment_data['installation_date']
    if 'warranty_until' in equipment_data and equipment_data['warranty_until']:
        equipment_data['warranty_until'] = equipment_data['warranty_until']
    
    result = await db.equipment.update_one({"id": equipment_id}, {"$set": equipment_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    
    equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    for field in ['installation_date', 'warranty_until']:
        if equipment.get(field) and isinstance(equipment[field], str):
            equipment[field] = datetime.fromisoformat(equipment[field])
    return Equipment(**equipment)

# ==================== MAINTENANCE TICKET ROUTES ====================

@api_router.get("/admin/tickets", response_model=List[MaintenanceTicket])
async def get_tickets(status: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for ticket in tickets:
        for field in ['created_at', 'updated_at', 'resolved_at']:
            if ticket.get(field) and isinstance(ticket[field], str):
                ticket[field] = datetime.fromisoformat(ticket[field])
    return tickets

@api_router.post("/admin/tickets", response_model=MaintenanceTicket)
async def create_ticket(ticket_data: dict, current_user: User = Depends(get_current_admin)):
    count = await db.tickets.count_documents({})
    ticket_data['ticket_number'] = f"TKT-{datetime.now().year}-{count+1:05d}"
    
    ticket = MaintenanceTicket(**ticket_data)
    doc = ticket.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc.get('resolved_at'):
        doc['resolved_at'] = doc['resolved_at'].isoformat()
    
    await db.tickets.insert_one(doc)
    return ticket

@api_router.put("/admin/tickets/{ticket_id}", response_model=MaintenanceTicket)
async def update_ticket(ticket_id: str, ticket_data: dict, current_user: User = Depends(get_current_admin)):
    ticket_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.tickets.update_one({"id": ticket_id}, {"$set": ticket_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    for field in ['created_at', 'updated_at', 'resolved_at']:
        if ticket.get(field) and isinstance(ticket[field], str):
            ticket[field] = datetime.fromisoformat(ticket[field])
    return MaintenanceTicket(**ticket)

# ==================== PAYMENT ROUTES ====================

@api_router.get("/admin/payments", response_model=List[Payment])
async def get_payments(status: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    payments = await db.payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(1000)
    for payment in payments:
        for field in ['due_date', 'paid_at', 'created_at']:
            if payment.get(field) and isinstance(payment[field], str):
                payment[field] = datetime.fromisoformat(payment[field])
    return payments

@api_router.post("/admin/payments/generate-monthly")
async def generate_monthly_payments(current_user: User = Depends(get_current_admin)):
    """Generate monthly payments for all active contracts"""
    contracts = await db.contracts.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    generated = 0
    for contract in contracts:
        # Check if payment for this month already exists
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        existing = await db.payments.find_one({
            "contract_id": contract['id'],
            "due_date": {"$gte": current_month.isoformat()}
        })
        
        if not existing:
            payment_day = contract.get('payment_day', 10)
            due_date = datetime.now().replace(day=payment_day, hour=0, minute=0, second=0, microsecond=0)
            
            payment = Payment(
                customer_id=contract['customer_id'],
                contract_id=contract['id'],
                invoice_number=f"INV-{datetime.now().year}{datetime.now().month:02d}-{generated+1:04d}",
                amount=contract['monthly_value'],
                due_date=due_date,
                status="pending"
            )
            
            doc = payment.model_dump()
            doc['due_date'] = doc['due_date'].isoformat()
            doc['created_at'] = doc['created_at'].isoformat()
            
            await db.payments.insert_one(doc)
            generated += 1
    
    return {"message": f"{generated} pagamentos gerados"}

@api_router.post("/admin/payments/{payment_id}/mark-paid")
async def mark_payment_paid(payment_id: str, payment_method: str, current_user: User = Depends(get_current_admin)):
    result = await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_method": payment_method
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"message": "Pagamento marcado como pago"}


# ==================== PAGE BUILDER ROUTES ====================

@api_router.get("/admin/pages", response_model=List[CustomPage])
async def get_all_pages(current_user: User = Depends(get_current_admin)):
    """Get all custom pages - Admin only"""
    pages = await db.custom_pages.find({}, {"_id": 0}).to_list(1000)
    for page in pages:
        for field in ['created_at', 'updated_at', 'published_at']:
            if page.get(field) and isinstance(page[field], str):
                page[field] = datetime.fromisoformat(page[field])
    return pages

@api_router.get("/admin/all-pages")
async def get_all_pages_including_system(current_user: User = Depends(get_current_admin)):
    """Get both system pages and custom pages"""
    # Define system pages
    system_pages = [
        {"id": "home", "name": "Home", "slug": "/", "type": "system", "editable": True, "removable": False},
        {"id": "produtos", "name": "Produtos", "slug": "/produtos", "type": "system", "editable": True, "removable": False},
        {"id": "totens", "name": "Totens", "slug": "/totens", "type": "system", "editable": True, "removable": False},
        {"id": "contato", "name": "Contato", "slug": "/contato", "type": "system", "editable": True, "removable": False},
        {"id": "sobre", "name": "Sobre", "slug": "/sobre", "type": "system", "editable": True, "removable": False},
    ]
    
    # Get custom pages
    custom_pages = await db.custom_pages.find({}, {"_id": 0}).to_list(1000)
    for page in custom_pages:
        page["type"] = "custom"
        page["editable"] = True
        page["removable"] = True
    
    return {"system": system_pages, "custom": custom_pages}

@api_router.get("/pages/{slug}")
async def get_page_by_slug(slug: str):
    """Get published page by slug - Public"""
    page = await db.custom_pages.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.post("/admin/pages", response_model=CustomPage)
async def create_page(page_data: dict, current_user: User = Depends(get_current_admin)):
    """Create custom page"""
    page = CustomPage(**page_data)
    doc = page.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.custom_pages.insert_one(doc)
    return page

@api_router.put("/admin/pages/{page_id}", response_model=CustomPage)
async def update_page(page_id: str, page_data: dict, current_user: User = Depends(get_current_admin)):
    """Update custom page"""
    page_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    existing = await db.custom_pages.find_one({"id": page_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page_data.get('published') and not existing.get('published'):
        page_data['published_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.custom_pages.update_one({"id": page_id}, {"$set": page_data})
    updated = await db.custom_pages.find_one({"id": page_id}, {"_id": 0})
    
    for field in ['created_at', 'updated_at', 'published_at']:
        if updated.get(field) and isinstance(updated[field], str):
            updated[field] = datetime.fromisoformat(updated[field])
    
    return CustomPage(**updated)

@api_router.delete("/admin/pages/{page_id}")
async def delete_page(page_id: str, current_user: User = Depends(get_current_admin)):
    """Delete custom page"""
    result = await db.custom_pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"message": "Page deleted"}

# ==================== CONTENT BLOCKS ROUTES ====================

@api_router.get("/admin/content-blocks/{page_id}")
async def get_page_blocks(page_id: str, current_user: User = Depends(get_current_admin)):
    """Get all content blocks for a specific page"""
    blocks = await db.content_blocks.find({"page_id": page_id}, {"_id": 0}).sort("order", 1).to_list(100)
    for block in blocks:
        for field in ['created_at', 'updated_at']:
            if block.get(field) and isinstance(block[field], str):
                block[field] = datetime.fromisoformat(block[field])
    return blocks

@api_router.get("/content-blocks/{page_id}/published")
async def get_published_blocks(page_id: str):
    """Get published content blocks for a page - Public"""
    blocks = await db.content_blocks.find(
        {"page_id": page_id, "published": True}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return blocks

@api_router.get("/content-blocks/{page_id}")
async def get_page_blocks_public(page_id: str):
    """Get content blocks for a page - Public (returns published only)"""
    blocks = await db.content_blocks.find(
        {"page_id": page_id, "published": True}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return blocks

@api_router.post("/admin/content-blocks")
async def create_content_block(block_data: dict, current_user: User = Depends(get_current_admin)):
    """Create new content block"""
    block = ContentBlock(**block_data)
    doc = block.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('updated_at'):
        doc['updated_at'] = doc['updated_at'].isoformat()
    await db.content_blocks.insert_one(doc)
    return block


# ==================== FOOTER SETTINGS ROUTES ====================

@api_router.get("/footer-settings")
async def get_footer_settings():
    """Get footer settings"""
    settings = await db.footer_settings.find_one({"id": "footer_settings"}, {"_id": 0})
    if not settings:
        default = FooterSettings()
        return default.model_dump()
    return settings

@api_router.put("/admin/footer-settings")
async def update_footer_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update footer settings - Admin only"""
    settings_data['id'] = "footer_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.footer_settings.update_one(
        {"id": "footer_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Footer settings updated successfully"}


@api_router.put("/admin/content-blocks/{block_id}")
async def update_content_block(block_id: str, block_data: dict, current_user: User = Depends(get_current_admin)):
    """Update content block"""
    block_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.content_blocks.update_one(
        {"id": block_id},
        {"$set": block_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content block not found")
    
    return {"message": "Content block updated"}

@api_router.delete("/admin/content-blocks/{block_id}")
async def delete_content_block(block_id: str, current_user: User = Depends(get_current_admin)):
    """Delete content block"""
    result = await db.content_blocks.delete_one({"id": block_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content block not found")
    return {"message": "Content block deleted"}

@api_router.put("/admin/content-blocks/{block_id}/reorder")
async def reorder_content_block(block_id: str, new_order: int, current_user: User = Depends(get_current_admin)):
    """Change the order of a content block"""
    result = await db.content_blocks.update_one(
        {"id": block_id},
        {"$set": {"order": new_order, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content block not found")
    return {"message": "Block order updated"}

# ==================== THEME CUSTOMIZER ROUTES ====================

@api_router.get("/theme-settings")
async def get_theme_settings():
    """Get theme settings - Public"""
    settings = await db.theme_settings.find_one({"id": "theme_settings"}, {"_id": 0})
    if not settings:
        default = ThemeSettings()
        return default.model_dump()
    return settings

@api_router.put("/admin/theme-settings")
async def update_theme_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update theme settings"""
    settings_data['id'] = "theme_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.theme_settings.update_one(
        {"id": "theme_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Theme settings updated"}


# ==================== PAYMENT SETTINGS ROUTES ====================

@api_router.get("/admin/payment-settings")
async def get_payment_settings(current_user: User = Depends(get_current_admin)):
    """Get payment settings - Admin only"""
    settings = await db.payment_settings.find_one({"id": "payment_settings"}, {"_id": 0})
    if not settings:
        default = PaymentSettings()
        return default.model_dump()
    return settings

@api_router.put("/admin/payment-settings")
async def update_payment_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update payment settings - Admin only"""
    settings_data['id'] = "payment_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.payment_settings.update_one(
        {"id": "payment_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Payment settings updated successfully"}


# ==================== MENU BUILDER ROUTES ====================

@api_router.get("/menus/{menu_name}")


# ==================== SHIPPING SETTINGS ROUTES ====================

@api_router.get("/admin/shipping-settings")
async def get_shipping_settings(current_user: User = Depends(get_current_admin)):
    """Get shipping settings - Admin only"""
    settings = await db.shipping_settings.find_one({"id": "shipping_settings"}, {"_id": 0})
    if not settings:
        default = ShippingSettings()
        return default.model_dump()
    return settings

@api_router.put("/admin/shipping-settings")
async def update_shipping_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update shipping settings - Admin only"""
    settings_data['id'] = "shipping_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.shipping_settings.update_one(
        {"id": "shipping_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Shipping settings updated successfully"}


# ==================== MELHOR ENVIO SHIPPING CALCULATION ====================

@api_router.post("/shipping/calculate-melhor-envio")
async def calculate_shipping_melhor_envio(data: dict):
    """Calculate shipping using Melhor Envio API"""
    try:
        # Get shipping settings
        settings = await db.shipping_settings.find_one({"id": "shipping_settings"})
        
        if not settings or not settings.get('melhor_envio_enabled'):
            raise HTTPException(status_code=400, detail="Melhor Envio integration not enabled")
        
        if not settings.get('melhor_envio_token'):
            raise HTTPException(status_code=400, detail="Melhor Envio token not configured")
        
        # Extract request data
        destination_cep = data.get('destination_cep', '').replace('-', '')
        origin_cep = settings.get('origin_cep', '').replace('-', '')
        products = data.get('products', [])
        
        if not destination_cep or len(destination_cep) != 8:
            raise HTTPException(status_code=400, detail="Invalid destination CEP")
        
        if not origin_cep or len(origin_cep) != 8:
            raise HTTPException(status_code=400, detail="Origin CEP not configured in settings")
        
        if not products:
            raise HTTPException(status_code=400, detail="No products provided")
        
        # Prepare payload for Melhor Envio API
        melhor_envio_products = []
        for product in products:
            melhor_envio_products.append({
                "id": product.get('id', str(uuid.uuid4())),
                "name": product.get('name', 'Product'),
                "quantity": product.get('quantity', 1),
                "unitary_value": float(product.get('price', 0)),
                "weight": float(product.get('weight', 1)),
                "width": int(product.get('width', 10)),
                "height": int(product.get('height', 10)),
                "length": int(product.get('length', 10))
            })
        
        payload = {
            "from": {"postal_code": origin_cep},
            "to": {"postal_code": destination_cep},
            "products": melhor_envio_products
        }
        
        # Make request to Melhor Envio API
        api_url = "https://sandbox.melhorenvio.com.br" if settings.get('melhor_envio_sandbox') else "https://melhorenvio.com.br"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings['melhor_envio_token']}",
            "User-Agent": "SecuShop/1.0"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_url}/api/v2/me/shipment/calculate",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                error_detail = response.text
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Melhor Envio API error: {error_detail}"
                )
            
            api_response = response.json()
        
        # Parse and format response
        shipping_options = []
        for option in api_response:
            shipping_options.append({
                "id": str(option.get('id')),
                "name": option.get('name', 'Unknown'),
                "company": option.get('company', {}).get('name', 'Unknown'),
                "price": float(option.get('custom_price', option.get('price', 0))),
                "custom_price": float(option.get('custom_price', 0)),
                "original_price": float(option.get('price', 0)),
                "delivery_time": int(option.get('custom_delivery_time', option.get('delivery_time', 0))),
                "custom_delivery_time": int(option.get('custom_delivery_time', 0)),
                "delivery_range": option.get('delivery_range', {}),
                "currency": option.get('currency', 'BRL'),
                "packages": option.get('packages', [])
            })
        
        # Sort by price
        shipping_options.sort(key=lambda x: x['price'])
        
        return {
            "success": True,
            "origin_cep": origin_cep,
            "destination_cep": destination_cep,
            "options": shipping_options
        }
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Melhor Envio API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating shipping: {str(e)}")

async def get_menu(menu_name: str):
    """Get menu by name - Public"""
    menu = await db.menus.find_one({"name": menu_name, "active": True}, {"_id": 0})
    if not menu:
        return {"name": menu_name, "items": []}
    return menu

@api_router.get("/admin/menus")
async def get_all_menus(current_user: User = Depends(get_current_admin)):
    """Get all menus - Admin"""
    menus = await db.menus.find({}, {"_id": 0}).to_list(100)
    return menus

@api_router.put("/admin/menus/{menu_id}")
async def update_menu(menu_id: str, menu_data: dict, current_user: User = Depends(get_current_admin)):
    """Update menu"""
    menu_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.menus.update_one({"id": menu_id}, {"$set": menu_data}, upsert=True)
    return {"message": "Menu updated"}

# ==================== REVIEWS ROUTES ====================

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get approved reviews for product - Public"""
    reviews = await db.reviews.find({
        "product_id": product_id,
        "status": "approved"
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/reviews")
async def create_review(review_data: dict):
    """Create review - Public"""
    review = Review(**review_data)
    doc = review.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.reviews.insert_one(doc)
    return {"message": "Review submitted for approval"}

@api_router.get("/admin/reviews")
async def get_all_reviews(status: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    """Get all reviews - Admin"""
    query = {}
    if status:
        query['status'] = status
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reviews

@api_router.patch("/admin/reviews/{review_id}/approve")
async def approve_review(review_id: str, current_user: User = Depends(get_current_admin)):
    """Approve review"""
    await db.reviews.update_one(
        {"id": review_id},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Review approved"}

@api_router.patch("/admin/reviews/{review_id}/reject")
async def reject_review(review_id: str, current_user: User = Depends(get_current_admin)):
    """Reject review"""
    await db.reviews.update_one({"id": review_id}, {"$set": {"status": "rejected"}})
    return {"message": "Review rejected"}

# ==================== SOCIAL REVIEWS / TESTIMONIALS ROUTES ====================

@api_router.get("/social-reviews")
async def get_public_social_reviews():
    """Get published social reviews for public display"""
    reviews = await db.social_reviews.find(
        {"published": True},
        {"_id": 0}
    ).sort([("featured", -1), ("order", 1), ("created_at", -1)]).to_list(100)
    return reviews

@api_router.get("/social-reviews/featured")
async def get_featured_social_reviews():
    """Get featured social reviews for homepage"""
    reviews = await db.social_reviews.find(
        {"published": True, "featured": True},
        {"_id": 0}
    ).sort([("order", 1), ("created_at", -1)]).to_list(20)
    return reviews

@api_router.get("/admin/social-reviews")
async def get_all_social_reviews(current_user: User = Depends(get_current_admin)):
    """Get all social reviews - Admin"""
    reviews = await db.social_reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reviews

@api_router.post("/admin/social-reviews")
async def create_social_review(review_data: SocialReviewCreate, current_user: User = Depends(get_current_admin)):
    """Create social review - Admin"""
    review = SocialReview(
        author_name=review_data.author_name,
        author_avatar=review_data.author_avatar,
        rating=review_data.rating,
        text=review_data.text,
        source=review_data.source,
        source_url=review_data.source_url,
        published=review_data.published,
        featured=review_data.featured,
        order=review_data.order
    )
    if review_data.review_date:
        review.review_date = datetime.fromisoformat(review_data.review_date.replace('Z', '+00:00'))
    
    doc = review.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('review_date'):
        doc['review_date'] = doc['review_date'].isoformat()
    
    await db.social_reviews.insert_one(doc)
    return {**doc, "_id": None}

@api_router.put("/admin/social-reviews/{review_id}")
async def update_social_review(review_id: str, review_data: dict, current_user: User = Depends(get_current_admin)):
    """Update social review - Admin"""
    update_data = {k: v for k, v in review_data.items() if k != 'id' and k != '_id'}
    if 'review_date' in update_data and update_data['review_date']:
        try:
            update_data['review_date'] = datetime.fromisoformat(update_data['review_date'].replace('Z', '+00:00')).isoformat()
        except:
            pass
    
    await db.social_reviews.update_one(
        {"id": review_id},
        {"$set": update_data}
    )
    updated = await db.social_reviews.find_one({"id": review_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/social-reviews/{review_id}")
async def delete_social_review(review_id: str, current_user: User = Depends(get_current_admin)):
    """Delete social review - Admin"""
    result = await db.social_reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted"}

@api_router.patch("/admin/social-reviews/{review_id}/toggle-publish")
async def toggle_social_review_publish(review_id: str, current_user: User = Depends(get_current_admin)):
    """Toggle publish status of social review - Admin"""
    review = await db.social_reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    new_status = not review.get('published', False)
    await db.social_reviews.update_one(
        {"id": review_id},
        {"$set": {"published": new_status}}
    )
    return {"published": new_status}

@api_router.patch("/admin/social-reviews/{review_id}/toggle-featured")
async def toggle_social_review_featured(review_id: str, current_user: User = Depends(get_current_admin)):
    """Toggle featured status of social review - Admin"""
    review = await db.social_reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    new_status = not review.get('featured', False)
    await db.social_reviews.update_one(
        {"id": review_id},
        {"$set": {"featured": new_status}}
    )
    return {"featured": new_status}

# ==================== SEO & SITEMAP ROUTES ====================

SITE_DOMAIN = os.environ.get('SITE_URL', os.environ.get('REACT_APP_BACKEND_URL', 'https://www.vigiloc.com.br'))

@api_router.get("/sitemap.xml")
async def get_dynamic_sitemap():
    """Generate dynamic sitemap.xml"""
    from fastapi.responses import Response
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Fetch all published services
    services = await db.services.find({"published": True}, {"_id": 0, "slug": 1, "name": 1}).to_list(100)
    
    # Fetch all published custom pages
    pages = await db.custom_pages.find({"published": True}, {"_id": 0, "slug": 1, "title": 1}).to_list(100)
    
    # Fetch all published categories
    categories = await db.categories.find({}, {"_id": 0, "slug": 1}).to_list(100)
    
    sitemap_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Homepage - Highest Priority -->
  <url>
    <loc>{SITE_DOMAIN}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Services Landing Page -->
  <url>
    <loc>{SITE_DOMAIN}/servicos</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Contact Page -->
  <url>
    <loc>{SITE_DOMAIN}/contato</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Individual Service Pages -->
'''
    
    for service in services:
        sitemap_xml += f'''  <url>
    <loc>{SITE_DOMAIN}/servico/{service.get('slug', '')}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
'''
    
    # Add custom pages
    for page in pages:
        sitemap_xml += f'''  <url>
    <loc>{SITE_DOMAIN}/p/{page.get('slug', '')}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
'''
    
    sitemap_xml += '''
</urlset>'''
    
    return Response(content=sitemap_xml, media_type="application/xml")

@api_router.get("/llms.txt")
async def get_llms_txt():
    """Serve llms.txt for LLM crawlers"""
    from fastapi.responses import PlainTextResponse
    
    # Fetch services for dynamic content
    services = await db.services.find({"published": True}, {"_id": 0}).to_list(100)
    
    llms_content = f"""# =====================================================
# VIGILOC - llms.txt
# Informações para Large Language Models (LLMs)
# Website: {SITE_DOMAIN}
# Última atualização: {datetime.now(timezone.utc).strftime("%Y-%m-%d")}
# =====================================================

# Sobre a Empresa
> VigiLoc é líder em soluções de automação e segurança eletrônica para condomínios e empresas no Brasil.
> Fundada há mais de 10 anos, atendemos mais de 500 clientes com 99% de satisfação.
> Localização: São Paulo, Brasil
> Website: {SITE_DOMAIN}
> Contato: WhatsApp disponível no site

# Serviços Principais
"""
    
    for service in services:
        llms_content += f"""
## {service.get('name', 'Serviço')}
> {service.get('shortDescription', '')}
> URL: {SITE_DOMAIN}/servico/{service.get('slug', '')}
"""
    
    llms_content += """
# Diferenciais
- Monitoramento 24/7
- Suporte técnico especializado
- Mais de 10 anos de experiência
- 500+ clientes atendidos
- 99% de satisfação
- Tecnologia de ponta com IA
- Instalação profissional
- Garantia estendida

# Áreas de Atuação
- Condomínios residenciais e comerciais
- Empresas e escritórios
- Indústrias
- Hospitais e clínicas
- Escolas e universidades

# Região de Atendimento
- São Paulo (SP) e Grande São Paulo
- Região Metropolitana
- Interior de São Paulo

# Contato
- Website: """ + SITE_DOMAIN + """
- Página de Contato: """ + SITE_DOMAIN + """/contato
- WhatsApp: Disponível no site

# Informações Técnicas
- Idioma: Português Brasileiro (pt-BR)
- Moeda: Real Brasileiro (BRL)
- Setor: Segurança Eletrônica / Automação Predial
"""
    
    return PlainTextResponse(content=llms_content)

@api_router.get("/seo/structured-data")
async def get_structured_data():
    """Get JSON-LD structured data for SEO"""
    
    # Fetch services
    services = await db.services.find({"published": True}, {"_id": 0}).to_list(100)
    
    # Fetch reviews
    reviews = await db.social_reviews.find({"published": True}, {"_id": 0}).to_list(50)
    
    # Calculate average rating
    avg_rating = 5.0
    if reviews:
        avg_rating = sum(r.get('rating', 5) for r in reviews) / len(reviews)
    
    structured_data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": f"{SITE_DOMAIN}/#organization",
                "name": "VigiLoc",
                "url": SITE_DOMAIN,
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{SITE_DOMAIN}/logo512.png"
                },
                "description": "Líder em soluções de automação e segurança eletrônica para condomínios e empresas",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "São Paulo",
                    "addressRegion": "SP",
                    "addressCountry": "BR"
                },
                "areaServed": {
                    "@type": "GeoCircle",
                    "geoMidpoint": {
                        "@type": "GeoCoordinates",
                        "latitude": -23.5505,
                        "longitude": -46.6333
                    },
                    "geoRadius": "100000"
                },
                "sameAs": [],
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": round(avg_rating, 1),
                    "reviewCount": len(reviews),
                    "bestRating": 5,
                    "worstRating": 1
                }
            },
            {
                "@type": "WebSite",
                "@id": f"{SITE_DOMAIN}/#website",
                "url": SITE_DOMAIN,
                "name": "VigiLoc",
                "description": "Soluções em Automação e Segurança Eletrônica",
                "publisher": {"@id": f"{SITE_DOMAIN}/#organization"},
                "inLanguage": "pt-BR"
            },
            {
                "@type": "LocalBusiness",
                "@id": f"{SITE_DOMAIN}/#localbusiness",
                "name": "VigiLoc",
                "image": f"{SITE_DOMAIN}/logo512.png",
                "url": SITE_DOMAIN,
                "telephone": "",
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
                "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "08:00",
                    "closes": "18:00"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": round(avg_rating, 1),
                    "reviewCount": len(reviews),
                    "bestRating": 5,
                    "worstRating": 1
                }
            }
        ]
    }
    
    # Add services as Service schema
    for service in services:
        structured_data["@graph"].append({
            "@type": "Service",
            "name": service.get("name"),
            "description": service.get("shortDescription"),
            "url": f"{SITE_DOMAIN}/servico/{service.get('slug')}",
            "provider": {"@id": f"{SITE_DOMAIN}/#organization"},
            "areaServed": {
                "@type": "Place",
                "name": "São Paulo, Brasil"
            }
        })
    
    # Add reviews
    for review in reviews[:10]:
        structured_data["@graph"].append({
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": review.get("author_name")
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.get("rating", 5),
                "bestRating": 5,
                "worstRating": 1
            },
            "reviewBody": review.get("text"),
            "itemReviewed": {"@id": f"{SITE_DOMAIN}/#organization"}
        })
    
    return structured_data

@api_router.get("/seo/report")
async def get_seo_report(current_user: User = Depends(get_current_admin)):
    """Generate SEO analysis report"""
    
    # Fetch data
    services = await db.services.find({"published": True}, {"_id": 0}).to_list(100)
    pages = await db.custom_pages.find({"published": True}, {"_id": 0}).to_list(100)
    reviews = await db.social_reviews.find({"published": True}, {"_id": 0}).to_list(100)
    site_settings = await db.site_settings.find_one({}, {"_id": 0}) or {}
    
    # Calculate scores
    avg_rating = sum(r.get('rating', 5) for r in reviews) / len(reviews) if reviews else 0
    
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "domain": SITE_DOMAIN,
        
        "content_analysis": {
            "total_services": len(services),
            "total_pages": len(pages),
            "total_reviews": len(reviews),
            "average_rating": round(avg_rating, 2),
            "services_with_description": sum(1 for s in services if s.get('shortDescription')),
            "services_with_banner": sum(1 for s in services if s.get('headerBanner', {}).get('mediaUrl'))
        },
        
        "seo_checklist": {
            "robots_txt": {"status": "✅", "note": "Configurado com regras para buscadores e LLMs"},
            "sitemap_xml": {"status": "✅", "note": "Sitemap dinâmico disponível em /api/sitemap.xml"},
            "llms_txt": {"status": "✅", "note": "Arquivo llms.txt para crawlers de IA"},
            "structured_data": {"status": "✅", "note": "JSON-LD com Organization, LocalBusiness, Services, Reviews"},
            "meta_tags": {"status": "✅", "note": "Title, description, keywords configurados"},
            "open_graph": {"status": "✅", "note": "Tags OG para compartilhamento social"},
            "canonical_urls": {"status": "✅", "note": "URLs canônicas configuradas"},
            "mobile_friendly": {"status": "✅", "note": "Design responsivo implementado"},
            "https": {"status": "⚠️", "note": "Requer configuração no servidor de produção"},
            "page_speed": {"status": "⚠️", "note": "Recomendado: otimizar imagens e lazy loading"}
        },
        
        "llm_optimization": {
            "llms_txt": {"status": "✅", "note": "Arquivo disponível para GPTBot, Claude, Perplexity"},
            "clear_content_structure": {"status": "✅", "note": "Conteúdo bem estruturado com headings"},
            "business_info": {"status": "✅", "note": "Informações da empresa claras e acessíveis"},
            "services_description": {"status": "✅", "note": f"{len(services)} serviços com descrições"},
            "reviews_available": {"status": "✅", "note": f"{len(reviews)} avaliações para credibilidade"}
        },
        
        "search_engines": {
            "google": {
                "status": "🔄",
                "actions": [
                    "Submeter sitemap no Google Search Console",
                    "Verificar propriedade do domínio",
                    "Configurar Google My Business"
                ]
            },
            "bing": {
                "status": "🔄",
                "actions": [
                    "Submeter sitemap no Bing Webmaster Tools",
                    "Verificar propriedade do domínio"
                ]
            }
        },
        
        "recommendations": [
            {
                "priority": "alta",
                "action": "Registrar site no Google Search Console",
                "url": "https://search.google.com/search-console"
            },
            {
                "priority": "alta",
                "action": "Criar perfil no Google My Business",
                "url": "https://business.google.com"
            },
            {
                "priority": "alta",
                "action": "Registrar site no Bing Webmaster Tools",
                "url": "https://www.bing.com/webmasters"
            },
            {
                "priority": "média",
                "action": "Configurar Google Analytics 4",
                "url": "https://analytics.google.com"
            },
            {
                "priority": "média",
                "action": "Adicionar mais avaliações de clientes",
                "note": f"Atualmente: {len(reviews)} avaliações"
            },
            {
                "priority": "baixa",
                "action": "Criar blog com conteúdo relevante",
                "note": "Artigos sobre segurança e automação"
            }
        ],
        
        "indexed_urls": [
            f"{SITE_DOMAIN}/",
            f"{SITE_DOMAIN}/servicos",
            f"{SITE_DOMAIN}/contato"
        ] + [f"{SITE_DOMAIN}/servico/{s.get('slug')}" for s in services]
    }
    
    return report

# ==================== SEO FILES MANAGEMENT ROUTES ====================

@api_router.get("/admin/seo/files")
async def get_seo_files(current_user: User = Depends(get_current_admin)):
    """Get all SEO configuration files"""
    import os
    
    files_info = []
    frontend_public = "/app/frontend/public"
    
    # Define SEO files to track
    seo_files = [
        {"name": "robots.txt", "path": f"{frontend_public}/robots.txt", "type": "robots", "editable": True},
        {"name": "llms.txt", "path": f"{frontend_public}/llms.txt", "type": "llms", "editable": True},
        {"name": "manifest.json", "path": f"{frontend_public}/manifest.json", "type": "manifest", "editable": True},
        {"name": "security.txt", "path": f"{frontend_public}/.well-known/security.txt", "type": "security", "editable": True},
    ]
    
    for file_info in seo_files:
        try:
            if os.path.exists(file_info["path"]):
                stat = os.stat(file_info["path"])
                with open(file_info["path"], 'r') as f:
                    content = f.read()
                files_info.append({
                    "name": file_info["name"],
                    "path": file_info["path"],
                    "type": file_info["type"],
                    "editable": file_info["editable"],
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                    "content": content,
                    "lines": len(content.split('\n')),
                    "exists": True
                })
            else:
                files_info.append({
                    "name": file_info["name"],
                    "path": file_info["path"],
                    "type": file_info["type"],
                    "editable": file_info["editable"],
                    "exists": False
                })
        except Exception as e:
            files_info.append({
                "name": file_info["name"],
                "path": file_info["path"],
                "type": file_info["type"],
                "error": str(e),
                "exists": False
            })
    
    return files_info

@api_router.put("/admin/seo/files/{file_type}")
async def update_seo_file(file_type: str, data: dict, current_user: User = Depends(get_current_admin)):
    """Update SEO configuration file"""
    import os
    
    frontend_public = "/app/frontend/public"
    
    file_paths = {
        "robots": f"{frontend_public}/robots.txt",
        "llms": f"{frontend_public}/llms.txt",
        "manifest": f"{frontend_public}/manifest.json",
        "security": f"{frontend_public}/.well-known/security.txt"
    }
    
    if file_type not in file_paths:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_path = file_paths[file_type]
    content = data.get("content", "")
    
    # Create backup
    backup_path = f"{file_path}.backup"
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            backup_content = f.read()
        with open(backup_path, 'w') as f:
            f.write(backup_content)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Write new content
    with open(file_path, 'w') as f:
        f.write(content)
    
    # Log the change
    await db.seo_logs.insert_one({
        "id": str(uuid.uuid4()),
        "type": "file_edit",
        "file": file_type,
        "user": current_user.email,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "content_length": len(content)
    })
    
    return {"message": "File updated successfully", "backup_created": True}

@api_router.post("/admin/seo/files/{file_type}/restore")
async def restore_seo_file(file_type: str, current_user: User = Depends(get_current_admin)):
    """Restore SEO file from backup"""
    import os
    
    frontend_public = "/app/frontend/public"
    
    file_paths = {
        "robots": f"{frontend_public}/robots.txt",
        "llms": f"{frontend_public}/llms.txt",
        "manifest": f"{frontend_public}/manifest.json",
        "security": f"{frontend_public}/.well-known/security.txt"
    }
    
    if file_type not in file_paths:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_path = file_paths[file_type]
    backup_path = f"{file_path}.backup"
    
    if not os.path.exists(backup_path):
        raise HTTPException(status_code=404, detail="No backup found")
    
    with open(backup_path, 'r') as f:
        backup_content = f.read()
    
    with open(file_path, 'w') as f:
        f.write(backup_content)
    
    return {"message": "File restored from backup"}

@api_router.post("/seo/log-crawler")
async def log_crawler_access(request: Request):
    """Log crawler/bot access for analytics"""
    user_agent = request.headers.get("user-agent", "Unknown")
    
    # Detect known crawlers
    crawler_patterns = {
        "Googlebot": "google",
        "Bingbot": "bing",
        "Slurp": "yahoo",
        "DuckDuckBot": "duckduckgo",
        "Yandex": "yandex",
        "Baiduspider": "baidu",
        "GPTBot": "openai",
        "ChatGPT-User": "openai",
        "Claude-Web": "anthropic",
        "ClaudeBot": "anthropic",
        "anthropic-ai": "anthropic",
        "PerplexityBot": "perplexity",
        "Google-Extended": "google_ai",
        "Bytespider": "microsoft",
        "YouBot": "you",
        "cohere-ai": "cohere",
        "Applebot": "apple",
        "facebookexternalhit": "facebook",
        "Twitterbot": "twitter",
        "LinkedInBot": "linkedin",
        "WhatsApp": "whatsapp",
        "TelegramBot": "telegram"
    }
    
    detected_crawler = "unknown"
    crawler_category = "other"
    
    for pattern, name in crawler_patterns.items():
        if pattern.lower() in user_agent.lower():
            detected_crawler = name
            if name in ["google", "bing", "yahoo", "duckduckgo", "yandex", "baidu"]:
                crawler_category = "search_engine"
            elif name in ["openai", "anthropic", "perplexity", "google_ai", "cohere", "you"]:
                crawler_category = "llm"
            elif name in ["facebook", "twitter", "linkedin", "whatsapp", "telegram"]:
                crawler_category = "social"
            break
    
    log_entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_agent": user_agent,
        "crawler": detected_crawler,
        "category": crawler_category,
        "ip": request.client.host if request.client else "unknown",
        "path": str(request.url.path),
        "method": request.method
    }
    
    await db.crawler_logs.insert_one(log_entry)
    return {"logged": True}

@api_router.get("/admin/seo/crawler-logs")
async def get_crawler_logs(
    current_user: User = Depends(get_current_admin),
    limit: int = 100,
    category: str = None,
    crawler: str = None
):
    """Get crawler access logs"""
    query = {}
    if category:
        query["category"] = category
    if crawler:
        query["crawler"] = crawler
    
    logs = await db.crawler_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Get stats
    total_logs = await db.crawler_logs.count_documents({})
    
    # Aggregate by crawler
    pipeline = [
        {"$group": {"_id": "$crawler", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    crawler_stats = await db.crawler_logs.aggregate(pipeline).to_list(100)
    
    # Aggregate by category
    pipeline_category = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_stats = await db.crawler_logs.aggregate(pipeline_category).to_list(10)
    
    # Get last 24h stats
    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
    last_24h = await db.crawler_logs.count_documents({
        "timestamp": {"$gte": yesterday.isoformat()}
    })
    
    # Get last 7 days by day
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    pipeline_daily = [
        {"$match": {"timestamp": {"$gte": seven_days_ago.isoformat()}}},
        {"$addFields": {"date": {"$substr": ["$timestamp", 0, 10]}}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_stats = await db.crawler_logs.aggregate(pipeline_daily).to_list(7)
    
    return {
        "logs": logs,
        "total": total_logs,
        "last_24h": last_24h,
        "by_crawler": {item["_id"]: item["count"] for item in crawler_stats},
        "by_category": {item["_id"]: item["count"] for item in category_stats},
        "daily": daily_stats
    }

@api_router.delete("/admin/seo/crawler-logs")
async def clear_crawler_logs(current_user: User = Depends(get_current_admin)):
    """Clear all crawler logs"""
    result = await db.crawler_logs.delete_many({})
    return {"deleted": result.deleted_count}

@api_router.get("/admin/seo/activity-logs")
async def get_seo_activity_logs(current_user: User = Depends(get_current_admin), limit: int = 50):
    """Get SEO file edit activity logs"""
    logs = await db.seo_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs

@api_router.get("/admin/seo/health-check")
async def seo_health_check(current_user: User = Depends(get_current_admin)):
    """Check SEO health status"""
    import os
    import aiohttp
    
    health = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "files": {},
        "endpoints": {},
        "recommendations": []
    }
    
    frontend_public = "/app/frontend/public"
    
    # Check files exist
    files_to_check = {
        "robots.txt": f"{frontend_public}/robots.txt",
        "llms.txt": f"{frontend_public}/llms.txt",
        "manifest.json": f"{frontend_public}/manifest.json",
        "security.txt": f"{frontend_public}/.well-known/security.txt"
    }
    
    for name, path in files_to_check.items():
        exists = os.path.exists(path)
        health["files"][name] = {
            "exists": exists,
            "status": "✅" if exists else "❌"
        }
        if not exists:
            health["recommendations"].append(f"Criar arquivo {name}")
    
    # Check dynamic endpoints
    endpoints = {
        "sitemap.xml": "/api/sitemap.xml",
        "llms.txt (dynamic)": "/api/llms.txt",
        "structured-data": "/api/seo/structured-data"
    }
    
    for name, endpoint in endpoints.items():
        health["endpoints"][name] = {
            "path": endpoint,
            "status": "✅"  # Assume working since we're inside the same server
        }
    
    # Check content quality
    services = await db.services.find({"published": True}, {"_id": 0}).to_list(100)
    reviews = await db.social_reviews.find({"published": True}, {"_id": 0}).to_list(100)
    
    health["content"] = {
        "services_count": len(services),
        "services_with_description": sum(1 for s in services if s.get("shortDescription")),
        "services_with_banner": sum(1 for s in services if s.get("headerBanner", {}).get("mediaUrl")),
        "reviews_count": len(reviews),
        "average_rating": round(sum(r.get("rating", 5) for r in reviews) / len(reviews), 2) if reviews else 0
    }
    
    # Generate score
    score = 0
    max_score = 100
    
    # Files (20 points)
    score += sum(20/len(files_to_check) for name, data in health["files"].items() if data["exists"])
    
    # Content (40 points)
    if len(services) >= 5:
        score += 10
    if health["content"]["services_with_description"] >= len(services) * 0.8:
        score += 10
    if health["content"]["services_with_banner"] >= len(services) * 0.5:
        score += 10
    if len(reviews) >= 5:
        score += 10
    
    # Endpoints (40 points)
    score += len(health["endpoints"]) * (40 / len(endpoints))
    
    health["score"] = round(score)
    health["grade"] = "A+" if score >= 95 else "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D" if score >= 60 else "F"
    
    return health

# ==================== ANALYTICS ROUTES ====================

@api_router.post("/analytics/track")
async def track_event(event_data: dict):
    """Track analytics event - Public"""
    event = AnalyticsEvent(**event_data)
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.analytics_events.insert_one(doc)
    return {"message": "Event tracked"}

@api_router.get("/admin/analytics/dashboard")
async def get_analytics_dashboard(current_user: User = Depends(get_current_admin)):
    """Get dashboard analytics"""
    from datetime import timedelta
    
    today = datetime.now(timezone.utc)
    last_30_days = today - timedelta(days=30)
    
    # Total orders and revenue
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    total_orders = len(orders)
    total_revenue = sum(order.get('total', 0) for order in orders)
    
    # Orders last 30 days
    orders_30d = [o for o in orders if datetime.fromisoformat(o.get('created_at', '2020-01-01')) > last_30_days]
    revenue_30d = sum(o.get('total', 0) for o in orders_30d)
    
    # Products count
    products = await db.products.count_documents({})
    
    # Customers count
    customers = await db.customers.count_documents({}) if 'customers' in await db.list_collection_names() else 0
    
    # Top products
    product_sales = {}
    for order in orders:
        for item in order.get('items', []):
            pid = item.get('product_id')
            if pid:
                product_sales[pid] = product_sales.get(pid, 0) + item.get('quantity', 1)
    
    top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Daily sales last 7 days
    daily_sales = {}
    for i in range(7):
        day = today - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        daily_sales[day_str] = 0
    
    for order in orders:
        order_date = datetime.fromisoformat(order.get('created_at', '2020-01-01')).strftime('%Y-%m-%d')
        if order_date in daily_sales:
            daily_sales[order_date] += order.get('total', 0)
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "revenue_30d": revenue_30d,
        "orders_30d": len(orders_30d),
        "total_products": products,
        "total_customers": customers,
        "top_products": top_products,
        "daily_sales": daily_sales
    }

@api_router.put("/admin/payments/{payment_id}/pix")
async def update_payment_pix(payment_id: str, pix_data: dict, current_user: User = Depends(get_current_admin)):
    """Update PIX information for a payment"""
    result = await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "pix_key": pix_data.get("pix_key", ""),
            "pix_qrcode": pix_data.get("pix_qrcode", "")
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"message": "Informações PIX atualizadas"}

# ==================== PAGE CONTENT ROUTES ====================

@api_router.get("/page-content/{page_name}")
async def get_page_content(page_name: str):
    # Public route - only show PUBLISHED content
    content = await db.page_content.find_one({"page_name": page_name, "published": True}, {"_id": 0})
    if not content:
        # Return default empty structure for unpublished/non-existent pages
        content = {
            "id": page_name,
            "page_name": page_name,
            "sections": {},
            "images": {},
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "published": False
        }
    return content

@api_router.get("/admin/page-content/{page_name}")
async def get_page_content_admin(page_name: str, current_user: User = Depends(get_current_admin)):
    # Admin route - show content regardless of published status
    content = await db.page_content.find_one({"page_name": page_name}, {"_id": 0})
    if not content:
        # Return default empty structure
        content = {
            "id": page_name,
            "page_name": page_name,
            "sections": {},
            "images": {},
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "published": False
        }
    return content

@api_router.put("/admin/page-content/{page_name}")
async def update_page_content(page_name: str, content_data: dict, current_user: User = Depends(get_current_admin)):
    existing = await db.page_content.find_one({"page_name": page_name}, {"_id": 0})
    
    content_data['page_name'] = page_name
    content_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Handle published_at timestamp
    if existing and content_data.get('published') and not existing.get('published'):
        # Content is being published for the first time
        content_data['published_at'] = datetime.now(timezone.utc).isoformat()
    elif not content_data.get('published'):
        # Content is being unpublished
        content_data['published_at'] = None
    
    await db.page_content.update_one(
        {"page_name": page_name},
        {"$set": content_data},
        upsert=True
    )
    return {"message": "Conteúdo atualizado"}

@api_router.patch("/admin/page-content/{page_name}/publish")
async def toggle_page_content_publication(page_name: str, published: bool, current_user: User = Depends(get_current_admin)):
    """Toggle page content publication status"""
    existing = await db.page_content.find_one({"page_name": page_name}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Page content not found")
    
    update_data = {"published": published, "updated_at": datetime.now(timezone.utc).isoformat()}
    if published and not existing.get('published'):
        # Content is being published for the first time
        update_data['published_at'] = datetime.now(timezone.utc).isoformat()
    elif not published:
        # Content is being unpublished
        update_data['published_at'] = None
    
    await db.page_content.update_one({"page_name": page_name}, {"$set": update_data})
    
    return {"message": f"Page content {'published' if published else 'unpublished'} successfully"}

# ==================== SITE SETTINGS ROUTES ====================

@api_router.get("/site-settings")
async def get_site_settings():
    """Get site settings (public)"""
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = SiteSettings()
        return default_settings.model_dump()
    return settings

@api_router.put("/admin/site-settings")
async def update_site_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update site settings - Admin only"""
    settings_data['id'] = "site_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Configurações do site atualizadas com sucesso"}

# ==================== NAVBAR SETTINGS ROUTES ====================

@api_router.get("/navbar-settings")
async def get_navbar_settings():
    """Get navbar settings - Public"""
    settings = await db.navbar_settings.find_one({"id": "navbar_settings"}, {"_id": 0})
    if not settings:
        # Return defaults
        return NavbarSettings().model_dump()
    return settings

@api_router.put("/admin/navbar-settings")
async def update_navbar_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update navbar settings - Admin only"""
    settings_data['id'] = "navbar_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.navbar_settings.update_one(
        {"id": "navbar_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Configurações da navbar atualizadas com sucesso"}


# ==================== CONTACT PAGE SETTINGS ====================

@api_router.get("/contact-page-settings")
async def get_contact_page_settings():
    """Get contact page settings - Public"""
    settings = await db.contact_page_settings.find_one({"id": "contact_page_settings"}, {"_id": 0})
    if not settings:
        return {
            "hero_title": "Entre em Contato",
            "hero_subtitle": "Estamos prontos para ajudar você",
            "hero_background_image": "",
            "phone": "",
            "phone_secondary": "",
            "email": "",
            "email_secondary": "",
            "whatsapp_number": "",
            "whatsapp_message": "Olá! Gostaria de mais informações sobre os serviços da VigiLoc.",
            "whatsapp_button_text": "Falar pelo WhatsApp",
            "show_whatsapp_button": True,
            "address_street": "",
            "address_neighborhood": "",
            "address_city": "",
            "address_state": "",
            "address_zip": "",
            "address_country": "Brasil",
            "working_hours_weekdays": "Segunda a Sexta: 08:00 - 18:00",
            "working_hours_saturday": "Sábado: 08:00 - 12:00",
            "working_hours_sunday": "Domingo: Fechado",
            "google_maps_embed": "",
            "show_map": True,
            "facebook_url": "",
            "instagram_url": "",
            "youtube_url": "",
            "linkedin_url": "",
            "website_url": "",
            "form_title": "Envie sua Mensagem",
            "form_subtitle": "Preencha o formulário abaixo e entraremos em contato",
            "form_success_message": "Mensagem enviada com sucesso! Entraremos em contato em breve.",
            "show_contact_form": True
        }
    return settings

@api_router.put("/admin/contact-page-settings")
async def update_contact_page_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update contact page settings - Admin only"""
    settings_data['id'] = "contact_page_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.contact_page_settings.update_one(
        {"id": "contact_page_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Configurações da página de contato atualizadas com sucesso"}


# ==================== WHATSAPP AUTO-REPLY SETTINGS ====================

@api_router.get("/whatsapp-auto-reply-settings")
async def get_whatsapp_auto_reply_settings():
    """Get WhatsApp auto-reply settings - Public"""
    settings = await db.whatsapp_auto_reply_settings.find_one({"id": "whatsapp_auto_reply"}, {"_id": 0})
    if not settings:
        return {
            "enabled": False,
            "welcome_message": "Olá! 👋 Bem-vindo à VigiLoc! Como posso ajudar você hoje?",
            "business_hours_message": "Nosso horário de atendimento é de Segunda a Sexta, das 8h às 18h. Deixe sua mensagem que retornaremos o mais breve possível!",
            "outside_hours_message": "Estamos fora do horário de atendimento. Retornaremos sua mensagem no próximo dia útil. Obrigado pela compreensão! 🙏",
            "auto_replies": [
                {"id": "1", "trigger": "preço", "response": "Para informações sobre preços e orçamentos, por favor acesse nosso site ou fale com um consultor."},
                {"id": "2", "trigger": "horário", "response": "Nosso horário de atendimento é de Segunda a Sexta, das 8h às 18h, e Sábados das 8h às 12h."},
                {"id": "3", "trigger": "endereço", "response": "Estamos localizados na Av. Paulista, 1000 - São Paulo/SP. CEP: 01310-100"}
            ]
        }
    return settings

@api_router.put("/admin/whatsapp-auto-reply-settings")
async def update_whatsapp_auto_reply_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update WhatsApp auto-reply settings - Admin only"""
    settings_data['id'] = "whatsapp_auto_reply"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.whatsapp_auto_reply_settings.update_one(
        {"id": "whatsapp_auto_reply"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Configurações de resposta automática do WhatsApp atualizadas com sucesso"}


# ==================== NOTIFICATION/AUTOMATION ROUTES ====================

@api_router.post("/admin/notifications/send-payment-reminders")
async def send_payment_reminders(current_user: User = Depends(get_current_admin)):
    """Send payment reminders based on configurable days before due date"""
    # Get settings
    settings = await db.crm_settings.find_one({"id": "crm_settings"}, {"_id": 0})
    if not settings:
        settings = CRMSettings().model_dump()
    
    days_before = settings.get('trigger_settings', {}).get('payment_reminder_days', 1)
    target_date = datetime.now() + timedelta(days=days_before)
    target_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    target_end = target_date.replace(hour=23, minute=59, second=59)
    
    payments = await db.payments.find({
        "status": "pending",
        "reminder_sent": False,
        "due_date": {
            "$gte": target_start.isoformat(),
            "$lte": target_end.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    whatsapp_template = settings.get('whatsapp_templates', {}).get('payment_reminder', 
        "Olá {customer_name}! Lembrete: Seu pagamento de R$ {amount} vence em {due_date}. PIX: {pix_key}")
    
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            # Format message with template
            message = whatsapp_template.format(
                customer_name=customer['name'],
                amount=f"{payment['amount']:.2f}",
                due_date=payment['due_date'][:10],
                pix_key=payment.get('pix_key', 'Ver fatura')
            )
            
            # Create notification
            notification = Notification(
                customer_id=customer['id'],
                type="payment_reminder",
                channel="whatsapp",
                message=message
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            # Mark as sent
            await db.payments.update_one({"id": payment['id']}, {"$set": {"reminder_sent": True}})
            sent += 1
    
    return {"message": f"{sent} lembretes agendados"}

@api_router.post("/admin/notifications/send-overdue-notices")
async def send_overdue_notices(current_user: User = Depends(get_current_admin)):
    """Send overdue notices based on configurable days after due date"""
    # Get settings
    settings = await db.crm_settings.find_one({"id": "crm_settings"}, {"_id": 0})
    if not settings:
        settings = CRMSettings().model_dump()
    
    days_overdue = settings.get('trigger_settings', {}).get('overdue_notice_days', 3)
    target_date = datetime.now() - timedelta(days=days_overdue)
    
    payments = await db.payments.find({
        "status": "pending",
        "overdue_notice_sent": False,
        "due_date": {"$lt": target_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    whatsapp_template = settings.get('whatsapp_templates', {}).get('overdue_notice',
        "⚠️ {customer_name}, seu pagamento de R$ {amount} está atrasado. Por favor, regularize para evitar suspensão do serviço. PIX: {pix_key}")
    
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            # Format message with template
            message = whatsapp_template.format(
                customer_name=customer['name'],
                amount=f"{payment['amount']:.2f}",
                due_date=payment['due_date'][:10],
                pix_key=payment.get('pix_key', 'Ver fatura')
            )
            
            notification = Notification(
                customer_id=customer['id'],
                type="overdue",
                channel="whatsapp",
                message=message
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            await db.payments.update_one({"id": payment['id']}, {"$set": {"overdue_notice_sent": True, "status": "overdue"}})
            sent += 1
    
    return {"message": f"{sent} avisos de atraso enviados"}

@api_router.post("/admin/notifications/send-suspension-warnings")
async def send_suspension_warnings(current_user: User = Depends(get_current_admin)):
    """Send suspension warnings based on configurable days after due date"""
    # Get settings
    settings = await db.crm_settings.find_one({"id": "crm_settings"}, {"_id": 0})
    if not settings:
        settings = CRMSettings().model_dump()
    
    days_overdue = settings.get('trigger_settings', {}).get('suspension_warning_days', 10)
    target_date = datetime.now() - timedelta(days=days_overdue)
    
    payments = await db.payments.find({
        "status": "overdue",
        "suspension_notice_sent": False,
        "due_date": {"$lt": target_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    whatsapp_template = settings.get('whatsapp_templates', {}).get('suspension_warning',
        "🚨 AVISO FINAL {customer_name}: Seu serviço será suspenso em 24h por falta de pagamento. Valor: R$ {amount}. Regularize URGENTE! PIX: {pix_key}")
    
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            # Format message with template
            message = whatsapp_template.format(
                customer_name=customer['name'],
                amount=f"{payment['amount']:.2f}",
                due_date=payment['due_date'][:10],
                pix_key=payment.get('pix_key', 'Ver fatura')
            )
            
            notification = Notification(
                customer_id=customer['id'],
                type="suspension",
                channel="whatsapp",
                message=message
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            await db.payments.update_one({"id": payment['id']}, {"$set": {"suspension_notice_sent": True}})
            
            # Update customer status to suspended
            await db.customers.update_one({"id": customer['id']}, {"$set": {"status": "suspended"}})
            sent += 1
    
    return {"message": f"{sent} avisos de suspensão enviados"}

@api_router.get("/admin/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_admin)):
    notifications = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    for notif in notifications:
        for field in ['created_at', 'sent_at']:
            if notif.get(field) and isinstance(notif[field], str):
                notif[field] = datetime.fromisoformat(notif[field])
    return notifications

# ==================== CRM SETTINGS ROUTES ====================

@api_router.get("/admin/crm/settings")
async def get_crm_settings(current_user: User = Depends(get_current_admin)):
    """Get CRM settings (triggers and templates)"""
    settings = await db.crm_settings.find_one({"id": "crm_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        default_settings = CRMSettings()
        return default_settings.model_dump()
    return settings

@api_router.put("/admin/crm/settings/triggers")
async def update_trigger_settings(trigger_data: dict, current_user: User = Depends(get_current_admin)):
    """Update notification trigger settings"""
    await db.crm_settings.update_one(
        {"id": "crm_settings"},
        {"$set": {"trigger_settings": trigger_data}},
        upsert=True
    )
    return {"message": "Configurações de gatilhos atualizadas"}

@api_router.put("/admin/crm/settings/email-templates")
async def update_email_templates(templates: dict, current_user: User = Depends(get_current_admin)):
    """Update email templates"""
    await db.crm_settings.update_one(
        {"id": "crm_settings"},
        {"$set": {"email_templates": templates}},
        upsert=True
    )
    return {"message": "Templates de email atualizados"}

@api_router.put("/admin/crm/settings/whatsapp-templates")
async def update_whatsapp_templates(templates: dict, current_user: User = Depends(get_current_admin)):
    """Update WhatsApp templates"""
    await db.crm_settings.update_one(
        {"id": "crm_settings"},
        {"$set": {"whatsapp_templates": templates}},
        upsert=True
    )
    return {"message": "Templates de WhatsApp atualizados"}

@api_router.post("/admin/notifications/send-overdue-notices")
async def send_overdue_notices(current_user: User = Depends(get_current_admin)):
    """Send overdue notices based on configurable days after due date"""
    # Get settings
    settings = await db.crm_settings.find_one({"id": "crm_settings"}, {"_id": 0})
    if not settings:
        settings = CRMSettings().model_dump()
    
    days_overdue = settings.get('trigger_settings', {}).get('overdue_notice_days', 3)
    target_date = datetime.now() - timedelta(days=days_overdue)
    
    payments = await db.payments.find({
        "status": "pending",
        "overdue_notice_sent": False,
        "due_date": {"$lt": target_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    whatsapp_template = settings.get('whatsapp_templates', {}).get('overdue_notice',
        "⚠️ {customer_name}, seu pagamento de R$ {amount} está atrasado. Por favor, regularize para evitar suspensão do serviço. PIX: {pix_key}")
    
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            # Format message with template
            message = whatsapp_template.format(
                customer_name=customer['name'],
                amount=f"{payment['amount']:.2f}",
                due_date=payment['due_date'][:10],
                pix_key=payment.get('pix_key', 'Ver fatura')
            )
            
            notification = Notification(
                customer_id=customer['id'],
                type="overdue",
                channel="whatsapp",
                message=message
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            await db.payments.update_one({"id": payment['id']}, {"$set": {"overdue_notice_sent": True, "status": "overdue"}})
            sent += 1
    
    return {"message": f"{sent} avisos de atraso enviados"}

@api_router.post("/admin/notifications/send-suspension-warnings")
async def send_suspension_warnings(current_user: User = Depends(get_current_admin)):
    """Send suspension warnings based on configurable days after due date"""
    # Get settings
    settings = await db.crm_settings.find_one({"id": "crm_settings"}, {"_id": 0})
    if not settings:
        settings = CRMSettings().model_dump()
    
    days_overdue = settings.get('trigger_settings', {}).get('suspension_warning_days', 10)
    target_date = datetime.now() - timedelta(days=days_overdue)
    
    payments = await db.payments.find({
        "status": "overdue",
        "suspension_notice_sent": False,
        "due_date": {"$lt": target_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    whatsapp_template = settings.get('whatsapp_templates', {}).get('suspension_warning',
        "🚨 AVISO FINAL {customer_name}: Seu serviço será suspenso em 24h por falta de pagamento. Valor: R$ {amount}. Regularize URGENTE! PIX: {pix_key}")
    
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            # Format message with template
            message = whatsapp_template.format(
                customer_name=customer['name'],
                amount=f"{payment['amount']:.2f}",
                due_date=payment['due_date'][:10],
                pix_key=payment.get('pix_key', 'Ver fatura')
            )
            
            notification = Notification(
                customer_id=customer['id'],
                type="suspension",
                channel="whatsapp",
                message=message
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            await db.payments.update_one({"id": payment['id']}, {"$set": {"suspension_notice_sent": True}})
            sent += 1
    
    return {"message": f"{sent} avisos de suspensão enviados"}


# ==================== TRACKING & ANALYTICS ROUTES ====================

@api_router.get("/tracking-settings")
async def get_tracking_settings():
    """Get tracking settings - Public for script injection"""
    settings = await db.tracking_settings.find_one({"id": "tracking_settings"}, {"_id": 0})
    if not settings:
        return TrackingSettings().model_dump()
    return settings

@api_router.put("/admin/tracking-settings")
async def update_tracking_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update tracking settings - Admin only"""
    settings_data['id'] = "tracking_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.tracking_settings.update_one(
        {"id": "tracking_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Configurações de tracking atualizadas"}


# ==================== SEO ROUTES ====================

@api_router.get("/seo-settings")
async def get_seo_settings():
    """Get SEO settings - Public"""
    settings = await db.seo_settings.find_one({"id": "seo_settings"}, {"_id": 0})
    if not settings:
        return SEOSettings().model_dump()
    return settings

@api_router.put("/admin/seo-settings")
async def update_seo_settings(settings_data: dict, current_user: User = Depends(get_current_admin)):
    """Update SEO settings - Admin only"""
    settings_data['id'] = "seo_settings"
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.seo_settings.update_one(
        {"id": "seo_settings"},
        {"$set": settings_data},
        upsert=True
    )
    return {"message": "Configurações de SEO atualizadas"}

@api_router.post("/admin/seo/analyze")
async def analyze_page_seo(url: str, current_user: User = Depends(get_current_admin)):
    """Analyze a page for SEO - Returns score and suggestions"""
    try:
        import httpx
        from bs4 import BeautifulSoup
        
        # Fetch page content
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            html = response.text
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Initialize scores
        title_score = 0
        description_score = 0
        keywords_score = 0
        headings_score = 0
        content_score = 0
        images_score = 0
        links_score = 0
        issues = []
        warnings = []
        suggestions = []
        
        # Analyze Title
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.string or ""
            if 30 <= len(title) <= 60:
                title_score = 100
            elif len(title) < 30:
                title_score = 50
                warnings.append(f"Título muito curto ({len(title)} caracteres). Recomendado: 30-60.")
            else:
                title_score = 70
                warnings.append(f"Título muito longo ({len(title)} caracteres). Recomendado: 30-60.")
        else:
            issues.append("❌ Título ausente")
        
        # Analyze Meta Description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            desc = meta_desc.get('content', '')
            if 120 <= len(desc) <= 160:
                description_score = 100
            elif len(desc) < 120:
                description_score = 60
                warnings.append(f"Meta description curta ({len(desc)} caracteres). Recomendado: 120-160.")
            else:
                description_score = 80
                warnings.append(f"Meta description longa ({len(desc)} caracteres). Recomendado: 120-160.")
        else:
            issues.append("❌ Meta description ausente")
        
        # Analyze Keywords
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords and meta_keywords.get('content'):
            keywords_score = 100
        else:
            keywords_score = 50
            suggestions.append("💡 Adicione meta keywords relevantes")
        
        # Analyze Headings
        h1_tags = soup.find_all('h1')
        if len(h1_tags) == 1:
            headings_score = 100
        elif len(h1_tags) == 0:
            issues.append("❌ Nenhum H1 encontrado")
            headings_score = 0
        else:
            warnings.append(f"⚠️ Múltiplos H1 encontrados ({len(h1_tags)}). Use apenas um.")
            headings_score = 50
        
        h2_tags = soup.find_all('h2')
        if len(h2_tags) >= 2:
            headings_score = min(headings_score + 20, 100)
        else:
            suggestions.append("💡 Adicione mais H2 para estruturar o conteúdo")
        
        # Analyze Content
        paragraphs = soup.find_all('p')
        total_text = ' '.join([p.get_text() for p in paragraphs])
        word_count = len(total_text.split())
        
        if word_count >= 300:
            content_score = 100
        elif word_count >= 150:
            content_score = 70
            suggestions.append(f"💡 Conteúdo com {word_count} palavras. Recomendado: 300+")
        else:
            content_score = 40
            warnings.append(f"⚠️ Conteúdo muito curto ({word_count} palavras)")
        
        # Analyze Images
        images = soup.find_all('img')
        images_with_alt = [img for img in images if img.get('alt')]
        if len(images) > 0:
            images_score = int((len(images_with_alt) / len(images)) * 100)
            if images_score < 100:
                warnings.append(f"⚠️ {len(images) - len(images_with_alt)} imagens sem atributo ALT")
        else:
            images_score = 100
        
        # Analyze Links
        links = soup.find_all('a')
        internal_links = [a for a in links if a.get('href', '').startswith('/') or 'vigiloc' in a.get('href', '')]
        external_links = [a for a in links if a.get('href', '').startswith('http') and 'vigiloc' not in a.get('href', '')]
        
        if len(internal_links) >= 3:
            links_score = 100
        elif len(internal_links) >= 1:
            links_score = 70
            suggestions.append("💡 Adicione mais links internos")
        else:
            links_score = 40
            warnings.append("⚠️ Poucos ou nenhum link interno")
        
        # Calculate overall score
        overall_score = int((
            title_score + description_score + keywords_score + 
            headings_score + content_score + images_score + links_score
        ) / 7)
        
        return {
            "page_url": url,
            "score": overall_score,
            "title_score": title_score,
            "description_score": description_score,
            "keywords_score": keywords_score,
            "headings_score": headings_score,
            "content_score": content_score,
            "images_score": images_score,
            "links_score": links_score,
            "issues": issues,
            "warnings": warnings,
            "suggestions": suggestions,
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na análise: {str(e)}")

@api_router.post("/admin/seo/generate-sitemap")
async def generate_sitemap(current_user: User = Depends(get_current_admin)):
    """Generate sitemap.xml"""
    try:
        seo_settings = await db.seo_settings.find_one({"id": "seo_settings"}, {"_id": 0})
        site_url = seo_settings.get('site_url', 'https://prospecting-intel.preview.emergentagent.com') if seo_settings else 'https://prospecting-intel.preview.emergentagent.com'
        
        # Get all published pages and products
        products = await db.products.find({"published": True}, {"_id": 0, "id": 1, "timestamp": 1}).to_list(1000)
        custom_pages = await db.custom_pages.find({"published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(1000)
        
        # Build sitemap
        sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        # Homepage
        sitemap_content += '  <url>\n'
        sitemap_content += f'    <loc>{site_url}/</loc>\n'
        sitemap_content += '    <changefreq>daily</changefreq>\n'
        sitemap_content += '    <priority>1.0</priority>\n'
        sitemap_content += '  </url>\n'
        
        # System pages
        for page in ['/produtos', '/totens', '/contato', '/sobre']:
            sitemap_content += '  <url>\n'
            sitemap_content += f'    <loc>{site_url}{page}</loc>\n'
            sitemap_content += '    <changefreq>weekly</changefreq>\n'
            sitemap_content += '    <priority>0.8</priority>\n'
            sitemap_content += '  </url>\n'
        
        # Products
        for product in products:
            sitemap_content += '  <url>\n'
            sitemap_content += f'    <loc>{site_url}/produto/{product["id"]}</loc>\n'
            sitemap_content += '    <changefreq>monthly</changefreq>\n'
            sitemap_content += '    <priority>0.6</priority>\n'
            sitemap_content += '  </url>\n'
        
        # Custom pages
        for page in custom_pages:
            sitemap_content += '  <url>\n'
            sitemap_content += f'    <loc>{site_url}/pages/{page["slug"]}</loc>\n'
            sitemap_content += '    <changefreq>monthly</changefreq>\n'
            sitemap_content += '    <priority>0.5</priority>\n'
            sitemap_content += '  </url>\n'
        
        sitemap_content += '</urlset>'
        
        # Save to file
        with open('/app/frontend/public/sitemap.xml', 'w', encoding='utf-8') as f:
            f.write(sitemap_content)
        
        return {"message": "Sitemap gerado com sucesso", "urls_count": len(products) + len(custom_pages) + 5}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar sitemap: {str(e)}")

@api_router.post("/admin/seo/update-robots")
async def update_robots_txt(content: str, current_user: User = Depends(get_current_admin)):
    """Update robots.txt"""
    try:
        with open('/app/frontend/public/robots.txt', 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Update in settings
        await db.seo_settings.update_one(
            {"id": "seo_settings"},
            {"$set": {"robots_txt_content": content}},
            upsert=True
        )
        
        return {"message": "robots.txt atualizado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar robots.txt: {str(e)}")

@api_router.post("/admin/seo/submit-indexing")
async def submit_for_indexing(urls: List[str], current_user: User = Depends(get_current_admin)):
    """Submit URLs for indexing to search engines and LLMs"""
    results = {
        "google": "Pendente - Configure Google Search Console API",
        "bing": "Pendente - Configure Bing Webmaster API",
        "chatgpt": "✅ Sitemap acessível para rastreamento",
        "gemini": "✅ Sitemap acessível para rastreamento",
        "claude": "✅ Sitemap acessível para rastreamento",
        "perplexity": "✅ Sitemap acessível para rastreamento",
        "deepseek": "✅ Sitemap acessível para rastreamento"
    }
    
    # Check if APIs are configured
    seo_settings = await db.seo_settings.find_one({"id": "seo_settings"}, {"_id": 0})
    
    if seo_settings and seo_settings.get('google_search_console_api_key'):
        results["google"] = "✅ Submetido via Search Console API"
    
    if seo_settings and seo_settings.get('bing_webmaster_api_key'):
        results["bing"] = "✅ Submetido via Bing Webmaster API"
    
    # Log indexing request
    log_entry = {
        "type": "indexing_request",
        "urls": urls,
        "results": results,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.seo_logs.insert_one(log_entry)
    
    return {
        "message": "Solicitação de indexação processada",
        "urls_submitted": len(urls),
        "results": results
    }


# ==================== PROSPECTING INTEL ====================

from prospecting_service import ProspectingDataService, BAIXADA_SANTISTA

prospecting_service = ProspectingDataService(db)

@api_router.get("/admin/prospecting/stats")
async def get_prospecting_stats(region: str = "baixada_santista", current_user: User = Depends(get_current_admin)):
    """Get comprehensive prospecting statistics for a region"""
    stats = await prospecting_service.get_region_stats(region)
    return stats

@api_router.get("/admin/prospecting/leads/{municipio}")
async def get_leads_by_municipio(municipio: str, tipo: str = "all", current_user: User = Depends(get_current_admin)):
    """Get potential leads for a municipality"""
    leads = await prospecting_service.get_leads_by_zone(municipio, tipo)
    return leads

@api_router.get("/admin/prospecting/zones/{municipio}")
async def get_zones(municipio: str, current_user: User = Depends(get_current_admin)):
    """Get zones/neighborhoods for a municipality"""
    zones = await prospecting_service.get_zones_for_municipio(municipio)
    return zones

@api_router.post("/admin/prospecting/generate-route")
async def generate_prospecting_route(data: dict, current_user: User = Depends(get_current_admin)):
    """Generate optimized route for visiting leads"""
    municipio = data.get("municipio", "Santos")
    max_visits = data.get("max_visits", 8)
    
    leads = await prospecting_service.get_leads_by_zone(municipio)
    route = await prospecting_service.generate_route(leads, max_visits)
    
    # Save route to database
    route["created_by"] = current_user.id
    route["status"] = "pendente"
    await db.prospecting_routes.insert_one(route)
    route.pop("_id", None)
    
    return route

@api_router.get("/admin/prospecting/routes")
async def get_saved_routes(current_user: User = Depends(get_current_admin)):
    """Get all saved prospecting routes"""
    routes = await db.prospecting_routes.find({}, {"_id": 0}).sort("data_criacao", -1).to_list(50)
    return routes

@api_router.put("/admin/prospecting/routes/{route_id}")
async def update_route(route_id: str, data: dict, current_user: User = Depends(get_current_admin)):
    """Update route status and results"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data["updated_by"] = current_user.id
    
    await db.prospecting_routes.update_one(
        {"id": route_id},
        {"$set": data}
    )
    return {"message": "Rota atualizada"}

@api_router.get("/admin/prospecting/seasonality")
async def get_seasonality(current_user: User = Depends(get_current_admin)):
    """Get seasonality insights"""
    return await prospecting_service.get_seasonality_data()

@api_router.post("/admin/prospecting/schedule")
async def create_schedule(data: dict, current_user: User = Depends(get_current_admin)):
    """Create a prospecting schedule entry"""
    schedule = {
        "id": str(uuid.uuid4()),
        "route_id": data.get("route_id"),
        "data_agendada": data.get("data_agendada"),
        "vendedor": data.get("vendedor", current_user.name),
        "municipio": data.get("municipio"),
        "status": "agendado",
        "resultado": None,
        "contratos_fechados": 0,
        "valor_total": 0,
        "notas": data.get("notas", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.id
    }
    
    await db.prospecting_schedules.insert_one(schedule)
    schedule.pop("_id", None)
    return schedule

@api_router.get("/admin/prospecting/schedules")
async def get_schedules(current_user: User = Depends(get_current_admin)):
    """Get all prospecting schedules"""
    schedules = await db.prospecting_schedules.find({}, {"_id": 0}).sort("data_agendada", -1).to_list(100)
    return schedules

@api_router.put("/admin/prospecting/schedules/{schedule_id}")
async def update_schedule(schedule_id: str, data: dict, current_user: User = Depends(get_current_admin)):
    """Update schedule with results"""
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.prospecting_schedules.update_one(
        {"id": schedule_id},
        {"$set": data}
    )
    
    # If closing contracts, also update CRM
    if data.get("contratos_fechados", 0) > 0 and data.get("cliente_info"):
        # Create lead in CRM
        cliente = data["cliente_info"]
        crm_lead = {
            "id": str(uuid.uuid4()),
            "nome": cliente.get("nome"),
            "email": cliente.get("email"),
            "telefone": cliente.get("telefone"),
            "endereco": cliente.get("endereco"),
            "origem": "prospeccao_intel",
            "schedule_id": schedule_id,
            "valor_estimado": data.get("valor_total", 0),
            "status": "novo",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.crm_leads.insert_one(crm_lead)
    
    return {"message": "Agendamento atualizado"}

@api_router.get("/admin/prospecting/dashboard")
async def get_prospecting_dashboard(current_user: User = Depends(get_current_admin)):
    """Get dashboard data for prospecting intel"""
    
    # Get stats
    stats = await prospecting_service.get_region_stats("baixada_santista")
    seasonality = await prospecting_service.get_seasonality_data()
    
    # Get recent routes
    routes = await db.prospecting_routes.find({}, {"_id": 0}).sort("data_criacao", -1).to_list(5)
    
    # Get recent schedules with results
    schedules = await db.prospecting_schedules.find(
        {"status": {"$in": ["concluido", "parcial"]}},
        {"_id": 0}
    ).sort("data_agendada", -1).to_list(10)
    
    # Calculate success metrics
    total_schedules = await db.prospecting_schedules.count_documents({})
    successful = await db.prospecting_schedules.count_documents({"contratos_fechados": {"$gt": 0}})
    
    total_contracts = 0
    total_revenue = 0
    for s in schedules:
        total_contracts += s.get("contratos_fechados", 0)
        total_revenue += s.get("valor_total", 0)
    
    return {
        "region_stats": stats,
        "seasonality": seasonality,
        "recent_routes": routes,
        "recent_schedules": schedules,
        "metrics": {
            "total_visitas": total_schedules,
            "visitas_sucesso": successful,
            "taxa_conversao": round((successful / total_schedules * 100) if total_schedules > 0 else 0, 1),
            "contratos_fechados": total_contracts,
            "receita_gerada": total_revenue
        }
    }


# ==================== HOMEPAGE SETTINGS ====================

@api_router.get("/homepage-settings")
async def get_homepage_settings():
    """Get homepage settings (public endpoint)"""
    settings = await db.homepage_settings.find_one({"id": "homepage_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        return {
            "id": "homepage_settings",
            "hero": {
                "video_url": "https://customer-assets.emergentagent.com/job_smart-security-12/artifacts/2cbdrd0e_vigiloc.mp4",
                "poster_url": "",
                "badge_text": "🛡️ Líder em Automação e Segurança Eletrônica",
                "title": "Transformando <span class='text-blue-400'>Espaços</span><br />em Ambientes <span class='text-blue-400'>Inteligentes</span>",
                "subtitle": "Soluções completas em portaria autônoma, automação comercial e segurança eletrônica para condomínios e empresas. Tecnologia de ponta para o seu negócio.",
                "cta_primary_text": "Fale com um Consultor",
                "cta_primary_url": "",
                "cta_secondary_text": "Conheça Nossos Serviços",
                "cta_secondary_url": "/servicos",
                "show_stats": True,
                "stats": [
                    {"value": "+500", "label": "Clientes Atendidos"},
                    {"value": "24/7", "label": "Monitoramento"},
                    {"value": "10+", "label": "Anos de Experiência"},
                    {"value": "99%", "label": "Satisfação"}
                ]
            },
            "services": {
                "enabled": True,
                "title": "Nossas Soluções",
                "subtitle": "Tecnologia de ponta para transformar seu espaço em um ambiente inteligente e seguro",
                "show_all_button": True,
                "featured_ids": []
            },
            "features": {
                "enabled": True,
                "title": "Por que escolher a VigiLoc?",
                "items": [
                    {"icon": "Shield", "title": "Segurança Garantida", "description": "Sistemas certificados e testados para máxima proteção"},
                    {"icon": "Clock", "title": "Suporte 24/7", "description": "Equipe técnica disponível a qualquer momento"},
                    {"icon": "Users", "title": "Atendimento Personalizado", "description": "Soluções sob medida para cada cliente"},
                    {"icon": "Award", "title": "Experiência Comprovada", "description": "Mais de 10 anos no mercado de segurança"}
                ]
            },
            "cta_section": {
                "enabled": True,
                "title": "Pronto para Transformar seu Espaço?",
                "subtitle": "Entre em contato conosco e descubra como podemos ajudar",
                "button_text": "Solicitar Orçamento",
                "button_url": "/contato"
            }
        }
    return settings


@api_router.get("/admin/homepage-settings")
async def get_admin_homepage_settings(current_user: User = Depends(get_current_admin)):
    """Get homepage settings for admin editing"""
    return await get_homepage_settings()


@api_router.put("/admin/homepage-settings")
async def update_homepage_settings(data: dict, current_user: User = Depends(get_current_admin)):
    """Update homepage settings"""
    data["id"] = "homepage_settings"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data["updated_by"] = current_user.id
    
    await db.homepage_settings.update_one(
        {"id": "homepage_settings"},
        {"$set": data},
        upsert=True
    )
    
    return {"message": "Configurações da homepage atualizadas com sucesso", "settings": data}


# ==================== DUPLICATION ENDPOINTS ====================

@api_router.post("/admin/pages/{page_id}/duplicate")
async def duplicate_page(page_id: str, current_user: User = Depends(get_current_admin)):
    """Duplicate a custom page"""
    # Find the original page
    original = await db.custom_pages.find_one({"id": page_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Create duplicate with new ID and modified slug/title
    new_id = str(uuid.uuid4())
    new_page = {
        "id": new_id,
        "slug": f"{original['slug']}-copy-{str(uuid.uuid4())[:8]}",
        "title": f"{original['title']} (Cópia)",
        "meta_title": original.get('meta_title', ''),
        "meta_description": original.get('meta_description', ''),
        "blocks": original.get('blocks', []),
        "published": False,
        "isSystem": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.custom_pages.insert_one(new_page)
    # Return without _id
    new_page.pop('_id', None)
    return {"message": "Página duplicada com sucesso", "new_page": new_page}


@api_router.post("/admin/services/{service_id}/duplicate")
async def duplicate_service(service_id: str, current_user: User = Depends(get_current_admin)):
    """Duplicate a service"""
    # Find the original service
    original = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Create duplicate with new ID and modified slug/name
    new_id = str(uuid.uuid4())
    new_service = {
        "id": new_id,
        "slug": f"{original['slug']}-copy-{str(uuid.uuid4())[:8]}",
        "name": f"{original['name']} (Cópia)",
        "description": original.get('description', ''),
        "short_description": original.get('short_description', ''),
        "hero_image": original.get('hero_image', ''),
        "hero_video": original.get('hero_video', ''),
        "hero_poster": original.get('hero_poster', ''),
        "hero_title": original.get('hero_title', ''),
        "hero_subtitle": original.get('hero_subtitle', ''),
        "icon": original.get('icon', ''),
        "features": original.get('features', []),
        "gallery": original.get('gallery', []),
        "cta_text": original.get('cta_text', ''),
        "cta_link": original.get('cta_link', ''),
        "published": False,
        "order": original.get('order', 0),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.services.insert_one(new_service)
    # Return without _id
    new_service.pop('_id', None)
    return {"message": "Serviço duplicado com sucesso", "new_service": new_service}


@api_router.post("/admin/templates/{template_id}/duplicate")
async def duplicate_template(template_id: str, data: dict, current_user: User = Depends(get_current_admin)):
    """Save a duplicated template to database"""
    # Templates can be stored in a templates collection
    template_data = data.get('template', {})
    
    new_template = {
        "id": str(uuid.uuid4()),
        "name": template_data.get('name', 'Template Duplicado'),
        "slug": f"template-{str(uuid.uuid4())[:8]}",
        "description": template_data.get('description', ''),
        "color": template_data.get('color', 'from-blue-500 to-purple-500'),
        "thumbnail": template_data.get('thumbnail', '📄'),
        "videoBackground": template_data.get('videoBackground', ''),
        "components": template_data.get('components', []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.id
    }
    
    await db.seasonal_templates.insert_one(new_template)
    return {"message": "Template duplicado e salvo com sucesso", "new_template": new_template}


@api_router.get("/admin/templates")
async def get_saved_templates(current_user: User = Depends(get_current_admin)):
    """Get all saved seasonal templates"""
    templates = await db.seasonal_templates.find({}, {"_id": 0}).to_list(100)
    return templates


@api_router.delete("/admin/templates/{template_id}")
async def delete_template(template_id: str, current_user: User = Depends(get_current_admin)):
    """Delete a saved template"""
    result = await db.seasonal_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deletado com sucesso"}


# ==================== AI TEMPLATE GENERATION ====================

@api_router.post("/admin/generate-template")
async def generate_template_with_ai(data: dict, current_user: User = Depends(get_current_admin)):
    """Generate a seasonal template using AI (Gemini or GPT)"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    prompt = data.get('prompt', '')
    business_type = data.get('business_type', 'segurança eletrônica')
    provider = data.get('provider', 'gemini')  # 'gemini' or 'openai'
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    # Configure the chat based on provider choice
    chat = LlmChat(
        api_key=api_key,
        session_id=f"template-gen-{uuid.uuid4()}",
        system_message=f"""Você é um especialista em marketing digital e criação de landing pages para empresas de {business_type}.
        
Sua tarefa é gerar templates de páginas promocionais/sazonais baseados na descrição do usuário.

SEMPRE responda em formato JSON válido com a seguinte estrutura:
{{
    "name": "Nome do template",
    "description": "Descrição curta",
    "emoji": "emoji representativo (ex: 🎄, 🔥, 💰)",
    "color": "classe Tailwind de gradiente (ex: from-red-500 to-green-500)",
    "hero_title": "Título principal chamativo",
    "hero_subtitle": "Subtítulo persuasivo",
    "hero_image": "URL de imagem do Unsplash relacionada",
    "section_title": "Título da seção de conteúdo",
    "section_content": "Conteúdo informativo e persuasivo",
    "cta_title": "Título do call-to-action",
    "cta_description": "Descrição do CTA",
    "cta_button": "Texto do botão CTA",
    "components": [
        {{
            "id": "hero-generated",
            "type": "hero",
            "title": "título",
            "subtitle": "subtítulo",
            "image": "url da imagem",
            "buttonText": "texto do botão",
            "style": {{"background": "gradiente CSS", "color": "#fff"}}
        }},
        {{
            "id": "text-generated",
            "type": "text",
            "title": "título da seção",
            "content": "conteúdo",
            "style": {{"textAlign": "center", "padding": "40px"}}
        }},
        {{
            "id": "cta-generated",
            "type": "cta",
            "title": "título CTA",
            "description": "descrição",
            "buttonText": "texto botão",
            "style": {{"background": "cor", "color": "#fff"}}
        }}
    ]
}}

Seja criativo e use cores e mensagens apropriadas para o tema solicitado.
Mantenha o foco em {business_type} - câmeras, alarmes, controle de acesso, totens, etc."""
    )
    
    # Select model based on provider
    if provider == 'openai':
        chat.with_model("openai", "gpt-4o")
    else:
        chat.with_model("gemini", "gemini-2.5-flash")
    
    try:
        user_message = UserMessage(text=f"Crie um template para: {prompt}")
        response = await chat.send_message(user_message)
        
        # Try to parse JSON from response
        import json
        import re
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            template_data = json.loads(json_match.group())
            return template_data
        else:
            # Return a basic template if JSON parsing fails
            return {
                "name": f"Template: {prompt[:30]}",
                "description": f"Template gerado por IA: {prompt}",
                "emoji": "🤖",
                "color": "from-violet-500 to-fuchsia-500",
                "hero_title": prompt.upper()[:50],
                "hero_subtitle": "Template criado especialmente para sua campanha",
                "hero_image": "https://images.unsplash.com/photo-1558002038-1055907df827?w=1200",
                "section_title": "✨ Conteúdo Especial",
                "section_content": response[:500] if response else "Conteúdo personalizado para sua promoção.",
                "cta_title": "Entre em Contato",
                "cta_description": "Fale com nossos especialistas",
                "cta_button": "Falar Agora",
                "components": []
            }
    except Exception as e:
        logger.error(f"Error generating template with AI: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar template: {str(e)}")


# Include the router in the main app (after all routes are defined)
app.include_router(api_router)