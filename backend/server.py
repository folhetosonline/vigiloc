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
    google_id: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

class PageContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    page_name: str
    sections: dict
    images: dict
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    price: float = 0.0
    min_days: int = 0
    max_days: int = 0
    active: bool = True

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

# ==================== UPLOAD ROUTES ====================

@api_router.post("/upload")
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
    
    return {
        "url": f"/uploads/{file_name}",
        "size": f"{file_size_mb:.2f}MB",
        "type": file.content_type
    }

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product.get('timestamp'), str):
            product['timestamp'] = datetime.fromisoformat(product['timestamp'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('timestamp'), str):
        product['timestamp'] = datetime.fromisoformat(product['timestamp'])
    return product

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
    
    await db.products.update_one({"id": product_id}, {"$set": updated_doc})
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(product.get('timestamp'), str):
        product['timestamp'] = datetime.fromisoformat(product['timestamp'])
    return Product(**product)

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    media_type: str
    media_url: str
    link_url: Optional[str] = None
    order: int = 0
    active: bool = True

@api_router.get("/banners", response_model=List[Banner])
async def get_banners():
    banners = await db.banners.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    for banner in banners:
        if isinstance(banner.get('created_at'), str):
            banner['created_at'] = datetime.fromisoformat(banner['created_at'])
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
    result = await db.banners.update_one({"id": banner_id}, {"$set": banner_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    banner = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    if isinstance(banner.get('created_at'), str):
        banner['created_at'] = datetime.fromisoformat(banner['created_at'])
    return Banner(**banner)

@api_router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str, current_user: User = Depends(get_current_admin)):
    result = await db.banners.delete_one({"id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted successfully"}

@api_router.get("/admin/banners", response_model=List[Banner])
async def get_all_banners_admin(current_user: User = Depends(get_current_admin)):
    banners = await db.banners.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for banner in banners:
        if isinstance(banner.get('created_at'), str):
            banner['created_at'] = datetime.fromisoformat(banner['created_at'])
    return banners

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

# Include the router in the main app
app.include_router(api_router)

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
    client.close()