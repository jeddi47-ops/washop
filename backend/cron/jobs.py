"""
Cron jobs for Washop scheduled tasks.
Uses APScheduler for background task scheduling.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def deactivate_expired_subscriptions():
    """Daily midnight: deactivate vendors with expired subscriptions."""
    from database import db
    now = datetime.now(timezone.utc)

    # Deactivate expired subscriptions
    result = await db.vendors.update_many(
        {
            "is_active": True,
            "deleted_at": None,
            "$or": [
                {"subscription_expires_at": {"$lt": now, "$ne": None}},
                {"trial_expires_at": {"$lt": now}, "subscription_expires_at": None}
            ]
        },
        {"$set": {"is_active": False}}
    )
    if result.modified_count > 0:
        logger.info(f"Deactivated {result.modified_count} expired subscriptions")


async def deactivate_expired_flash_sales():
    """Daily midnight: deactivate expired flash sales."""
    from database import db
    now = datetime.now(timezone.utc)
    result = await db.flash_sales.update_many(
        {"is_active": True, "ends_at": {"$lt": now}},
        {"$set": {"is_active": False}}
    )
    if result.modified_count > 0:
        logger.info(f"Deactivated {result.modified_count} expired flash sales")


async def remove_expired_featured():
    """Daily midnight: remove expired featured products."""
    from database import db
    now = datetime.now(timezone.utc)
    result = await db.featured_products.delete_many({"ends_at": {"$lt": now}})
    if result.deleted_count > 0:
        logger.info(f"Removed {result.deleted_count} expired featured products")


async def send_subscription_expiry_warnings():
    """Daily 8am: warn vendors 3 days before subscription expiry."""
    from database import db
    from utils.email_service import send_subscription_expiry_warning
    now = datetime.now(timezone.utc)
    three_days = now + timedelta(days=3)

    vendors = await db.vendors.find({
        "is_active": True,
        "deleted_at": None,
        "subscription_expires_at": {
            "$gte": now,
            "$lte": three_days
        }
    }).to_list(None)

    for vendor in vendors:
        user = await db.users.find_one({"_id": __import__('bson').ObjectId(vendor["user_id"])})
        if user:
            expires_str = vendor["subscription_expires_at"].strftime("%d/%m/%Y")
            await send_subscription_expiry_warning(user["email"], vendor["shop_name"], expires_str)

            await db.notifications.insert_one({
                "user_id": vendor["user_id"],
                "message": f"Votre abonnement expire le {expires_str}. Activez une nouvelle clé!",
                "type": "subscription_expiry_warning",
                "is_read": False,
                "created_at": now
            })

    if vendors:
        logger.info(f"Sent expiry warnings to {len(vendors)} vendors")


async def send_weekly_search_misses_report():
    """Monday 8am: send top 10 search misses to Extra vendors."""
    from database import db
    from utils.email_service import send_weekly_search_misses
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Get top 10 search misses
    pipeline = [
        {"$match": {"searched_at": {"$gte": week_ago}}},
        {"$group": {"_id": {"$toLower": "$search_query"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    misses = await db.search_misses.aggregate(pipeline).to_list(10)

    # Need minimum 10 unique searches
    total_unique = len(misses)
    if total_unique < 10:
        logger.info(f"Only {total_unique} unique search misses, minimum 10 required")
        return

    misses_data = [{"query": m["_id"], "count": m["count"]} for m in misses]

    # Send to Extra vendors
    extra_vendors = await db.vendors.find({
        "subscription_type": "extra",
        "is_active": True,
        "deleted_at": None
    }).to_list(None)

    for vendor in extra_vendors:
        user = await db.users.find_one({"_id": __import__('bson').ObjectId(vendor["user_id"])})
        if user:
            await send_weekly_search_misses(user["email"], vendor["shop_name"], misses_data)

    if extra_vendors:
        logger.info(f"Sent weekly search misses report to {len(extra_vendors)} Extra vendors")


async def send_monthly_stats_report():
    """1st of month 8am: send monthly stats to all vendors."""
    from database import db
    from utils.email_service import send_monthly_stats
    from datetime import datetime
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    vendors = await db.vendors.find({"deleted_at": None}).to_list(None)

    for vendor in vendors:
        vid = str(vendor["_id"])
        user = await db.users.find_one({"_id": __import__('bson').ObjectId(vendor["user_id"])})
        if not user:
            continue

        total_orders = await db.orders.count_documents({
            "vendor_id": vid,
            "created_at": {"$gte": month_ago}
        })

        # Total clicks
        pipeline = [
            {"$match": {"vendor_id": vid, "deleted_at": None}},
            {"$group": {"_id": None, "total_clicks": {"$sum": "$click_count"}}}
        ]
        clicks = await db.products.aggregate(pipeline).to_list(1)
        total_clicks = clicks[0]["total_clicks"] if clicks else 0
        conversion = (total_orders / total_clicks * 100) if total_clicks > 0 else 0

        # Best product
        best_pipeline = [
            {"$match": {"vendor_id": vid}},
            {"$lookup": {"from": "order_items", "localField": "_id", "foreignField": "product_id", "as": "order_items"}},
            {"$addFields": {"order_count": {"$size": "$order_items"}}},
            {"$sort": {"order_count": -1}},
            {"$limit": 1}
        ]
        # Simplified: get most clicked product
        best = await db.products.find(
            {"vendor_id": vid, "deleted_at": None}
        ).sort("click_count", -1).limit(1).to_list(1)

        stats = {
            "total_orders": total_orders,
            "total_clicks": total_clicks,
            "conversion_rate": round(conversion, 1),
            "best_product": best[0]["name"] if best else "N/A"
        }

        await send_monthly_stats(user["email"], vendor["shop_name"], stats)

    logger.info(f"Sent monthly stats to {len(vendors)} vendors")


def setup_cron_jobs():
    """Configure and start all cron jobs."""
    # Daily at midnight
    scheduler.add_job(deactivate_expired_subscriptions, 'cron', hour=0, minute=0)
    scheduler.add_job(deactivate_expired_flash_sales, 'cron', hour=0, minute=0)
    scheduler.add_job(remove_expired_featured, 'cron', hour=0, minute=0)

    # Daily at 8am
    scheduler.add_job(send_subscription_expiry_warnings, 'cron', hour=8, minute=0)

    # Monday at 8am
    scheduler.add_job(send_weekly_search_misses_report, 'cron', day_of_week='mon', hour=8, minute=0)

    # 1st of month at 8am
    scheduler.add_job(send_monthly_stats_report, 'cron', day=1, hour=8, minute=0)

    scheduler.start()
    logger.info("Cron jobs scheduled successfully")
