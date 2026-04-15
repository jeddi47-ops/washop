from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def create_indexes():
    """Create all required MongoDB indexes on startup."""
    try:
        # Users
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        await db.users.create_index("deleted_at")

        # Vendors
        await db.vendors.create_index("user_id", unique=True)
        await db.vendors.create_index("shop_slug", unique=True)
        await db.vendors.create_index([("subscription_expires_at", 1), ("is_active", 1)])
        await db.vendors.create_index("deleted_at")

        # Categories
        await db.categories.create_index("slug", unique=True)

        # Products - text index for full-text search
        await db.products.create_index([("name", "text"), ("description", "text")], default_language="french")
        await db.products.create_index([("vendor_id", 1), ("is_active", 1), ("deleted_at", 1)])
        await db.products.create_index("category_id")
        await db.products.create_index("deleted_at")

        # Product images
        await db.product_images.create_index("product_id")

        # Orders
        await db.orders.create_index([("client_id", 1), ("created_at", -1)])
        await db.orders.create_index([("vendor_id", 1), ("created_at", -1)])
        await db.orders.create_index("idempotency_key", unique=True)

        # Order items
        await db.order_items.create_index("order_id")

        # Reviews
        await db.reviews.create_index([("target_id", 1), ("type", 1), ("status", 1)])
        await db.reviews.create_index([("client_id", 1), ("order_id", 1), ("type", 1)], unique=True)

        # Access keys
        await db.access_keys.create_index([("key_code", 1), ("is_used", 1), ("is_blacklisted", 1)])
        await db.access_keys.create_index("batch_id")

        # Notifications
        await db.notifications.create_index([("user_id", 1), ("is_read", 1)])

        # Search misses
        await db.search_misses.create_index([("search_query", 1), ("searched_at", -1)])

        # Wishlist
        await db.wishlist.create_index([("client_id", 1), ("product_id", 1)], unique=True)

        # Claims
        await db.claims.create_index("client_id")
        await db.claims.create_index("assigned_to")
        await db.claim_messages.create_index("claim_id")

        # Flash sales
        await db.flash_sales.create_index([("is_active", 1), ("ends_at", 1)])

        # Featured products
        await db.featured_products.create_index([("type", 1), ("ends_at", 1)])

        # Admin logs
        await db.admin_logs.create_index("admin_id")

        # History
        await db.history.create_index("user_id")

        # Login attempts & password reset
        await db.login_attempts.create_index("identifier")
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)

        # Subscription history
        await db.subscription_history.create_index("vendor_id")

        logger.info("All MongoDB indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
