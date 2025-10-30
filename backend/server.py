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
    role: str = "viewer"  # admin, manager, editor, viewer
    google_id: Optional[str] = None
    picture: Optional[str] = None
    active: bool = True
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
    regions: Optional[List[str]] = None

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
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NavbarSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "navbar_settings"
    background_color: str = "#FFFFFF"
    text_color: str = "#1F2937"
    hover_color: str = "#3B82F6"
    font_family: str = "Inter"
    font_size: str = "base"  # sm, base, lg
    height: str = "16"  # Tailwind units (16 = 4rem = 64px)
    logo_size: str = "10"  # Tailwind units
    show_logo: bool = True
    show_site_name: bool = True
    sticky: bool = True
    shadow: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SystemPage(BaseModel):
    """Pages that are part of the system (not custom)"""
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    editable: bool = True  # If content blocks can be added
    removable: bool = False  # System pages cannot be removed


# ==================== ADVANCED ADMIN MODELS ====================

class CustomPage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str  # URL da página (ex: /sobre-nos)
    title: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    blocks: List[dict] = []  # Blocos JSON do page builder
    published: bool = False
    published_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
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
    status: str = "pending"  # pending, confirmed, processing, shipped, delivered, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    
    # Check cookie first
    token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

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

@api_router.post("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session")
        
        session_data = resp.json()
    
    # Check if user exists
    user = await db.users.find_one({"email": session_data['email']}, {"_id": 0})
    
    if not user:
        # Create new user
        new_user = User(
            email=session_data['email'],
            name=session_data['name'],
            google_id=session_data['id'],
            picture=session_data.get('picture'),
            is_admin=False
        )
        doc = new_user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
        user = doc
    
    # Create JWT token
    token = create_access_token({"sub": user['id']})
    
    # Store session
    session = Session(
        user_id=user['id'],
        session_token=session_data['session_token'],
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    sess_doc = session.model_dump()
    sess_doc['expires_at'] = sess_doc['expires_at'].isoformat()
    sess_doc['created_at'] = sess_doc['created_at'].isoformat()
    await db.sessions.insert_one(sess_doc)
    
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

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name, "is_admin": current_user.is_admin}

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(key="session_token", path="/")
    await db.sessions.delete_many({"user_id": current_user.id})
    return {"message": "Logged out successfully"}


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
    
    # Get backend URL from env and use /api/media/ endpoint
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    full_url = f"{backend_url}/media/{file_name}"
    
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

# ==================== MENU BUILDER ROUTES ====================

@api_router.get("/menus/{menu_name}")
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


# Include the router in the main app (after all routes are defined)
app.include_router(api_router)