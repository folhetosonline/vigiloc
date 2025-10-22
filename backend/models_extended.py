# Additional models for enhanced features

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str  # 'percentage', 'fixed'
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

class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: Optional[str] = None
    media_type: str  # 'image', 'video'
    media_url: str
    link_url: Optional[str] = None
    order: int = 0
    active: bool = True
    published: bool = False  # Controls if banner is live on website
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None

class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    media_type: str
    media_url: str
    link_url: Optional[str] = None
    order: int = 0
    active: bool = True
