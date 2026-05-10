from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


# ============== ENUMS ==============
class UserRole(str, Enum):
    client = "client"
    vendor = "vendor"
    admin = "admin"
    employee = "employee"

class UserStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    banned = "banned"

class SubscriptionType(str, Enum):
    basic = "basic"
    premium = "premium"
    extra = "extra"

class SubscriptionDuration(str, Enum):
    monthly = "monthly"
    annual = "annual"

class SubscriptionAction(str, Enum):
    new = "new"
    renewal = "renewal"
    upgrade = "upgrade"
    extension = "extension"

class OrderStatus(str, Enum):
    pending = "pending"
    whatsapp_redirected = "whatsapp_redirected"
    confirmed = "confirmed"
    cancelled = "cancelled"

class ReviewType(str, Enum):
    product = "product"
    vendor = "vendor"

class ReviewStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class ClaimStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class SenderRole(str, Enum):
    client = "client"
    admin = "admin"
    employee = "employee"

class FeaturedType(str, Enum):
    daily = "daily"
    promoted = "promoted"


# ============== HELPERS ==============
def utc_now():
    return datetime.now(timezone.utc)

def new_id():
    return str(uuid.uuid4())


# ============== AUTH SCHEMAS ==============
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=200)
    password: str = Field(..., min_length=6, max_length=128)
    address: Optional[str] = Field(None, max_length=500)
    role: UserRole = UserRole.client
    accept_terms: bool = Field(..., description="L'utilisateur accepte les CGU et la politique de confidentialité")

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v):
        return v.strip().lower()

    @field_validator('accept_terms')
    @classmethod
    def must_accept_terms(cls, v):
        if v is not True:
            raise ValueError("Vous devez accepter les CGU et la politique de confidentialité pour créer un compte")
        return v

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v):
        return v.strip().lower()

class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v):
        return v.strip().lower()

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=8, max_length=200)


# ============== USER SCHEMAS ==============
class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    address: Optional[str] = None
    role: UserRole
    status: UserStatus = UserStatus.active
    email_verified: bool = False
    terms_accepted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, max_length=500)


# ============== VENDOR SCHEMAS ==============
class VendorCreate(BaseModel):
    shop_name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    whatsapp_number: str = Field(..., min_length=8, max_length=20)
    social_links: Optional[dict] = None

    @field_validator('social_links')
    @classmethod
    def validate_social_links(cls, v):
        if v is None:
            return {}
        allowed = {'instagram_url', 'tiktok_url', 'facebook_url'}
        return {k: v2 for k, v2 in v.items() if k in allowed}

class VendorUpdate(BaseModel):
    shop_name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    whatsapp_number: Optional[str] = Field(None, min_length=8, max_length=20)
    social_links: Optional[dict] = None
    avatar_url: Optional[str] = Field(None, max_length=1000)
    banner_url: Optional[str] = Field(None, max_length=1000)
    shop_theme: Optional[str] = Field(None, max_length=30)

    @field_validator('social_links')
    @classmethod
    def validate_social_links(cls, v):
        if v is None:
            return None
        allowed = {'instagram_url', 'tiktok_url', 'facebook_url'}
        return {k: v2 for k, v2 in v.items() if k in allowed}

class VendorResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    shop_name: str
    shop_slug: str
    description: Optional[str] = None
    whatsapp_number: str
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    shop_theme: Optional[str] = None
    subscription_type: Optional[SubscriptionType] = None
    subscription_duration: Optional[SubscriptionDuration] = None
    subscription_started_at: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None
    trial_started_at: Optional[datetime] = None
    trial_expires_at: Optional[datetime] = None
    is_verified: bool = False
    is_paused: bool = False
    is_active: bool = True
    avg_product_rating: float = 0.0
    avg_vendor_rating: float = 0.0
    social_links: Optional[dict] = None
    created_at: Optional[datetime] = None


# ============== CATEGORY SCHEMAS ==============
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    created_by: str
    created_at: Optional[datetime] = None


# ============== PRODUCT SCHEMAS ==============
class ProductCreate(BaseModel):
    category_id: str
    name: str = Field(..., min_length=2, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    price: float = Field(..., gt=0)
    currency: str = Field("USD", max_length=10)
    stock: int = Field(..., ge=0)
    is_featured: bool = False

class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = Field(None, min_length=2, max_length=300)
    description: Optional[str] = Field(None, max_length=5000)
    price: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    stock: Optional[int] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "USD"
    stock: int
    is_featured: bool = False
    is_active: bool = True
    click_count: int = 0
    images: Optional[List[dict]] = None
    created_at: Optional[datetime] = None

class ProductImageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    cloudinary_url: str
    cloudinary_public_id: str
    position: int
    created_at: Optional[datetime] = None


# ============== ORDER SCHEMAS ==============
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    vendor_id: str
    items: List[OrderItemCreate] = Field(..., min_length=1)
    idempotency_key: str = Field(..., min_length=1, max_length=200)

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_id: str
    vendor_id: str
    status: OrderStatus
    whatsapp_url: Optional[str] = None
    idempotency_key: str
    whatsapp_redirected_at: Optional[datetime] = None
    items: Optional[List[dict]] = None
    created_at: Optional[datetime] = None


# ============== REVIEW SCHEMAS ==============
class ReviewCreate(BaseModel):
    order_id: str
    type: ReviewType
    target_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)

class ReviewModerate(BaseModel):
    status: ReviewStatus

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_id: str
    order_id: str
    type: ReviewType
    target_id: str
    rating: int
    comment: Optional[str] = None
    status: ReviewStatus = ReviewStatus.pending
    moderated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============== ACCESS KEY SCHEMAS ==============
class AccessKeyBulkCreate(BaseModel):
    type: SubscriptionType
    duration: SubscriptionDuration
    quantity: int = Field(..., gt=0, le=1000)

class AccessKeyActivate(BaseModel):
    key_code: str

class AccessKeyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    key_code: str
    type: SubscriptionType
    duration: SubscriptionDuration
    is_used: bool = False
    is_blacklisted: bool = False
    used_by: Optional[str] = None
    vendor_id: Optional[str] = None
    used_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    batch_id: Optional[str] = None


# ============== WISHLIST SCHEMAS ==============
class WishlistAdd(BaseModel):
    product_id: str

class WishlistResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_id: str
    product_id: str
    product: Optional[dict] = None
    created_at: Optional[datetime] = None


# ============== CLAIM SCHEMAS ==============
class ClaimCreate(BaseModel):
    vendor_id: str
    order_id: Optional[str] = None
    subject: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=2, max_length=5000)

class ClaimMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)

class ClaimResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    client_id: str
    vendor_id: str
    order_id: Optional[str] = None
    subject: str
    message: str
    status: ClaimStatus = ClaimStatus.open
    assigned_to: Optional[str] = None
    created_at: Optional[datetime] = None

class ClaimMessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    claim_id: str
    sender_id: str
    sender_role: SenderRole
    message: str
    created_at: Optional[datetime] = None


# ============== FLASH SALE SCHEMAS ==============
class FlashSaleCreate(BaseModel):
    product_id: str
    discount_percentage: int = Field(..., gt=0, le=100)
    starts_at: datetime
    ends_at: datetime

class FlashSaleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    vendor_id: str
    discount_percentage: int
    discounted_price: float
    starts_at: datetime
    ends_at: datetime
    is_active: bool = True
    created_by: str
    created_at: Optional[datetime] = None


# ============== FEATURED PRODUCT SCHEMAS ==============
class FeaturedProductCreate(BaseModel):
    product_id: str
    type: FeaturedType
    starts_at: datetime
    ends_at: datetime

class FeaturedProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    vendor_id: str
    type: FeaturedType
    starts_at: datetime
    ends_at: datetime
    created_at: Optional[datetime] = None


# ============== NOTIFICATION SCHEMAS ==============
class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    message: str
    type: str
    is_read: bool = False
    created_at: Optional[datetime] = None


# ============== SEARCH SCHEMAS ==============
class SearchQuery(BaseModel):
    q: str = Field(..., min_length=1, max_length=200)
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


# ============== ADMIN LOG SCHEMAS ==============
class AdminLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    admin_id: str
    action_type: str
    target_type: str
    target_id: str
    description: str
    created_at: Optional[datetime] = None


# ============== SUBSCRIPTION HISTORY SCHEMAS ==============
class SubscriptionHistoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    access_key_id: str
    type: SubscriptionType
    duration: SubscriptionDuration
    started_at: datetime
    expires_at: datetime
    action: SubscriptionAction
    created_at: Optional[datetime] = None


# ============== PAGINATION ==============
class PaginatedResponse(BaseModel):
    success: bool = True
    data: List[Any]
    total: int
    page: int
    limit: int
    totalPages: int
    message: Optional[str] = None
