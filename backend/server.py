from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
import sys

# Add backend dir to path for imports
sys.path.insert(0, str(ROOT_DIR))

from database import db, create_indexes
from middleware.auth import hash_password, verify_password
from cron.jobs import setup_cron_jobs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def seed_admin():
    """Seed admin user on startup."""
    from datetime import datetime, timezone
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@washop.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "WashopAdmin2024!")

    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "name": "Admin Washop",
            "email": admin_email,
            "password_hash": hashed,
            "address": "",
            "role": "admin",
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "deleted_at": None
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")

    # Write credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Washop Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write(f"- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/v1/auth/register\n")
        f.write("- POST /api/v1/auth/login\n")
        f.write("- POST /api/v1/auth/logout\n")
        f.write("- GET /api/v1/auth/me\n")
        f.write("- POST /api/v1/auth/refresh\n")
        f.write("- POST /api/v1/auth/forgot-password\n")
        f.write("- POST /api/v1/auth/reset-password\n\n")
        f.write("## API Base\n")
        f.write("- All routes prefixed with /api/v1/\n")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    logger.info("Starting Washop API...")
    await create_indexes()
    await seed_admin()
    setup_cron_jobs()
    logger.info("Washop API ready!")
    yield
    from database import client
    client.close()
    logger.info("Washop API shut down")


# Create FastAPI app
app = FastAPI(
    title="Washop API",
    description="API pour Washop - Marketplace WhatsApp globale",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["100/15minutes"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Erreur interne du serveur", "errors": []}
    )


# Import and include all routers
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.vendors import router as vendors_router
from routes.categories import router as categories_router
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.reviews import router as reviews_router
from routes.access_keys import router as access_keys_router
from routes.wishlist import router as wishlist_router
from routes.claims import router as claims_router
from routes.flash_sales import router as flash_sales_router, featured_router
from routes.notifications import router as notifications_router
from routes.admin import router as admin_router
from routes.search import router as search_router
from routes.cloudinary_routes import router as cloudinary_router

# All routes under /api/v1/
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(vendors_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(access_keys_router, prefix="/api/v1")
app.include_router(wishlist_router, prefix="/api/v1")
app.include_router(claims_router, prefix="/api/v1")
app.include_router(flash_sales_router, prefix="/api/v1")
app.include_router(featured_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(cloudinary_router, prefix="/api/v1")


# Health check
@app.get("/api/health")
async def health_check():
    return {"success": True, "message": "Washop API opérationnelle", "version": "1.0.0"}


@app.get("/api")
async def api_root():
    return {
        "success": True,
        "message": "Bienvenue sur l'API Washop",
        "version": "1.0.0",
        "docs": "/api/docs"
    }
